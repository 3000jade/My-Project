import crypto from 'crypto';
import type { Request, Response } from 'express';
import config from '../config/index';
import { supabase } from '../config/supabase';
import { SessionService } from '../services/session.service';
import { LiveAgentRoutingService } from '../services/liveAgentRouting.service';
import { InquiryService } from '../services/inquiry.service';
import { subscribeVisitorInquiryStream } from '../utils/inquiryStream';

const LIVE_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function getLiveChatSigningSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    config.supabaseServiceRoleKey ||
    config.supabaseAnonKey ||
    'hsr-live-chat-dev-secret'
  );
}

export function signLiveChatToken(inquiryId: string, email: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      inquiryId,
      email: email.trim().toLowerCase(),
      exp: Date.now() + LIVE_TOKEN_TTL_MS,
    })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getLiveChatSigningSecret())
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyLiveChatToken(
  token: string,
  expectedInquiryId: string
): { valid: boolean; email?: string } {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { valid: false };
  }
  const [payloadB64, sigB64] = token.split('.');
  if (!payloadB64 || !sigB64) return { valid: false };

  const expectedSig = crypto
    .createHmac('sha256', getLiveChatSigningSecret())
    .update(payloadB64)
    .digest('base64url');

  const sigBuf = Buffer.from(sigB64);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return { valid: false };
  }

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!parsed || parsed.inquiryId !== expectedInquiryId) {
      return { valid: false };
    }
    if (typeof parsed.exp !== 'number' || Date.now() > parsed.exp) {
      return { valid: false };
    }
    return { valid: true, email: parsed.email };
  } catch {
    return { valid: false };
  }
}

async function resolveOptionalJwtUser(
  req: Request
): Promise<{ id: string; role: string; email?: string; name?: string } | null> {
  const authHeader = req.headers.authorization;
  const queryToken = typeof req.query.authToken === 'string' ? req.query.authToken : undefined;
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : queryToken;
  if (!bearer) return null;

  try {
    const localSession = SessionService.verifySessionToken(bearer);
    if (localSession?.userId) {
      return {
        id: String(localSession.userId),
        role: String(localSession.role || 'client').toLowerCase(),
        email: localSession.email,
      };
    }

    const { data } = await supabase.auth.getUser(bearer);
    if (data?.user?.id) {
      return {
        id: String(data.user.id),
        role: String(data.user.user_metadata?.role || 'client').toLowerCase(),
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
      };
    }
  } catch {
    // Ignore invalid optional auth token
  }
  return null;
}

async function authorizeLiveInquiry(
  req: Request,
  inquiryId: string
): Promise<{ authorized: boolean; senderName?: string; senderId?: string }> {
  const guestToken =
    (typeof req.headers['x-live-chat-token'] === 'string' && req.headers['x-live-chat-token']) ||
    (typeof req.query.token === 'string' && req.query.token) ||
    '';

  if (guestToken) {
    const check = verifyLiveChatToken(guestToken, inquiryId);
    if (check.valid) {
      return { authorized: true };
    }
  }

  const user = await resolveOptionalJwtUser(req);
  if (user) {
    try {
      const inq = await InquiryService.getInquiryById(inquiryId, user.role, user.id, user.email);
      if (inq) {
        return { authorized: true, senderId: user.id, senderName: user.name || inq.name };
      }
    } catch {
      return { authorized: false };
    }
  }

  return { authorized: false };
}

export async function getLiveAgents(req: Request, res: Response): Promise<void> {
  try {
    const propertyId = typeof req.query.propertyId === 'string' ? req.query.propertyId.trim() : undefined;
    const city = typeof req.query.city === 'string' ? req.query.city.trim() : undefined;
    const district = typeof req.query.district === 'string' ? req.query.district.trim() : undefined;
    const propertyType = typeof req.query.propertyType === 'string' ? req.query.propertyType.trim() : undefined;

    const result = await LiveAgentRoutingService.getRecommendedLiveAgents({
      propertyId,
      city,
      district,
      propertyType,
      limit: 5,
    });

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Unable to check available agents right now.',
      timestamp: new Date().toISOString(),
    });
  }
}

export async function startLiveHandoff(req: Request, res: Response): Promise<void> {
  try {
    const {
      name,
      email,
      phone,
      message,
      propertyId,
      propertyTitle,
      propertyPrice,
      city,
      district,
      propertyType,
      selectedAgentId,
      consentAccepted,
    } = req.body || {};

    if (!consentAccepted) {
      res.status(400).json({
        success: false,
        error: 'Please agree to the privacy notice to continue.',
      });
      return;
    }

    if (!name || !String(name).trim() || !email || !String(email).trim()) {
      res.status(400).json({
        success: false,
        error: 'Please enter your name and email address.',
      });
      return;
    }

    const routingContext = { propertyId, city, district, propertyType, limit: 5 };
    const { agents } = await LiveAgentRoutingService.getRecommendedLiveAgents(routingContext);

    let chosenAgent = selectedAgentId
      ? agents.find((a) => a.id === String(selectedAgentId))
      : agents[0];

    if (selectedAgentId && !chosenAgent) {
      res.status(409).json({
        success: false,
        code: 'AGENT_UNAVAILABLE',
        error: 'That agent just stepped away. Would you like to connect with our next available specialist?',
        data: { nextBestAgent: agents[0] || null },
      });
      return;
    }

    const authUser = await resolveOptionalJwtUser(req);

    const inquiry = await InquiryService.createInquiry({
      clientId: authUser?.id,
      name: String(name).trim(),
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : undefined,
      propertyId,
      propertyTitle,
      propertyPrice: propertyPrice !== undefined && propertyPrice !== null ? String(propertyPrice) : undefined,
      message: (message && String(message).trim()) || 'Visitor requested a live agent via chat.',
      source: 'ai_chatbot_live',
      preferredReplyChannel: 'chat',
      agentId: chosenAgent?.id,
      agentName: chosenAgent?.name,
    });

    if (chosenAgent) {
      LiveAgentRoutingService.scheduleAutoPass(inquiry.id, chosenAgent.id, routingContext);
    }

    const liveChatToken = authUser ? undefined : signLiveChatToken(inquiry.id, String(email));

    res.status(201).json({
      success: true,
      data: {
        inquiryId: inquiry.id,
        referenceCode: inquiry.referenceCode,
        agent: chosenAgent || null,
        liveChatToken,
        messages: inquiry.messages || [],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Unable to start live chat right now.',
      timestamp: new Date().toISOString(),
    });
  }
}

export async function streamLiveChat(req: Request, res: Response): Promise<void> {
  const inquiryId = String(req.params.inquiryId);
  const auth = await authorizeLiveInquiry(req, inquiryId);
  if (!auth.authorized) {
    res.status(401).json({ success: false, error: 'Invalid or expired live chat session.' });
    return;
  }

  const unsubscribe = subscribeVisitorInquiryStream(inquiryId, res);
  req.on('close', () => {
    unsubscribe();
  });
}

export async function getLiveMessages(req: Request, res: Response): Promise<void> {
  const inquiryId = String(req.params.inquiryId);
  const auth = await authorizeLiveInquiry(req, inquiryId);
  if (!auth.authorized) {
    res.status(401).json({ success: false, error: 'Invalid or expired live chat session.' });
    return;
  }

  const inquiry = await InquiryService.getInquiryById(inquiryId, 'admin');
  if (!inquiry) {
    res.status(404).json({ success: false, error: 'Live chat conversation not found.' });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      inquiryId: inquiry.id,
      referenceCode: inquiry.referenceCode,
      agentName: inquiry.agentName || null,
      operationalStatus: inquiry.operationalStatus,
      messages: (inquiry.messages || []).map((m) => ({
        id: m.id,
        sender: m.sender,
        sender_name: m.sender_name || m.senderName,
        content: m.content,
        timestamp: m.timestamp,
      })),
    },
  });
}

export async function postLiveMessage(req: Request, res: Response): Promise<void> {
  const inquiryId = String(req.params.inquiryId);
  const auth = await authorizeLiveInquiry(req, inquiryId);
  if (!auth.authorized) {
    res.status(401).json({ success: false, error: 'Invalid or expired live chat session.' });
    return;
  }

  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
  if (!content) {
    res.status(400).json({ success: false, error: 'Message content is required.' });
    return;
  }

  const inquiry = await InquiryService.getInquiryById(inquiryId, 'admin');
  if (!inquiry) {
    res.status(404).json({ success: false, error: 'Live chat conversation not found.' });
    return;
  }

  const saved = await InquiryService.addMessage(inquiryId, {
    senderId: auth.senderId,
    sender: 'client',
    senderName: auth.senderName || inquiry.name || 'Visitor',
    content,
    requestId: typeof req.body?.requestId === 'string' ? req.body.requestId : undefined,
  });

  res.status(201).json({
    success: true,
    data: {
      id: saved.id,
      sender: saved.sender,
      sender_name: saved.sender_name,
      content: saved.content,
      timestamp: saved.timestamp,
    },
  });
}

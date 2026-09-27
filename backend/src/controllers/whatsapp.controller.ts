import { Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsapp.service';
import type { ApiResponse } from '../types/api';

export class WhatsAppController {
  /**
   * GET /api/whatsapp/link
   * Generate pre-composed WhatsApp click-to-chat inquiry link
   */
  public static async getInquiryLink(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { phone, listingId, propertyTitle, price, clientName } = req.query as Record<string, string>;

      if (!phone || !propertyTitle) {
        res.status(400).json({
          success: false,
          error: 'phone and propertyTitle query parameters are required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const link = WhatsAppService.generateInquiryLink({
        phone,
        listingId: listingId || 'GENERAL',
        propertyTitle,
        price,
        clientName,
      });

      res.status(200).json({
        success: true,
        data: { link },
        message: 'WhatsApp click-to-chat link generated.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error generating WhatsApp link.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/whatsapp/send
   * Dispatch lead alert via WhatsApp Cloud API
   */
  public static async sendAlert(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { agentPhone, leadData } = req.body;

      if (!agentPhone || !leadData) {
        res.status(400).json({
          success: false,
          error: 'agentPhone and leadData are required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await WhatsAppService.sendLeadAlert(agentPhone, leadData);

      res.status(200).json({
        success: result.success,
        data: result,
        message: result.success ? 'WhatsApp alert dispatched.' : 'Failed to dispatch WhatsApp alert.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Error sending WhatsApp alert.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/whatsapp/webhook
   * Meta Webhook verification handshake
   */
  public static verifyWebhook(req: Request, res: Response): void {
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;

    const verifiedChallenge = WhatsAppService.verifyWebhook(mode, token, challenge);
    if (verifiedChallenge) {
      res.status(200).send(verifiedChallenge);
    } else {
      res.status(403).send('Forbidden: Invalid verification token');
    }
  }

  /**
   * POST /api/whatsapp/webhook
   * Inbound webhook listener
   */
  public static handleWebhook(req: Request, res: Response): void {
    WhatsAppService.processInboundWebhook(req.body);
    // Meta requires immediate 200 OK
    res.status(200).send('EVENT_RECEIVED');
  }
}

export default WhatsAppController;

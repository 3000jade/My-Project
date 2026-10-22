import crypto from 'crypto';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import { InvitationService } from './invitation.service';
import { GoogleDriveService } from './googleDrive.service';
import logger from '../utils/logger';

export type CredentialDocumentKind = 'prc' | 'dhsud' | 'government_id' | 'other';

export interface CredentialDocumentRecord {
  id: string;
  storage_file_id: string;
  file_name: string;
  kind: CredentialDocumentKind;
  owner_id?: string;
  invitation_id?: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

export interface UploadCredentialParams {
  file: Express.Multer.File;
  token?: string;
  agentId?: string;
  kind?: CredentialDocumentKind;
}

export interface CredentialResponseDTO {
  id: string;
  name: string;
  kind: CredentialDocumentKind;
  mimeType: string;
  size: number;
  viewUrl: string;
}

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_ATTACHMENTS_PER_APPLICATION = 6;

// Local in-memory document store for test environments or offline development
const inMemoryDocStore = new Map<string, CredentialDocumentRecord>();

export class AgentCredentialsService {
  /**
   * Reset store (primarily for unit/integration tests)
   */
  public static resetStore(): void {
    inMemoryDocStore.clear();
  }

  /**
   * Validate file buffer signatures (magic bytes) against declared MIME type
   */
  private static validateMagicBytes(buffer: Buffer, mimeType: string): void {
    if (!buffer || buffer.length < 4) {
      throw new Error('Invalid file header: buffer is empty or corrupted');
    }

    if (mimeType === 'application/pdf') {
      const header = buffer.subarray(0, 4).toString('ascii');
      if (header !== '%PDF') {
        throw new Error('Invalid file header: PDF signature (%PDF) does not match declared MIME type');
      }
    } else if (mimeType === 'image/jpeg') {
      if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
        throw new Error('Invalid file header: JPEG signature does not match declared MIME type');
      }
    } else if (mimeType === 'image/png') {
      const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
      const matches = pngSignature.every((byte, idx) => buffer[idx] === byte);
      if (!matches) {
        throw new Error('Invalid file header: PNG signature does not match declared MIME type');
      }
    }
  }

  /**
   * Upload an agent credential with private visibility and authorization validation
   */
  public static async uploadCredential(params: UploadCredentialParams): Promise<CredentialResponseDTO> {
    const { file, token, agentId, kind = 'other' } = params;

    if (!token && !agentId) {
      throw new Error('Authorization required: Invitation token or authenticated agent required');
    }

    let invitationId: string | undefined;

    // Validate token if provided
    if (token) {
      const validation = await InvitationService.validateToken(token);
      if (!validation.valid) {
        throw new Error(`Invitation token is invalid or expired: ${validation.reason || 'expired'}`);
      }
      // Look up invitation ID if Supabase configured
      if (isSupabaseConfigured) {
        try {
          const { data: invite } = await supabaseAdmin
            .from('agent_invitations')
            .select('id')
            .eq('token', token)
            .maybeSingle();
          if (invite) {
            invitationId = invite.id;
          }
        } catch {
          // fallback to token hash
        }
      }
      if (!invitationId) {
        invitationId = `invite-${crypto.createHash('sha256').update(token).digest('hex').substring(0, 16)}`;
      }
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new Error(`Unsupported MIME type: ${file.mimetype}. Allowed formats: PDF, JPEG, PNG.`);
    }

    // Validate size limit (10MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File size (${file.size} bytes) exceeds 10 MB limit.`);
    }

    // Validate magic bytes if buffer exists
    if (file.buffer) {
      this.validateMagicBytes(file.buffer, file.mimetype);
    }

    // Validate attachment limits (max 6)
    const existingCount = await this.countDocuments(agentId, invitationId);
    if (existingCount >= MAX_ATTACHMENTS_PER_APPLICATION) {
      throw new Error(`Maximum limit of 6 attachments per application reached.`);
    }

    // Upload to Google Drive with strict private visibility (no public sharing)
    const uploadResult = await GoogleDriveService.uploadPrivateFile(file, {
      description: `Private Agent Credential: ${kind.toUpperCase()}`,
      isPrivate: true,
    });

    const docId = crypto.randomUUID();
    const docRecord: CredentialDocumentRecord = {
      id: docId,
      storage_file_id: uploadResult.fileId,
      file_name: file.originalname,
      kind,
      owner_id: agentId,
      invitation_id: invitationId,
      mime_type: file.mimetype,
      size_bytes: file.size,
      created_at: new Date().toISOString(),
    };

    // Persist to database or memory store
    if (isSupabaseConfigured) {
      try {
        await supabaseAdmin.from('agent_credential_documents').insert({
          id: docRecord.id,
          storage_file_id: docRecord.storage_file_id,
          file_name: docRecord.file_name,
          kind: docRecord.kind,
          owner_id: docRecord.owner_id || null,
          invitation_id: docRecord.invitation_id || null,
          mime_type: docRecord.mime_type,
          size_bytes: docRecord.size_bytes,
        });
      } catch (err: any) {
        logger.warn('[AgentCredentialsService] Supabase insert warning:', err.message);
      }
    }

    inMemoryDocStore.set(docId, docRecord);

    return {
      id: docId,
      name: file.originalname,
      kind,
      mimeType: file.mimetype,
      size: file.size,
      viewUrl: `/api/agent-credentials/${docId}/content`,
    };
  }

  /**
   * Count documents for this agent or invitation
   */
  private static async countDocuments(agentId?: string, invitationId?: string): Promise<number> {
    if (isSupabaseConfigured) {
      try {
        let query = supabaseAdmin
          .from('agent_credential_documents')
          .select('id', { count: 'exact', head: true });

        if (agentId) {
          query = query.eq('owner_id', agentId);
        } else if (invitationId) {
          query = query.eq('invitation_id', invitationId);
        }

        const { count, error } = await query;
        if (!error && count !== null) {
          return count;
        }
      } catch (err: any) {
        logger.warn('[AgentCredentialsService] Count query warning:', err.message);
      }
    }

    // Fallback to in-memory count
    let count = 0;
    for (const doc of inMemoryDocStore.values()) {
      if (agentId && doc.owner_id === agentId) count++;
      else if (invitationId && doc.invitation_id === invitationId) count++;
    }
    return count;
  }

  /**
   * Get document metadata by ID
   */
  public static async getDocumentMetadata(documentId: string): Promise<CredentialDocumentRecord | null> {
    if (inMemoryDocStore.has(documentId)) {
      return inMemoryDocStore.get(documentId)!;
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('agent_credential_documents')
          .select('*')
          .eq('id', documentId)
          .maybeSingle();

        if (!error && data) {
          return data as CredentialDocumentRecord;
        }
      } catch (err: any) {
        logger.warn('[AgentCredentialsService] getDocumentMetadata warning:', err.message);
      }
    }

    return null;
  }

  /**
   * Stream document content with strict access authorization
   */
  public static async getDocumentContentStream(
    documentId: string,
    actor: { userId?: string; role?: string; token?: string }
  ): Promise<{
    stream: NodeJS.ReadableStream;
    mimeType: string;
    contentLength?: number;
    fileName: string;
  }> {
    const document = await this.getDocumentMetadata(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // Access authorization rules:
    // 1. Broker or Admin -> ALLOW
    // 2. Owner agent (actor.userId === document.owner_id) -> ALLOW
    // 3. Candidate with valid invitation token matching document.invitation_id -> ALLOW
    const isBrokerOrAdmin = actor.role === 'broker' || actor.role === 'admin';
    const isOwner = Boolean(actor.userId && document.owner_id && actor.userId === document.owner_id);

    let isAuthorizedApplicant = false;
    if (actor.token && document.invitation_id) {
      try {
        const validation = await InvitationService.validateToken(actor.token);
        if (validation.valid) {
          const expectedInviteId = `invite-${crypto.createHash('sha256').update(actor.token).digest('hex').substring(0, 16)}`;
          if (document.invitation_id === expectedInviteId) {
            isAuthorizedApplicant = true;
          }
        }
      } catch {
        // Ignored
      }
    }

    if (actor.role === 'agent' && !isOwner) {
      throw new Error('Access denied: Unauthorized agent cannot access another agent credentials');
    }

    if (!isBrokerOrAdmin && !isOwner && !isAuthorizedApplicant) {
      throw new Error('Unauthorized: Authentication required to view credential document');
    }

    const driveStream = await GoogleDriveService.getFileStream(document.storage_file_id);
    if (!driveStream) {
      throw new Error(`Underlying storage file ${document.storage_file_id} could not be retrieved`);
    }

    return {
      stream: driveStream.stream,
      mimeType: document.mime_type || driveStream.mimeType || 'application/octet-stream',
      contentLength: driveStream.contentLength || document.size_bytes,
      fileName: document.file_name,
    };
  }

  /**
   * Link invitation documents to agent upon registration completion
   */
  public static async linkInvitationDocumentsToAgent(invitationTokenOrId: string, agentId: string): Promise<void> {
    const expectedInviteId = `invite-${crypto.createHash('sha256').update(invitationTokenOrId).digest('hex').substring(0, 16)}`;

    for (const [id, doc] of inMemoryDocStore.entries()) {
      if (doc.invitation_id === invitationTokenOrId || doc.invitation_id === expectedInviteId) {
        doc.owner_id = agentId;
        inMemoryDocStore.set(id, doc);
      }
    }

    if (isSupabaseConfigured) {
      try {
        await supabaseAdmin
          .from('agent_credential_documents')
          .update({ owner_id: agentId })
          .or(`invitation_id.eq.${invitationTokenOrId},invitation_id.eq.${expectedInviteId}`);
      } catch (err: any) {
        logger.warn('[AgentCredentialsService] linkInvitationDocumentsToAgent error:', err.message);
      }
    }
  }

  /**
   * List all documents owned by an agent
   */
  public static async listDocumentsForAgent(agentId: string): Promise<CredentialResponseDTO[]> {
    const results: CredentialResponseDTO[] = [];

    if (isSupabaseConfigured) {
      try {
        const { data } = await supabaseAdmin
          .from('agent_credential_documents')
          .select('*')
          .eq('owner_id', agentId);

        if (data) {
          return data.map((d: any) => ({
            id: d.id,
            name: d.file_name,
            kind: d.kind,
            mimeType: d.mime_type,
            size: d.size_bytes,
            viewUrl: `/api/agent-credentials/${d.id}/content`,
          }));
        }
      } catch (err: any) {
        logger.warn('[AgentCredentialsService] listDocumentsForAgent warning:', err.message);
      }
    }

    for (const doc of inMemoryDocStore.values()) {
      if (doc.owner_id === agentId) {
        results.push({
          id: doc.id,
          name: doc.file_name,
          kind: doc.kind,
          mimeType: doc.mime_type,
          size: doc.size_bytes,
          viewUrl: `/api/agent-credentials/${doc.id}/content`,
        });
      }
    }

    return results;
  }
}

export default AgentCredentialsService;

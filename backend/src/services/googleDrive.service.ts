import { google } from 'googleapis';
import { Readable } from 'stream';
import { config } from '../config';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';
import type { DriveUploadResult } from '../../../shared/types/integrations';

// In-memory mock storage for local development
const mockFileDatabase = new Map<string, DriveUploadResult[]>();

export class GoogleDriveService {
  private static getDriveClient() {
    if (
      !config.integrations.googleDriveServiceAccountEmail ||
      !config.integrations.googleDrivePrivateKey
    ) {
      return null;
    }

    const auth = new google.auth.JWT({
      email: config.integrations.googleDriveServiceAccountEmail,
      key: config.integrations.googleDrivePrivateKey,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    return google.drive({ version: 'v3', auth });
  }

  /**
   * Upload an architectural document or high-res file for a property
   */
  public static async uploadListingFile(
    propertyId: string,
    file: Express.Multer.File,
    category: 'CAD' | 'Inspection' | 'Photos' | 'Document' = 'Document'
  ): Promise<DriveUploadResult> {
    const drive = this.getDriveClient();

    if (config.integrations.isMockMode || !drive) {
      logger.warn(`[GoogleDriveService] Mock mode active: uploading ${file.originalname} for property ${propertyId}`);
      const mockResult: DriveUploadResult = {
        fileId: `drive-mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        fileName: file.originalname,
        webViewLink: `https://drive.google.com/file/d/mock-${Date.now()}/view`,
        webContentLink: `https://drive.google.com/uc?export=download&id=mock-${Date.now()}`,
        mimeType: file.mimetype,
        size: file.size,
      };

      const existing = mockFileDatabase.get(propertyId) || [];
      existing.push(mockResult);
      mockFileDatabase.set(propertyId, existing);

      // Also persist to property_media if Supabase is active
      if (isSupabaseConfigured) {
        try {
          const mediaCategory = category === 'CAD' ? 'FloorPlan' : (category === 'Photos' ? 'Photo' : 'Document');
          await supabaseAdmin.from('property_media').insert({
            property_id: propertyId,
            media_url: mockResult.webViewLink,
            media_category: mediaCategory,
            short_description: file.originalname,
            mime_type: file.mimetype,
          });
        } catch (err: any) {
          logger.warn('[GoogleDriveService] Could not sync to property_media in mock mode:', err.message);
        }
      }

      return mockResult;
    }

    // Real Google Drive integration via Service Account
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);

    const folderId = config.integrations.googleDriveRootFolderId || undefined;

    const fileMetadata: any = {
      name: file.originalname,
      parents: folderId ? [folderId] : undefined,
      description: `Property Asset for ID: ${propertyId} [Category: ${category}]`,
    };

    const media = {
      mimeType: file.mimetype,
      body: bufferStream,
    };

    const driveRes = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, webViewLink, webContentLink, mimeType, size',
    });

    const fileId = driveRes.data.id || `file-${Date.now()}`;
    const webViewLink = driveRes.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
    const webContentLink = driveRes.data.webContentLink || `https://drive.google.com/uc?export=download&id=${fileId}`;

    // Make file viewable with link
    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (permErr: any) {
      logger.warn('[GoogleDriveService] Permission grant warning:', permErr.message);
    }

    const result: DriveUploadResult = {
      fileId,
      fileName: file.originalname,
      webViewLink,
      webContentLink,
      mimeType: file.mimetype,
      size: Number(driveRes.data.size || file.size),
    };

    if (isSupabaseConfigured) {
      const mediaCategory = category === 'CAD' ? 'FloorPlan' : (category === 'Photos' ? 'Photo' : 'Document');
      await supabaseAdmin.from('property_media').insert({
        property_id: propertyId,
        media_url: webViewLink,
        media_category: mediaCategory,
        short_description: file.originalname,
        mime_type: file.mimetype,
      });
    }

    return result;
  }

  /**
   * List all uploaded drive files associated with a property
   */
  public static async listListingFiles(propertyId: string): Promise<DriveUploadResult[]> {
    if (config.integrations.isMockMode || !this.getDriveClient()) {
      return mockFileDatabase.get(propertyId) || [
        {
          fileId: 'mock-blueprint-dwg',
          fileName: 'Architectural_Master_Plan.dwg',
          webViewLink: 'https://drive.google.com/file/d/mock-blueprint-dwg/view',
          webContentLink: 'https://drive.google.com/uc?export=download&id=mock-blueprint-dwg',
          mimeType: 'application/acad',
          size: 15420000,
        },
        {
          fileId: 'mock-inspection-pdf',
          fileName: 'Structural_Audit_Report.pdf',
          webViewLink: 'https://drive.google.com/file/d/mock-inspection-pdf/view',
          webContentLink: 'https://drive.google.com/uc?export=download&id=mock-inspection-pdf',
          mimeType: 'application/pdf',
          size: 4200000,
        },
      ];
    }

    // When Supabase is configured, fetch all media marked as Document or FloorPlan
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin
        .from('property_media')
        .select('*')
        .eq('property_id', propertyId);

      if (!error && data) {
        return data.map((item) => ({
          fileId: item.id,
          fileName: item.short_description || 'Property File',
          webViewLink: item.media_url,
          webContentLink: item.media_url,
          mimeType: item.mime_type || 'application/octet-stream',
          size: 0,
        }));
      }
    }

    return [];
  }

  /**
   * Delete a file from Google Drive and remove from database
   */
  public static async deleteListingFile(fileId: string): Promise<boolean> {
    const drive = this.getDriveClient();

    if (config.integrations.isMockMode || !drive) {
      for (const [propId, files] of mockFileDatabase.entries()) {
        const filtered = files.filter((f) => f.fileId !== fileId);
        mockFileDatabase.set(propId, filtered);
      }
      return true;
    }

    try {
      await drive.files.delete({ fileId });
      if (isSupabaseConfigured) {
        await supabaseAdmin.from('property_media').delete().eq('media_key', fileId);
      }
      return true;
    } catch (err: any) {
      logger.error(`[GoogleDriveService] Delete error for file ${fileId}:`, err.message);
      return false;
    }
  }
}

export default GoogleDriveService;

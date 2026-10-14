import { google } from 'googleapis';
import { Readable } from 'stream';
import { config } from '../config';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import logger from '../utils/logger';
import type { DriveUploadResult } from '../../../shared/types/integrations';

// In-memory mock storage for local development
const mockFileDatabase = new Map<string, DriveUploadResult[]>();
const mockFileBuffers = new Map<string, { buffer: Buffer; mimeType: string; fileName: string }>();

export interface UploadOptions {
  isPrivate?: boolean;
  category?: 'CAD' | 'Inspection' | 'Photos' | 'Document';
  description?: string;
  folderId?: string;
}

export class GoogleDriveService {
  /**
   * Determine if Google Drive credentials are fully configured
   */
  public static isConfigured(): boolean {
    return Boolean(
      config.integrations.googleDriveServiceAccountEmail &&
      config.integrations.googleDrivePrivateKey
    );
  }

  /**
   * Determine whether live Google Drive integration is active
   */
  public static isLiveMode(): boolean {
    return this.isConfigured() && !config.integrations.googleDriveMockMode;
  }

  /**
   * Generate direct web-accessible and thumbnail URLs from a Google Drive file ID
   */
  public static getDirectImageUrls(fileId: string) {
    return {
      directImageUrl: `https://lh3.googleusercontent.com/d/${fileId}`,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
      proxyUrl: `/api/drive/media/${fileId}`,
    };
  }

  /**
   * Upload an agent credential or private administrative document.
   * Never sets 'anyone' permissions or exposes public web URLs.
   */
  public static async uploadPrivateFile(
    file: Express.Multer.File,
    options: { description?: string; folderId?: string; isPrivate?: boolean } = {}
  ): Promise<DriveUploadResult> {
    return this.uploadListingFile('private-agent-credentials', file, 'Document', {
      isPrivate: true,
      description: options.description || 'Private Agent Credential Document',
      folderId: options.folderId,
    });
  }

  private static getDriveClient() {
    if (!this.isConfigured()) {
      return null;
    }

    // 1. If an OAuth2 Refresh Token is present, authenticate as user (uses personal 15GB+ drive quota)
    if (
      config.integrations.googleDriveRefreshToken &&
      config.integrations.googleClientId &&
      config.integrations.googleClientSecret
    ) {
      const oauth2Client = new google.auth.OAuth2(
        config.integrations.googleClientId,
        config.integrations.googleClientSecret
      );
      oauth2Client.setCredentials({
        refresh_token: config.integrations.googleDriveRefreshToken,
      });
      return google.drive({ version: 'v3', auth: oauth2Client });
    }

    // 2. Otherwise authenticate via Service Account JWT (ideal for Google Workspace Shared Drives)
    if (
      config.integrations.googleDriveServiceAccountEmail &&
      config.integrations.googleDrivePrivateKey
    ) {
      const auth = new google.auth.JWT({
        email: config.integrations.googleDriveServiceAccountEmail,
        key: config.integrations.googleDrivePrivateKey,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      return google.drive({ version: 'v3', auth });
    }

    return null;
  }

  /**
   * Upload an architectural document, photo, or high-res file for a property
   */
  public static async uploadListingFile(
    propertyId: string,
    file: Express.Multer.File,
    category: 'CAD' | 'Inspection' | 'Photos' | 'Document' = 'Document',
    options?: UploadOptions
  ): Promise<DriveUploadResult> {
    const isPrivate = Boolean(options?.isPrivate);
    const drive = this.getDriveClient();
    const isMock = !this.isLiveMode() || !drive;

    if (isMock) {
      logger.warn(`[GoogleDriveService] Mock mode active: uploading ${file.originalname} (private=${isPrivate})`);
      const mockId = `mock-${Date.now()}`;
      const urls = isPrivate ? { directImageUrl: undefined, thumbnailUrl: undefined, proxyUrl: undefined } : this.getDirectImageUrls(mockId);

      const mockResult: DriveUploadResult = {
        fileId: `drive-mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        fileName: file.originalname,
        webViewLink: isPrivate ? undefined : `https://drive.google.com/file/d/${mockId}/view`,
        webContentLink: isPrivate ? undefined : `https://drive.google.com/uc?export=download&id=${mockId}`,
        directImageUrl: urls.directImageUrl,
        thumbnailUrl: urls.thumbnailUrl,
        mimeType: file.mimetype,
        size: file.size,
      };

      if (file.buffer) {
        mockFileBuffers.set(mockResult.fileId, {
          buffer: file.buffer,
          mimeType: file.mimetype,
          fileName: file.originalname,
        });
      }

      if (!isPrivate) {
        const existing = mockFileDatabase.get(propertyId) || [];
        existing.push(mockResult);
        mockFileDatabase.set(propertyId, existing);
      }

      // Also persist to property_media if Supabase is active and file is not private
      if (isSupabaseConfigured && !isPrivate) {
        try {
          const mediaCategory = category === 'CAD' ? 'FloorPlan' : (category === 'Photos' ? 'Photo' : 'Document');
          const primaryUrl = (category === 'Photos' || file.mimetype?.startsWith('image/'))
            ? mockResult.directImageUrl!
            : mockResult.webViewLink;

          await supabaseAdmin.from('property_media').insert({
            property_id: propertyId,
            media_key: mockResult.fileId,
            media_url: primaryUrl,
            media_category: mediaCategory,
            short_description: file.originalname,
            mime_type: file.mimetype,
          });

          // Sync directly to properties.images array
          if (mediaCategory === 'Photo') {
            await this.syncPropertyImages(propertyId, primaryUrl);
          }
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

    let driveRes: any;
    try {
      driveRes = await drive.files.create({
        supportsAllDrives: true,
        requestBody: fileMetadata,
        media,
        fields: 'id, name, webViewLink, webContentLink, mimeType, size',
      });
    } catch (uploadErr: any) {
      if (uploadErr.message?.includes('storage quota') || uploadErr.message?.includes('storageQuotaExceeded')) {
        logger.error(
          '[GoogleDriveService] Google Drive upload rejected due to Service Account quota limits: ' +
          'Google Cloud Service Accounts have 0 bytes storage on personal Google Drive folders. ' +
          'Use a Google Workspace Shared Drive folder, or provide GOOGLE_DRIVE_REFRESH_TOKEN in backend/.env.'
        );
      }
      throw uploadErr;
    }

    const fileId = driveRes.data.id || `file-${Date.now()}`;
    const urls = isPrivate ? { directImageUrl: undefined, thumbnailUrl: undefined, proxyUrl: undefined } : this.getDirectImageUrls(fileId);
    const webViewLink = isPrivate ? undefined : (driveRes.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`);
    const webContentLink = isPrivate ? undefined : (driveRes.data.webContentLink || `https://drive.google.com/uc?export=download&id=${fileId}`);

    // Make file readable to anyone with link for instant CDN access ONLY if not private
    if (!isPrivate) {
      try {
        await drive.permissions.create({
          fileId,
          supportsAllDrives: true,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });
      } catch (permErr: any) {
        logger.warn('[GoogleDriveService] Permission grant warning:', permErr.message);
      }
    }

    const result: DriveUploadResult = {
      fileId,
      fileName: file.originalname,
      webViewLink,
      webContentLink,
      directImageUrl: urls.directImageUrl,
      thumbnailUrl: urls.thumbnailUrl,
      mimeType: file.mimetype,
      size: Number(driveRes.data.size || file.size),
    };

    if (isSupabaseConfigured && !isPrivate) {
      try {
        const mediaCategory = category === 'CAD' ? 'FloorPlan' : (category === 'Photos' ? 'Photo' : 'Document');
        const primaryUrl = (category === 'Photos' || file.mimetype?.startsWith('image/'))
          ? urls.directImageUrl
          : webViewLink;

        await supabaseAdmin.from('property_media').insert({
          property_id: propertyId,
          media_key: fileId,
          media_url: primaryUrl,
          media_category: mediaCategory,
          short_description: file.originalname,
          mime_type: file.mimetype,
        });

        // Sync directly to properties.images and main_image
        if (mediaCategory === 'Photo' && primaryUrl) {
          await this.syncPropertyImages(propertyId, primaryUrl);
        }
      } catch (dbErr: any) {
        logger.error('[GoogleDriveService] Error persisting to Supabase property_media:', dbErr.message);
      }
    }

    return result;
  }

  /**
   * Helper to sync image URLs directly into property master record
   */
  private static async syncPropertyImages(propertyId: string, imageUrl: string): Promise<void> {
    try {
      const { data: prop } = await supabaseAdmin
        .from('properties')
        .select('images, main_image')
        .eq('id', propertyId)
        .single();

      if (prop) {
        const existingImages: string[] = Array.isArray(prop.images) ? prop.images : [];
        if (!existingImages.includes(imageUrl)) {
          const updatedImages = [...existingImages, imageUrl];
          const updatePayload: Record<string, any> = { images: updatedImages };
          if (!prop.main_image) {
            updatePayload.main_image = imageUrl;
          }
          await supabaseAdmin.from('properties').update(updatePayload).eq('id', propertyId);
        }
      }
    } catch (err: any) {
      logger.warn('[GoogleDriveService] Could not update properties.images:', err.message);
    }
  }

  /**
   * List all uploaded drive files associated with a property
   */
  public static async listListingFiles(propertyId: string): Promise<DriveUploadResult[]> {
    if (!this.isLiveMode() || !this.getDriveClient()) {
      const existing = mockFileDatabase.get(propertyId);
      if (existing && existing.length > 0) {
        return existing;
      }

      const mockDwUrls = this.getDirectImageUrls('mock-blueprint-dwg');
      const mockPdfUrls = this.getDirectImageUrls('mock-inspection-pdf');

      return [
        {
          fileId: 'mock-blueprint-dwg',
          fileName: 'Architectural_Master_Plan.dwg',
          webViewLink: 'https://drive.google.com/file/d/mock-blueprint-dwg/view',
          webContentLink: 'https://drive.google.com/uc?export=download&id=mock-blueprint-dwg',
          directImageUrl: mockDwUrls.directImageUrl,
          thumbnailUrl: mockDwUrls.thumbnailUrl,
          mimeType: 'application/acad',
          size: 15420000,
        },
        {
          fileId: 'mock-inspection-pdf',
          fileName: 'Structural_Audit_Report.pdf',
          webViewLink: 'https://drive.google.com/file/d/mock-inspection-pdf/view',
          webContentLink: 'https://drive.google.com/uc?export=download&id=mock-inspection-pdf',
          directImageUrl: mockPdfUrls.directImageUrl,
          thumbnailUrl: mockPdfUrls.thumbnailUrl,
          mimeType: 'application/pdf',
          size: 4200000,
        },
      ];
    }

    // When Supabase is configured, fetch all media marked for this property
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseAdmin
        .from('property_media')
        .select('*')
        .eq('property_id', propertyId);

      if (!error && data) {
        return data.map((item) => {
          const fileId = item.media_key || item.id;
          const urls = this.getDirectImageUrls(fileId);
          return {
            fileId,
            fileName: item.short_description || 'Property File',
            webViewLink: item.media_url,
            webContentLink: item.media_url,
            directImageUrl: urls.directImageUrl,
            thumbnailUrl: urls.thumbnailUrl,
            mimeType: item.mime_type || 'application/octet-stream',
            size: 0,
          };
        });
      }
    }

    return [];
  }

  /**
   * Delete a file from Google Drive and remove from database
   */
  public static async deleteListingFile(fileId: string): Promise<boolean> {
    const drive = this.getDriveClient();

    if (!this.isLiveMode() || !drive) {
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

  /**
   * Stream a file directly from Google Drive for streaming/proxy delivery
   */
  public static async getFileStream(fileId: string): Promise<{
    stream: NodeJS.ReadableStream;
    mimeType?: string;
    contentLength?: number;
    name?: string;
  } | null> {
    const mock = mockFileBuffers.get(fileId);
    if (mock) {
      return {
        stream: Readable.from(mock.buffer),
        mimeType: mock.mimeType,
        contentLength: mock.buffer.length,
        name: mock.fileName,
      };
    }

    const drive = this.getDriveClient();
    if (!drive) return null;

    try {
      const meta = await drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size',
      });

      const res = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      return {
        stream: res.data as NodeJS.ReadableStream,
        mimeType: meta.data.mimeType || 'application/octet-stream',
        contentLength: meta.data.size ? Number(meta.data.size) : undefined,
        name: meta.data.name || undefined,
      };
    } catch (err: any) {
      logger.error(`[GoogleDriveService] Stream error for file ${fileId}:`, err.message);
      return null;
    }
  }
}

export default GoogleDriveService;

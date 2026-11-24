import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

vi.mock('../services/googleDrive.service', () => ({
  GoogleDriveService: {
    uploadListingFile: vi.fn(),
  },
}));

import { CmsController } from './cms.controller';
import { GoogleDriveService } from '../services/googleDrive.service';

function createMockResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

describe('CmsController.uploadMedia', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns HTTP 400 when req.file is missing', async () => {
    const req = {} as AuthenticatedRequest;
    const res = createMockResponse();

    await CmsController.uploadMedia(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.any(String),
      })
    );
  });

  it('rejects application/pdf with HTTP 400 and unsupported file type message', async () => {
    const req = {
      file: {
        fieldname: 'file',
        originalname: 'brochure.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4'),
        size: 1024,
      } as Express.Multer.File,
    } as AuthenticatedRequest;
    const res = createMockResponse();

    await CmsController.uploadMedia(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringMatching(/JPG, PNG, WebP, or GIF/i),
      })
    );
    expect(GoogleDriveService.uploadListingFile).not.toHaveBeenCalled();
  });

  it('delegates valid image/png to GoogleDriveService.uploadListingFile and returns HTTP 201', async () => {
    const file = {
      fieldname: 'file',
      originalname: 'logo.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: Buffer.from('png-bytes'),
      size: 2048,
    } as Express.Multer.File;

    vi.mocked(GoogleDriveService.uploadListingFile).mockResolvedValue({
      fileId: 'drive-abc',
      fileName: 'logo.png',
      mimeType: 'image/png',
      size: 2048,
      directImageUrl: 'https://lh3.googleusercontent.com/d/drive-abc',
      thumbnailUrl: 'https://drive.google.com/thumbnail?id=drive-abc&sz=w1600',
    } as any);

    const req = { file } as AuthenticatedRequest;
    const res = createMockResponse();

    await CmsController.uploadMedia(req, res);

    expect(GoogleDriveService.uploadListingFile).toHaveBeenCalledWith('cms-media', file, 'Photos');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: {
          url: '/api/drive/media/drive-abc',
          fileId: 'drive-abc',
          fileName: 'logo.png',
        },
      })
    );
  });
});

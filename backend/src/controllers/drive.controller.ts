import { Request, Response } from 'express';
import { GoogleDriveService } from '../services/googleDrive.service';
import type { ApiResponse } from '../types/api';

export class DriveController {
  /**
   * Upload listing file to Google Drive
   */
  public static async uploadFile(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const file = req.file;
      const { propertyId, category } = req.body;

      if (!file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!propertyId) {
        res.status(400).json({
          success: false,
          error: 'propertyId is required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const uploaded = await GoogleDriveService.uploadListingFile(
        propertyId,
        file,
        category || 'Document'
      );

      res.status(201).json({
        success: true,
        data: uploaded,
        message: 'File successfully uploaded to Google Drive.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'File upload failed.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * List files for a listing
   */
  public static async listFiles(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { propertyId } = req.params;

      if (!propertyId) {
        res.status(400).json({
          success: false,
          error: 'propertyId is required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const files = await GoogleDriveService.listListingFiles(propertyId);

      res.status(200).json({
        success: true,
        data: files,
        message: 'Property files retrieved successfully.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to list property files.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Delete file
   */
  public static async deleteFile(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { fileId } = req.params;

      if (!fileId) {
        res.status(400).json({
          success: false,
          error: 'fileId is required.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const success = await GoogleDriveService.deleteListingFile(fileId);

      res.status(200).json({
        success,
        message: success ? 'File deleted successfully.' : 'Failed to delete file.',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to delete file.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default DriveController;

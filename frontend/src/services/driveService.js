// ==============================================================================
// Google Drive Service (Frontend Client)
// Handles direct Google Drive file uploads, media resolution, and CDN streaming
// ==============================================================================

import apiClient from './apiClient';

/**
 * Extracts Google Drive file ID from various Drive URL formats or returns the ID if already clean.
 */
export function extractDriveFileId(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Pattern 1: https://drive.google.com/file/d/{FILE_ID}/view
  const viewMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (viewMatch) return viewMatch[1];

  // Pattern 2: https://drive.google.com/open?id={FILE_ID} or ?id={FILE_ID}
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch) return idParamMatch[1];

  // Pattern 3: https://lh3.googleusercontent.com/d/{FILE_ID}
  const lh3Match = trimmed.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (lh3Match) return lh3Match[1];

  // Pattern 4: /api/drive/media/{FILE_ID}
  const proxyMatch = trimmed.match(/\/api\/drive\/media\/([a-zA-Z0-9_-]+)/);
  if (proxyMatch) return proxyMatch[1];

  // Pattern 5: Raw Google Drive file ID (28 to 44 alphanumeric chars)
  if (/^[a-zA-Z0-9_-]{25,45}$/.test(trimmed)) {
    return trimmed;
  }

  // Pattern 6: Mock file IDs: drive-mock-... or mock-...
  const mockMatch = trimmed.match(/(?:drive-)?mock-[0-9a-zA-Z_-]+/);
  if (mockMatch) return mockMatch[0];

  return null;
}

/**
 * Returns the backend streaming proxy URL for a Google Drive asset.
 */
export function getDriveProxyUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const fileId = extractDriveFileId(url);
  if (fileId) {
    const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').trim().replace(/\/+$/, '');
    const apiBase = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;
    return `${apiBase}/drive/media/${fileId}`;
  }
  return url;
}

/**
 * Normalizes any Google Drive reference into a direct, high-performance CDN image URL.
 * If the input is not a Google Drive asset, returns the original URL unaltered.
 */
export function resolveDriveImageUrl(url, options = { sz: 'w1600' }) {
  if (!url || typeof url !== 'string') return url;

  const fileId = extractDriveFileId(url);
  if (fileId) {
    // If it's a mock ID, route to backend streaming proxy so local buffer is served
    if (fileId.startsWith('mock-') || fileId.startsWith('drive-mock-')) {
      return getDriveProxyUrl(fileId);
    }
    // Return direct Google CDN image URL
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return url;
}

/**
 * Generates high-res thumbnail URL for a Google Drive asset.
 */
export function getDriveThumbnailUrl(url, size = 1600) {
  const fileId = extractDriveFileId(url);
  if (fileId) {
    if (fileId.startsWith('mock-') || fileId.startsWith('drive-mock-')) {
      return getDriveProxyUrl(fileId);
    }
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
  }
  return url;
}

/**
 * Checks if a given URL is hosted on Google Drive.
 */
export function isDriveUrl(url) {
  return Boolean(extractDriveFileId(url));
}

export const driveService = {
  /**
   * Uploads an architectural asset, listing photo, or CAD drawing to Google Drive.
   *
   * @param {File} file - The file to upload
   * @param {string} propertyId - Associated property ID (defaults to 'general')
   * @param {'Photos' | 'CAD' | 'Inspection' | 'Document'} category
   * @returns {Promise<{fileId: string, directImageUrl: string, thumbnailUrl: string, webViewLink: string}>}
   */
  async uploadFile(file, propertyId = 'general', category = 'Photos') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('propertyId', propertyId);
    formData.append('category', category);

    const response = await apiClient.post('/drive/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = response?.data || response;
    return {
      fileId: data.fileId,
      fileName: data.fileName || file.name,
      directImageUrl: data.directImageUrl || `https://lh3.googleusercontent.com/d/${data.fileId}`,
      thumbnailUrl: data.thumbnailUrl || `https://drive.google.com/thumbnail?id=${data.fileId}&sz=w1600`,
      webViewLink: data.webViewLink,
      webContentLink: data.webContentLink,
      size: data.size || file.size,
    };
  },

  /**
   * Retrieves all Google Drive files and CAD plans attached to a property
   */
  async getListingFiles(propertyId) {
    const response = await apiClient.get(`/drive/listing/${propertyId}`);
    return response?.data || response || [];
  },

  /**
   * Removes a file from Google Drive
   */
  async deleteFile(fileId) {
    return apiClient.delete(`/drive/files/${fileId}`);
  },

  resolveDriveImageUrl,
  getDriveThumbnailUrl,
  isDriveUrl,
  extractDriveFileId,
};

export default driveService;

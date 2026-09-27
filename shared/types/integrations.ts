export interface GoogleAuthPayload {
  idToken: string;
  role?: 'client' | 'agent' | 'broker' | 'admin';
}

export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  webContentLink: string;
  mimeType: string;
  size: number;
}

export interface EmailNotificationRequest {
  to: string;
  subject: string;
  template: 'inquiry_received' | 'tour_confirmed' | 'broker_approval' | 'valuation_report';
  context: Record<string, any>;
}

export interface WhatsAppMessagePayload {
  recipientPhone: string;
  templateName: string;
  parameters: Record<string, string>;
}

export interface CommuteEstimate {
  destination: string;
  destinationName: string;
  distanceText: string;
  distanceMeters: number;
  durationText: string;
  durationSeconds: number;
  mode: 'driving' | 'transit' | 'walking';
}

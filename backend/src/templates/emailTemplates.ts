/**
 * Nordic Modern Architectural & Bauhaus Precision Email Templates
 * Base Ground: #FBFBF9 | Surface: #FFFFFF | Primary: #0D4446 | Accent: #E76F51 | Ink: #141717
 */

export interface InquiryEmailData {
  agentName: string;
  agentEmail: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  propertyTitle: string;
  propertyPrice?: string;
  message: string;
}

export interface TourConfirmationEmailData {
  clientName: string;
  clientEmail: string;
  propertyTitle: string;
  address: string;
  appointmentTime: string;
  agentName?: string;
}

export interface BrokerApprovalEmailData {
  brokerEmail: string;
  propertyTitle: string;
  listingId: string;
  price: string;
  agentName: string;
}

export function buildInquiryEmailHtml(data: InquiryEmailData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>New Property Lead Inquiry</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #FBFBF9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #141717;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #D8DFDF; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(13, 68, 70, 0.04);">
    <!-- Header -->
    <tr>
      <td style="padding: 28px 32px; background-color: #0D4446; text-align: left;">
        <span style="font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #14B8A6; font-weight: 700;">CP_KERBY LUXURY REAL ESTATE</span>
        <h1 style="margin: 6px 0 0 0; color: #FFFFFF; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">New Client Inquiry Received</h1>
      </td>
    </tr>
    <!-- Content Body -->
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #5C6768;">Dear ${data.agentName},</p>
        <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.5; color: #141717;">
          A prospective client has requested a private dossier and consultation for <strong>${data.propertyTitle}</strong>${data.propertyPrice ? ` (${data.propertyPrice})` : ''}.
        </p>

        <!-- Lead Telemetry Card -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F5F4; border-radius: 8px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 16px;">
              <table border="0" cellpadding="6" cellspacing="0" width="100%" style="font-size: 14px;">
                <tr>
                  <td width="35%" style="color: #5C6768; font-weight: 600;">Client Name:</td>
                  <td style="color: #141717; font-weight: 600;">${data.clientName}</td>
                </tr>
                <tr>
                  <td style="color: #5C6768; font-weight: 600;">Email:</td>
                  <td><a href="mailto:${data.clientEmail}" style="color: #0D4446; text-decoration: none;">${data.clientEmail}</a></td>
                </tr>
                <tr>
                  <td style="color: #5C6768; font-weight: 600;">Phone:</td>
                  <td style="color: #141717;">${data.clientPhone || 'Not provided'}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Message Box -->
        <div style="border-left: 3px solid #E76F51; padding: 12px 16px; background-color: #FBFBF9; margin-bottom: 28px; font-style: italic; color: #141717;">
          "${data.message}"
        </div>

        <!-- Action Button -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center">
              <a href="mailto:${data.clientEmail}?subject=Re: Inquiry on ${encodeURIComponent(data.propertyTitle)}" 
                 style="display: inline-block; background-color: #E76F51; color: #FFFFFF; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 14px;">
                Reply Directly to Client
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; background-color: #FBFBF9; border-top: 1px solid #E5EBEB; text-align: center; font-size: 12px; color: #8E9A9B;">
        CP_kerby Luxury Architectural Platform &bull; Automated Telemetry &bull; Confidential
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildTourConfirmationEmailHtml(data: TourConfirmationEmailData): string {
  const formattedDate = new Date(data.appointmentTime).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Private Showing Confirmed</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #FBFBF9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #141717;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #D8DFDF; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(13, 68, 70, 0.04);">
    <tr>
      <td style="padding: 28px 32px; background-color: #0D4446; text-align: left;">
        <span style="font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #14B8A6; font-weight: 700;">PRIVATE TOUR CONCIERGE</span>
        <h1 style="margin: 6px 0 0 0; color: #FFFFFF; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">Your Inspection is Confirmed</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #5C6768;">Dear ${data.clientName},</p>
        <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.5; color: #141717;">
          We are pleased to confirm your private showing of <strong>${data.propertyTitle}</strong>.
        </p>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F5F4; border-radius: 8px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 16px;">
              <table border="0" cellpadding="6" cellspacing="0" width="100%" style="font-size: 14px;">
                <tr>
                  <td width="35%" style="color: #5C6768; font-weight: 600;">Time & Date:</td>
                  <td style="color: #141717; font-weight: 700;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="color: #5C6768; font-weight: 600;">Location:</td>
                  <td style="color: #141717;">${data.address}</td>
                </tr>
                ${data.agentName ? `<tr><td style="color: #5C6768; font-weight: 600;">Listing Agent:</td><td style="color: #141717;">${data.agentName}</td></tr>` : ''}
              </table>
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 24px 0; font-size: 14px; color: #5C6768;">
          Your private architectural consultant will welcome you at the estate entrance. Please bring valid identification for building security registration.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 32px; background-color: #FBFBF9; border-top: 1px solid #E5EBEB; text-align: center; font-size: 12px; color: #8E9A9B;">
        CP_kerby Luxury Architectural Platform &bull; Concierge Service
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface AgentInvitationEmailData {
  agentEmail: string;
  inviteUrl: string;
  expiresInHours?: number;
}

export function buildAgentInvitationEmailHtml(data: AgentInvitationEmailData): string {
  const hours = data.expiresInHours || 72;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Invitation to Join CP_kerby as Licensed Property Consultant</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #FBFBF9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #141717;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #D8DFDF; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(13, 68, 70, 0.04);">
    <tr>
      <td style="padding: 28px 32px; background-color: #0D4446; text-align: left;">
        <span style="font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #14B8A6; font-weight: 700;">CP_KERBY LUXURY REAL ESTATE</span>
        <h1 style="margin: 6px 0 0 0; color: #FFFFFF; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">Consultant Onboarding Invitation</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #5C6768;">Hello,</p>
        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #141717;">
          You have been formally invited to join the <strong>CP_kerby Luxury Real Estate</strong> brokerage network as a licensed real estate consultant.
        </p>
        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.5; color: #5C6768;">
          To complete your onboarding, please click the secure link below to submit your PRC license details, DHSUD accreditation, and verification documents. This invitation is valid for <strong>${hours} hours</strong>.
        </p>

        <!-- CTA Button -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
          <tr>
            <td align="center">
              <a href="${data.inviteUrl}" style="display: inline-block; padding: 14px 32px; background-color: #E76F51; color: #FFFFFF; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 0.05em; text-transform: uppercase; border-radius: 8px; box-shadow: 0 4px 12px rgba(231, 111, 81, 0.35);">
                Accept Invitation & Complete Registration
              </a>
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 10px 0; font-size: 12px; color: #8E9A9B;">
          If the button does not open, copy and paste this secure link into your browser:
        </p>
        <p style="margin: 0 0 24px 0; font-size: 12px; color: #0D4446; word-break: break-all;">
          ${data.inviteUrl}
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 32px; background-color: #FBFBF9; border-top: 1px solid #E5EBEB; text-align: center; font-size: 12px; color: #8E9A9B;">
        CP_kerby Luxury Architectural Platform &bull; Compliance & Broker Operations
      </td>
    </tr>
  </table>
</body>
</html>`;
}


// ==============================================================================
// Property Assignment Lifecycle Email Templates
// ==============================================================================

export interface PropertyAssignmentEmailData {
  agentName: string;
  agentEmail: string;
  propertyTitle: string;
  propertyPrice?: number | string;
  propertyAddress?: string;
  propertyId: string;
  brokerName?: string;
  reviewUrl?: string;
}

export function buildPropertyAssignmentEmailHtml(data: PropertyAssignmentEmailData): string {
  const url = data.reviewUrl || `http://localhost:5173/agent/properties`;
  const formattedPrice = typeof data.propertyPrice === 'number'
    ? `₱${data.propertyPrice.toLocaleString()}`
    : (data.propertyPrice || 'Price on request');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Property Listing Assigned</title>
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #1E293B;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
    <tr>
      <td style="padding: 28px 32px; background: #0F766E; text-align: left; color: #FFFFFF;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.01em;">HUMAN SHELTER REALTY</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #CCFBF1; letter-spacing: 0.05em; text-transform: uppercase;">New Listing Assigned For Confirmation</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.5;">
          Hello <strong>${data.agentName}</strong>,
        </p>
        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
          <strong>${data.brokerName || 'Your Principal Broker'}</strong> has assigned a new property listing to you. In compliance with brokerage governance, this listing will remain in <strong>Pending Confirmation</strong> until you accept it.
        </p>
        
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 8px 0; font-size: 16px; color: #0F766E;">${data.propertyTitle}</h2>
          <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #1E293B;">Asking Price: ${formattedPrice}</p>
          <p style="margin: 0; font-size: 13px; color: #64748B;">Location: ${data.propertyAddress || 'Address on file'}</p>
        </div>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
          <tr>
            <td align="center">
              <a href="${url}" style="display: inline-block; padding: 14px 28px; background-color: #0F766E; color: #FFFFFF; text-decoration: none; font-weight: 700; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase; border-radius: 8px;">
                Review & Confirm Assignment
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 32px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center; font-size: 12px; color: #94A3B8;">
        Human Shelter Realty Platform &bull; Broker Operations
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface AssignmentAcceptedEmailData {
  brokerName: string;
  brokerEmail: string;
  propertyTitle: string;
  agentName: string;
  propertyId: string;
  dashboardUrl?: string;
}

export function buildAssignmentAcceptedEmailHtml(data: AssignmentAcceptedEmailData): string {
  const url = data.dashboardUrl || `http://localhost:5173/broker/properties`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Assignment Accepted & Published</title>
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #1E293B;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
    <tr>
      <td style="padding: 28px 32px; background: #0F766E; text-align: left; color: #FFFFFF;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.01em;">HUMAN SHELTER REALTY</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #CCFBF1; letter-spacing: 0.05em; text-transform: uppercase;">Listing Confirmed & Live</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.5;">
          Hello <strong>${data.brokerName}</strong>,
        </p>
        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
          Agent <strong>${data.agentName}</strong> has accepted responsibility for the listing <strong>"${data.propertyTitle}"</strong>.
        </p>

        <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
          <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #15803D;">Status: Active & Published</p>
          <p style="margin: 0; font-size: 13px; color: #166534;">The listing is now live on the public discovery portal. All inquiries will be routed to ${data.agentName}.</p>
        </div>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
          <tr>
            <td align="center">
              <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #0F766E; color: #FFFFFF; text-decoration: none; font-weight: 700; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase; border-radius: 8px;">
                View In Dashboard
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 32px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center; font-size: 12px; color: #94A3B8;">
        Human Shelter Realty Platform &bull; Broker Operations
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface AssignmentDeclinedEmailData {
  brokerName: string;
  brokerEmail: string;
  propertyTitle: string;
  agentName: string;
  reason?: string;
  propertyId: string;
  reassignUrl?: string;
}

export function buildAssignmentDeclinedEmailHtml(data: AssignmentDeclinedEmailData): string {
  const url = data.reassignUrl || `http://localhost:5173/broker/properties`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Listing Assignment Declined</title>
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #1E293B;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
    <tr>
      <td style="padding: 28px 32px; background: #DC2626; text-align: left; color: #FFFFFF;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.01em;">HUMAN SHELTER REALTY</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #FEE2E2; letter-spacing: 0.05em; text-transform: uppercase;">Action Required &bull; Assignment Declined</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.5;">
          Hello <strong>${data.brokerName}</strong>,
        </p>
        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
          Agent <strong>${data.agentName}</strong> has declined the assignment for <strong>"${data.propertyTitle}"</strong>.
        </p>

        <div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
          <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #991B1B;">Reason provided by agent:</p>
          <p style="margin: 0; font-size: 13px; color: #7F1D1D; font-style: italic;">"${data.reason || 'No specific reason provided'}"</p>
        </div>

        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
          The property is now flagged as <strong>Action Required</strong> and unpublished. Please select another verified consultant to reassign.
        </p>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
          <tr>
            <td align="center">
              <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #0F766E; color: #FFFFFF; text-decoration: none; font-weight: 700; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase; border-radius: 8px;">
                Reassign Listing In Dashboard
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 32px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center; font-size: 12px; color: #94A3B8;">
        Human Shelter Realty Platform &bull; Broker Operations
      </td>
    </tr>
  </table>
</body>
</html>`;
}

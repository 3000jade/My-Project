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

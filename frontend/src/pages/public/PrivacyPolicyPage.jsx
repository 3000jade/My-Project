import LegalDocumentLayout from '@/components/legal/LegalDocumentLayout';

const PRIVACY_SUMMARY = [
  'We only collect the information needed to answer your property inquiries, manage your account, or process agent applications.',
  'We never sell your personal contact details to third-party marketers.',
  'Our chat assistant uses AI to help route your questions—please avoid typing government IDs, passwords, or bank details into chat.',
  'Under the Philippine Data Privacy Act (RA 10173), you can ask to view, correct, or delete your personal data anytime.',
];

const PRIVACY_SECTIONS = [
  {
    id: 'who-we-are',
    title: 'Who We Are',
    paragraphs: [
      'Human Shelter Realty Corporation ("Human Shelter Realty", "we", "our", or "us") is a licensed real estate brokerage and marketing firm in the Philippines, established in 1989 with its head office in Marikina City.',
      'Under the Data Privacy Act of 2012 (Republic Act No. 10173), we act as the Personal Information Controller for the personal data you share through our website, property inquiry forms, and account portals.',
    ],
  },
  {
    id: 'info-we-collect',
    title: 'Information We Collect',
    paragraphs: [
      'We collect only the details you choose to give us or that are needed to keep the website working safely:',
    ],
    bullets: [
      'Account & profile details: your name, email address, phone number, and login credentials when you register as a client, agent, or broker.',
      'Property inquiries & viewing requests: your preferred locations, budget range, financing questions, and messages sent to our team.',
      'Agent accreditation records: PRC or DHSUD license details and branch assignments submitted during agent onboarding.',
      'Technical & usage logs: basic browser type, IP address, and session cookies used to keep you signed in and protect against abuse.',
    ],
  },
  {
    id: 'how-we-use',
    title: 'How We Use Your Information',
    paragraphs: ['We use your personal information for clear, everyday business purposes:'],
    bullets: [
      'Answering your questions about house-and-lot listings, subdivisions, and financing options.',
      'Connecting you with an accredited Human Shelter Realty agent or branch near your target area.',
      'Managing saved properties, scheduled site viewings, and client or agent portal accounts.',
      'Sending important account notices, such as email verification codes or inquiry updates.',
      'Improving website reliability, security, and customer support response times.',
    ],
  },
  {
    id: 'ai-chat-notice',
    title: 'AI Chat & Automated Routing',
    paragraphs: [
      'Our website includes an AI-assisted chat and routing tool to help answer general property questions faster and connect you with the right live agent.',
      'Automated replies are for convenience only. Please do not share sensitive personal information—such as copies of government IDs, TINs, bank account numbers, or passwords—inside the public chat box.',
    ],
  },
  {
    id: 'who-we-share-with',
    title: 'Who We Share Information With',
    paragraphs: [
      'We do not sell your personal information. We only share details when needed to fulfill your request or comply with Philippine law:',
    ],
    bullets: [
      'Accredited Human Shelter Realty salespersons, brokers, and regional branch staff assisting with your inquiry.',
      'Partner housing developers (such as Ovialand, APEC Homes, or Raemulan Lands) when you ask to reserve or inspect one of their properties.',
      'Trusted technical service providers (such as cloud hosting, email delivery, and AI processing providers) bound by confidentiality and security rules.',
      'Government regulators or courts when legally required.',
    ],
  },
  {
    id: 'retention-security',
    title: 'Data Security & Retention',
    paragraphs: [
      'We use encrypted connections (HTTPS), access controls, and role-based permissions so only authorized staff can view your inquiry or account records.',
      'We keep your information only for as long as your account is active, as needed to assist with your property transaction, or as required by Philippine tax and real estate regulations.',
    ],
  },
  {
    id: 'your-rights',
    title: 'Your Rights Under the Data Privacy Act',
    paragraphs: [
      'Under Republic Act No. 10173, you have the right to:',
    ],
    bullets: [
      'Be informed about how your personal data is collected and used.',
      'Request access to a copy of the personal information we hold about you.',
      'Ask us to correct inaccurate or outdated details.',
      'Request deletion (erasure) or blocking of your personal data when it is no longer needed.',
      'Withdraw consent or file a complaint with the National Privacy Commission (NPC) if you believe your privacy rights were violated.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentLayout
      eyebrow="Privacy & Data Protection"
      title="Privacy Policy"
      lastUpdated="November 26, 2026"
      summaryPoints={PRIVACY_SUMMARY}
      noticeTitle="Philippine Data Privacy Act (RA 10173) Compliance"
      noticeBody="By creating an account or submitting a property inquiry, you authorize Human Shelter Realty Corp. to collect and process your details solely for real estate brokerage, customer support, and account services."
      siblingLabel="Read Terms of Service"
      siblingTo="/terms"
      sections={PRIVACY_SECTIONS}
    />
  );
}

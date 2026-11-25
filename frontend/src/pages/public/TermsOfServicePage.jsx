import LegalDocumentLayout from '@/components/legal/LegalDocumentLayout';

const TERMS_SUMMARY = [
  'You must be at least 18 years old to create an account or submit binding property reservations.',
  'All real estate sales and brokerage services are handled with PRC-licensed brokers and accredited salespersons (RA 9646).',
  'Property prices, promos, and unit availability shown online may change without prior notice.',
  'Browsing listings or chatting online does not create a formal sale or brokerage contract until written agreements are signed.',
];

const TERMS_SECTIONS = [
  {
    id: 'acceptance',
    title: 'Acceptance & Eligibility',
    paragraphs: [
      'Welcome to the Human Shelter Realty Corporation web platform. By browsing our listings, using our chat assistant, or creating an account, you agree to follow these Terms of Service.',
      'You must be at least 18 years old and legally capable of entering into contracts under Philippine law to register an account or request property reservations.',
    ],
  },
  {
    id: 'resa-compliance',
    title: 'Licensed Real Estate Practice (RA 9646)',
    paragraphs: [
      'In accordance with the Real Estate Service Act of the Philippines (Republic Act No. 9646), real estate brokerage services offered through this platform are conducted under the supervision of PRC-licensed Real Estate Brokers and accredited Real Estate Salespersons.',
      'Unlicensed ("colorum") brokerage or unauthorized posting of property listings is strictly prohibited on this platform.',
    ],
  },
  {
    id: 'listings-dhsud',
    title: 'Property Listings, Pricing & DHSUD Compliance',
    paragraphs: [
      'Pre-selling subdivisions and housing projects marketed by Human Shelter Realty Corp. are developed by partner developers holding applicable Department of Human Settlements and Urban Development (DHSUD) Licenses to Sell.',
      'While we work hard to keep photos, floor plans, sample computations, and unit counts accurate, all prices, monthly amortizations, promos, and property availability are subject to change or prior sale without notice. Always confirm final figures with an accredited Human Shelter Realty agent.',
    ],
  },
  {
    id: 'no-automatic-contract',
    title: 'No Automatic Sale or Brokerage Contract',
    paragraphs: [
      'Viewing a property page, saving a listing, or sending an inquiry through our website does not create a binding Reservation Agreement, Deed of Sale, or exclusive Authority to Sell.',
      'A formal transaction only takes effect once official developer or brokerage documents are signed and required reservation fees are properly receipted.',
    ],
  },
  {
    id: 'acceptable-use',
    title: 'Account & Acceptable Use Rules',
    paragraphs: ['When using this website, you agree not to:'],
    bullets: [
      'Provide false names, fake contact numbers, or misleading accreditation details.',
      'Copy, scrape, or republish property photos, subdivision maps, or listing descriptions for competing commercial use without written permission.',
      'Attempt to bypass login protections, probe private portals, or disrupt website availability.',
      'Send spam, abusive messages, or fraudulent inquiries to our agents or users.',
    ],
  },
  {
    id: 'ai-disclaimer',
    title: 'AI Assistant & Estimator Disclaimer',
    paragraphs: [
      'Automated chat replies, neighborhood summaries, and loan or price-per-square-meter estimates are provided as helpful guides only. They are not formal financial, legal, or appraisal advice.',
    ],
  },
  {
    id: 'liability-governing-law',
    title: 'Limitation of Liability & Governing Law',
    paragraphs: [
      'Human Shelter Realty Corp. provides this website on an "as-is" and "as-available" basis. To the extent permitted by law, we are not liable for temporary site downtime, third-party developer construction delays, or typographical errors in third-party project materials.',
      'These Terms of Service are governed by the laws of the Republic of the Philippines. Any legal disputes shall be brought before the proper courts of Marikina City, Metro Manila.',
    ],
  },
];

export default function TermsOfServicePage() {
  return (
    <LegalDocumentLayout
      eyebrow="Platform Rules & Real Estate Disclosures"
      title="Terms of Service"
      lastUpdated="November 26, 2026"
      summaryPoints={TERMS_SUMMARY}
      noticeTitle="PRC & DHSUD Real Estate Notice"
      noticeBody="Human Shelter Realty Corp. operates in compliance with RA 9646 (Real Estate Service Act) and DHSUD marketing guidelines. Final prices and unit availability are confirmed upon formal reservation."
      siblingLabel="Read Privacy Policy"
      siblingTo="/privacy"
      sections={TERMS_SECTIONS}
    />
  );
}

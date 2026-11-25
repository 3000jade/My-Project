import LegalDocumentLayout from '@/components/legal/LegalDocumentLayout';
import { TERMS_DOCUMENT } from '@/data/legalDocuments';

export default function TermsOfServicePage() {
  return <LegalDocumentLayout {...TERMS_DOCUMENT} />;
}

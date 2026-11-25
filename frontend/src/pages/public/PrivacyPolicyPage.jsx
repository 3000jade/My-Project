import LegalDocumentLayout from '@/components/legal/LegalDocumentLayout';
import { PRIVACY_DOCUMENT } from '@/data/legalDocuments';

export default function PrivacyPolicyPage() {
  return <LegalDocumentLayout {...PRIVACY_DOCUMENT} />;
}

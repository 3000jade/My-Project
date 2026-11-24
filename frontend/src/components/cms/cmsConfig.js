import {
  Megaphone,
  Building2,
  Users,
  Award,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

export const STAFF_DEPARTMENTS = [
  'Business Development & Growth',
  'Sales Department',
  'Accounting Department',
  'Marketing Department',
  'Logistics Department',
];

export const CMS_TABS = [
  {
    id: 'banners',
    label: 'Banners & Announcements',
    description: 'Manage homepage hero banners and site-wide announcement strips.',
    contentTypes: ['banner'],
    defaultType: 'banner',
    createLabel: 'New Banner',
    icon: Megaphone,
  },
  {
    id: 'company',
    label: 'Company & Contact',
    description: 'Manage company story pages and physical office branch details.',
    contentTypes: ['page', 'office'],
    defaultType: 'page',
    createLabel: 'New Page or Branch',
    icon: Building2,
    subTypes: [
      { value: 'page', label: 'Company Page' },
      { value: 'office', label: 'Office Branch' },
    ],
  },
  {
    id: 'staff',
    label: 'Staff Directory',
    description: 'Manage leadership, sales agents, and department team profiles.',
    contentTypes: ['staff'],
    defaultType: 'staff',
    createLabel: 'Add Staff Member',
    icon: Users,
  },
  {
    id: 'partners-awards',
    label: 'Partners & Awards',
    description: 'Manage accredited developers, partner banks, and realty awards.',
    contentTypes: ['partner', 'award'],
    defaultType: 'partner',
    createLabel: 'New Partner or Award',
    icon: Award,
    subTypes: [
      { value: 'partner', label: 'Trusted Partner' },
      { value: 'award', label: 'Award / Honor' },
    ],
  },
  {
    id: 'guides',
    label: 'Buyer Guides',
    description: 'Publish home-buying guides, financing tips, and market articles.',
    contentTypes: ['article'],
    defaultType: 'article',
    createLabel: 'New Buyer Guide',
    icon: BookOpen,
  },
  {
    id: 'faqs',
    label: 'FAQs',
    description: 'Answer common client questions about buying, renting, and tours.',
    contentTypes: ['faq'],
    defaultType: 'faq',
    createLabel: 'New FAQ',
    icon: HelpCircle,
  },
];

export const CMS_STATUS_FILTERS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export function getTabById(tabId) {
  return CMS_TABS.find((tab) => tab.id === tabId) || CMS_TABS[0];
}

export function getDefaultTypeForTab(tabId) {
  return getTabById(tabId).defaultType;
}

const CONTENT_TYPE_LABELS = {
  banner: 'Banner',
  page: 'Company Page',
  office: 'Office Branch',
  staff: 'Staff Member',
  partner: 'Trusted Partner',
  award: 'Award / Honor',
  article: 'Buyer Guide',
  faq: 'FAQ',
};

export function getContentTypeLabel(contentType, payload = {}) {
  if (contentType === 'partner') {
    if (payload?.partner_type === 'bank') return 'Bank Partner';
    if (payload?.partner_type === 'developer') return 'Developer Partner';
    return 'Trusted Partner';
  }
  return CONTENT_TYPE_LABELS[contentType] || String(contentType || 'Content');
}

export function toSlug(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function filterCmsItems(items = [], { tabId, status = 'ALL', search = '' } = {}) {
  const activeTab = tabId ? CMS_TABS.find((tab) => tab.id === tabId) : null;
  const query = String(search || '').trim().toLowerCase();

  return items.filter((item) => {
    if (activeTab && !activeTab.contentTypes.includes(item.content_type)) {
      return false;
    }

    if (status && status !== 'ALL' && item.status !== status) {
      return false;
    }

    if (!query) {
      return true;
    }

    const payload = item.payload || {};
    const searchableFields = [
      item.title,
      item.slug,
      item.summary,
      payload.department,
      payload.role,
      payload.address,
      payload.organization,
      payload.category,
      payload.partner_type,
    ];

    return searchableFields.some(
      (field) => typeof field === 'string' && field.toLowerCase().includes(query)
    );
  });
}

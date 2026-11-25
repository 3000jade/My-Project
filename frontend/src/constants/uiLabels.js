export const ACTION_LABELS = Object.freeze({
  save: 'Save Changes',
  cancel: 'Cancel',
  delete: 'Delete',
  edit: 'Edit',
  add: 'Add',
  search: 'Search',
  filter: 'Filter',
  clearFilters: 'Clear Filters',
  retry: 'Retry',
  back: 'Back',
  next: 'Next',
  publish: 'Publish',
  signIn: 'Sign In',
});

export const STATUS_LABELS = Object.freeze({
  available: 'Available',
  pendingReview: 'Pending Review',
  reserved: 'Reserved',
  sold: 'Sold',
  rented: 'Rented',
  draft: 'Draft',
  archived: 'Archived',
});

export function getPriceLabel(transactionType = '') {
  const normalized = String(transactionType).trim().toLowerCase();
  if (normalized.includes('rent') || normalized.includes('lease')) {
    return 'Monthly Rent';
  }
  if (normalized.includes('foreclosure')) {
    return 'Foreclosure Price';
  }
  return 'Selling Price';
}

export function getListingContextFlags(propertyType = '') {
  const normalized = String(propertyType).trim().toLowerCase();
  const isLandOnly =
    normalized === 'lot' ||
    normalized === 'vacant lot' ||
    normalized.includes('vacant lot') ||
    normalized.includes('raw land');

  return {
    showRooms: !isLandOnly,
    showFloorArea: !isLandOnly,
  };
}

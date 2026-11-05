import { getAssetFamily, ASSET_FAMILIES } from './propertyTypeConfig';

export function validatePropertyForm({
  formData,
  mediaPhotos = [],
  mediaFloorPlans = [],
  mediaVideos = [],
  mediaVirtualTours = [],
  mediaDocuments = [],
  isProvinceApplicable = () => false,
}) {
  const assetFamily = getAssetFamily(formData.property_type);

  // 1. Core Draft Validation (Essential DB schema requirements)
  const draftValidationErrors = [];

  if (!formData.title || formData.title.trim().length === 0) {
    draftValidationErrors.push({
      field: 'Title',
      step: 1,
      message: 'Property title is required by the database schema.',
    });
  }

  if (!formData.price || Number(formData.price) <= 0) {
    draftValidationErrors.push({
      field: 'Price / Rent',
      step: 4,
      message: 'Valid positive price/rent amount is required by the database schema.',
    });
  }

  if (!formData.address || formData.address.trim().length === 0) {
    draftValidationErrors.push({
      field: 'Street Address',
      step: 2,
      message: 'Street address is required by the database schema.',
    });
  }

  if (!formData.location && !formData.city) {
    draftValidationErrors.push({
      field: 'City / Municipality',
      step: 2,
      message: 'City / Municipality is required by the database schema.',
    });
  }

  if (!formData.property_type) {
    draftValidationErrors.push({
      field: 'Property Type',
      step: 1,
      message: 'Property type classification is required.',
    });
  }

  // 2. Full Publication Validation
  const finalValidationErrors = [...draftValidationErrors];

  if (formData.title && formData.title.trim().length < 3) {
    finalValidationErrors.push({
      field: 'Title',
      step: 1,
      message: 'Provide a title with at least 3 characters.',
    });
  }

  if (!formData.region && !formData.region_psgc_code) {
    finalValidationErrors.push({
      field: 'Region',
      step: 2,
      message: 'Select a region.',
    });
  }

  const isProvRequired = formData.region_psgc_code
    ? isProvinceApplicable(formData.region_psgc_code)
    : false;

  if (isProvRequired && !formData.province && !formData.state_or_province) {
    finalValidationErrors.push({
      field: 'Province',
      step: 2,
      message: 'Select a province.',
    });
  }

  if (!formData.city && !formData.location) {
    finalValidationErrors.push({
      field: 'City / Municipality',
      step: 2,
      message: 'Select a city or municipality.',
    });
  }

  if (!formData.barangay) {
    finalValidationErrors.push({
      field: 'Barangay',
      step: 2,
      message: 'Select a barangay.',
    });
  }

  if (!formData.currency) {
    finalValidationErrors.push({
      field: 'Currency',
      step: 4,
      message: 'Select currency.',
    });
  }

  if (formData.transaction_type === 'For Rent' && !formData.rent_frequency) {
    finalValidationErrors.push({
      field: 'Rent Frequency',
      step: 4,
      message: 'Select rent frequency.',
    });
  }

  if (!formData.latitude || !formData.longitude) {
    finalValidationErrors.push({
      field: 'Confirm map location',
      step: 2,
      message: 'Confirm map location pin.',
    });
  }

  if (mediaPhotos.length === 0) {
    finalValidationErrors.push({
      field: 'Add a cover photo',
      step: 6,
      message: 'Add at least 1 cover photo.',
    });
  }

  // 3. Asset-Family Specific Publication Audits
  if (assetFamily === ASSET_FAMILIES.STRATA) {
    if (!formData.building_name || formData.building_name.trim().length === 0) {
      finalValidationErrors.push({
        field: 'Building Name',
        step: 2,
        message: 'Building name is required for vertical strata properties.',
      });
    }
    if (!formData.living_area || Number(formData.living_area) <= 0) {
      finalValidationErrors.push({
        field: 'Usable Floor Area',
        step: 3,
        message: 'Valid floor area is required for condominium units.',
      });
    }
  } else if (assetFamily === ASSET_FAMILIES.LAND) {
    if (!formData.lot_size_area || Number(formData.lot_size_area) <= 0) {
      finalValidationErrors.push({
        field: 'Lot Area',
        step: 3,
        message: 'Lot area is required for land and lot properties.',
      });
    }
    if (!formData.frontage_meters || Number(formData.frontage_meters) <= 0) {
      finalValidationErrors.push({
        field: 'Road Frontage',
        step: 3,
        message: 'Road frontage width in meters is required for land listings.',
      });
    }
    if (!formData.depth_meters || Number(formData.depth_meters) <= 0) {
      finalValidationErrors.push({
        field: 'Lot Depth',
        step: 3,
        message: 'Lot depth in meters is required for land listings.',
      });
    }
  } else if (assetFamily === ASSET_FAMILIES.DWELLING) {
    if (!formData.living_area || Number(formData.living_area) <= 0) {
      finalValidationErrors.push({
        field: 'Floor Area',
        step: 3,
        message: 'Enclosed floor area is required for residential dwellings.',
      });
    }
    if (!formData.lot_size_area || Number(formData.lot_size_area) <= 0) {
      finalValidationErrors.push({
        field: 'Lot Area',
        step: 3,
        message: 'Lot plot area is required for residential dwellings.',
      });
    }
  }

  const totalMediaCount =
    mediaPhotos.length +
    mediaFloorPlans.length +
    mediaVideos.length +
    mediaVirtualTours.length +
    mediaDocuments.length;

  return {
    hasTitle: Boolean(formData.title && formData.title.trim().length >= 3),
    hasPrice: Boolean(formData.price && Number(formData.price) > 0),
    hasAddress: Boolean(formData.address && formData.address.trim().length > 0),
    hasRegion: Boolean(formData.region || formData.region_psgc_code),
    hasProvince: isProvRequired ? Boolean(formData.province || formData.state_or_province) : true,
    hasCity: Boolean((formData.location || formData.city) && (formData.location || formData.city).trim().length > 0),
    hasBarangay: Boolean(formData.barangay && formData.barangay.trim().length > 0),
    hasCoordinates: Boolean(formData.latitude && formData.longitude),
    hasMedia: totalMediaCount > 0,
    hasCoverPhoto: mediaPhotos.length > 0,
    draftErrors: draftValidationErrors,
    finalErrors: finalValidationErrors,
    isValidForDraft: draftValidationErrors.length === 0,
    isValidForPublish: finalValidationErrors.length === 0,
  };
}


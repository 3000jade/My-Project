import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Check, Eye, Smartphone, Monitor, 
  ExternalLink, Building2, Save, Compass, Layers, 
  Shield, FileText, Image as ImageIcon, Ruler, DollarSign 
} from 'lucide-react';
import { cn } from '@/utils/cn';
import Accordion from '@/components/ui/core/Accordion';
import StatusBadge from '@/components/ui/core/StatusBadge';
import { mockProperties } from '@/mockData/mockProperties';
import propertyService, { normalizeProperty, toApiPayload } from '@/services/propertyService';

export default function BrokerPropertyEditStudio() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State: Core Essentials & RESO 2.0 Schema
  const [formData, setFormData] = useState({
    title: 'Ayala Alabang Modern Bauhaus Sanctuary',
    price: 185000000,
    propertyType: 'Estate',
    livingArea: 1200,
    coverPhoto: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1400&auto=format&fit=crop',
    story: 'Conceived in the Bauhaus tradition of clean functional geometry, this signature residence introduces cantilevered reinforced concrete planes paired with floor-to-ceiling acoustic triple-glazing.',
    status: 'AVAILABLE',
    standardStatus: 'Active',
    // Physical Specs (Accordion 1)
    lotArea: 1450,
    parking: 4,
    bedrooms: 6,
    bathrooms: 6,
    stories: 2,
    architecturalStyle: 'Modern Bauhaus',
    // Location & Cadastre (Accordion 2)
    address: '142 Acacia Avenue',
    subdivisionName: 'Ayala Alabang Village',
    city: 'Muntinlupa',
    postalCode: '1780',
    cadastralLotId: 'LOT-449-BLK-12',
    // Carrying Costs & HOA (Accordion 3)
    associationFee: 12500,
    associationFeeFrequency: 'Monthly',
    taxAnnualAmount: 48000,
    originalListPrice: 195000000,
    // Broker Confidential & Co-Broke (Accordion 4)
    listingAgent: 'Alexander Sterling',
    commissionSplit: '3.00%',
    lockboxCode: '4492-B',
    showingInstructions: 'Owner requires 24h advance notice for private client tours.',
    privateNotes: 'Gate security requires valid broker license and guest pre-registration.',
    // Media & CAD Blueprints (Accordion 5)
    blueprintUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
    virtualTourUrl: '',
  });

  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile'
  const [previewMode, setPreviewMode] = useState('photo'); // 'photo' | 'cad'
  const [areaUnit, setAreaUnit] = useState('sqm'); // 'sqm' | 'sqft'
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving'
  const [toastMessage, setToastMessage] = useState(null);
  const saveTimeoutRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load existing property data if id exists
  useEffect(() => {
    if (!id || id === 'new') return;

    const loadProperty = async () => {
      try {
        const res = await propertyService.getPropertyById(id);
        const p = res?.data || mockProperties.find(item => String(item.id) === String(id) || item.listingKey === id);
        if (p) {
          const norm = normalizeProperty(p);
          setFormData(prev => ({
            ...prev,
            title: norm.title || prev.title,
            price: norm.price_raw || norm.price || prev.price,
            propertyType: norm.type || prev.propertyType,
            livingArea: norm.specs?.livingArea || norm.livingArea || norm.living_area || prev.livingArea,
            coverPhoto: norm.image || norm.mainImage || prev.coverPhoto,
            story: norm.description || prev.story,
            status: norm.status || prev.status,
            standardStatus: norm.standardStatus || norm.standard_status || prev.standardStatus,
            lotArea: norm.specs?.lotArea || norm.lot_size_area || prev.lotArea,
            bedrooms: norm.specs?.beds || norm.bedrooms_total || prev.bedrooms,
            bathrooms: norm.specs?.baths || norm.bathrooms_total_integer || prev.bathrooms,
            stories: norm.stories_total || prev.stories,
            architecturalStyle: norm.architectural_style || prev.architecturalStyle,
            address: norm.unparsed_address || norm.address || prev.address,
            subdivisionName: norm.subdivisionName || norm.subdivision_name || prev.subdivisionName,
            city: norm.city || prev.city,
            postalCode: norm.postal_code || prev.postalCode,
            cadastralLotId: norm.cadastral_lot_id || norm.listingKey || prev.cadastralLotId,
            associationFee: norm.associationFee || norm.association_fee || prev.associationFee,
            associationFeeFrequency: norm.association_fee_frequency || prev.associationFeeFrequency,
            taxAnnualAmount: norm.tax_annual_amount || prev.taxAnnualAmount,
            originalListPrice: norm.original_list_price || prev.originalListPrice,
            listingAgent: norm.agentName || norm.agent_name || prev.listingAgent,
            commissionSplit: norm.buyer_agency_compensation || norm.buyerAgencyCompensation || prev.commissionSplit,
            lockboxCode: norm.lockbox_code || prev.lockboxCode,
            showingInstructions: norm.showing_instructions || prev.showingInstructions,
            privateNotes: norm.private_remarks || norm.privateRemarks || prev.privateNotes,
            blueprintUrl: norm.blueprintUrl || norm.blueprint_url || prev.blueprintUrl,
          }));
        }
      } catch {
        const fallback = mockProperties.find(item => String(item.id) === String(id) || item.listingKey === id);
        if (fallback) {
          const norm = normalizeProperty(fallback);
          setFormData(prev => ({
            ...prev,
            title: norm.title || prev.title,
            price: norm.price_raw || norm.price || prev.price,
            propertyType: norm.type || prev.propertyType,
            coverPhoto: norm.image || prev.coverPhoto,
          }));
        }
      }
    };

    loadProperty();
  }, [id]);

  // Debounced Auto-Save Telemetry
  const handleFieldChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      return next;
    });
    setSaveStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (id && id !== 'new') {
          const payload = toApiPayload ? toApiPayload(formData) : formData;
          await propertyService.updateProperty(id, payload);
        }
        try {
          localStorage.setItem(`property_draft_${id || 'new'}`, JSON.stringify(formData));
        } catch (_) {}
        setSaveStatus('saved');
      } catch (err) {
        console.warn('Auto-save network sync failed, preserved locally:', err);
        setSaveStatus('saved');
      }
    }, 600);
  };

  const handlePublishLive = async () => {
    setFormData(prev => ({
      ...prev,
      status: 'AVAILABLE',
      standardStatus: 'Active'
    }));
    try {
      if (id && id !== 'new') {
        await propertyService.updateProperty(id, {
          status: 'AVAILABLE',
          standardStatus: 'Active'
        });
      }
      showToast('Listing published live to public discovery portal.');
    } catch {
      showToast('Status updated locally to Active.');
    }
  };

  // Convert area values based on active unit
  const formatArea = (sqm) => {
    const val = Number(sqm) || 0;
    if (areaUnit === 'sqft') {
      const sqft = Math.round(val * 10.7639);
      return `${sqft.toLocaleString()} sq ft`;
    }
    return `${val.toLocaleString()} m²`;
  };

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#0F172A] font-sans antialiased">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0F172A] text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium border border-slate-700 animate-in fade-in duration-150 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Studio Sub-Header (64px, Hairline Border) */}
      <header className="h-16 bg-white/90 backdrop-blur-md border-b border-[#D8DFDF] px-6 flex items-center justify-between sticky top-0 z-30 select-none">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-3">
          <Link
            to="/broker/properties"
            className="flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-[#0D4446] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Inventory</span>
          </Link>
          <span className="text-[#D8DFDF]">/</span>
          <span className="text-xs font-semibold text-[#0F172A] truncate max-w-[240px]">
            {formData.title || 'Untitled Property'}
          </span>
          <StatusBadge status={formData.standardStatus || formData.status} />
        </div>

        {/* Toolbar: Auto-Save Status, Device Toggle, Primary CTA */}
        <div className="flex items-center gap-4">
          
          {/* Peaceful Inline Auto-Save Telemetry */}
          <div className="flex items-center gap-2 font-mono text-xs text-slate-500 bg-[#F4F5F4] px-3 py-1.5 rounded-md border border-[#E2E8F0]">
            <span className={cn(
              "w-1.5 h-1.5 rounded-full transition-colors",
              saveStatus === 'saving' ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
            )} />
            <span>{saveStatus === 'saving' ? 'Saving...' : 'Saved just now'}</span>
          </div>

          {/* Device Preview Toggle */}
          <div className="hidden sm:flex items-center bg-[#F4F5F4] p-0.5 rounded-md border border-[#E2E8F0] text-xs">
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded transition-all cursor-pointer",
                previewDevice === 'desktop' ? "bg-white text-[#0F172A] font-semibold shadow-xs" : "text-slate-500"
              )}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded transition-all cursor-pointer",
                previewDevice === 'mobile' ? "bg-white text-[#0F172A] font-semibold shadow-xs" : "text-slate-500"
              )}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
          </div>

          {/* Primary High-Impact Publish Action */}
          <button
            type="button"
            onClick={handlePublishLive}
            className="px-4 py-2 rounded-md bg-[#E76F51] hover:bg-[#D65C3E] text-white font-mono text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Publish Live
          </button>
        </div>
      </header>

      {/* Main 55/45 Split-Screen Stage */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form & Progressive Disclosure (55% / 7 cols) */}
        <section className="lg:col-span-7 space-y-6">
          
          {/* TIER 1: CORE ESSENTIALS (ALWAYS VISIBLE) */}
          <div className="bg-white p-6 rounded-xl border border-[#E5EBEB] shadow-2xs space-y-4">
            <div className="border-b border-[#E5EBEB] pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#0F172A]">Core Details</h2>
                <p className="text-xs text-slate-500">Primary public information, pricing, and workflow status.</p>
              </div>
              <span className="font-mono text-[10px] text-[#0D4446] bg-[#0D4446]/10 px-2 py-0.5 rounded font-semibold">
                TIER 1 ESSENTIALS
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Property Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="w-full h-10 px-3.5 text-xs bg-white border border-[#E2E8F0] rounded-md text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#0D4446] focus:border-[#0D4446] transition-all"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">List Price (PHP)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleFieldChange('price', Number(e.target.value))}
                  className="w-full h-10 px-3.5 font-mono text-xs bg-white border border-[#E2E8F0] rounded-md font-bold text-[#0D4446] focus:outline-none focus:ring-1 focus:ring-[#0D4446] focus:border-[#0D4446]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Property Type</label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => handleFieldChange('propertyType', e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-white border border-[#E2E8F0] rounded-md text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#0D4446] focus:border-[#0D4446]"
                >
                  <option value="Estate">Estate</option>
                  <option value="Villa">Villa</option>
                  <option value="Single Family">Single Family</option>
                  <option value="Penthouse">Penthouse</option>
                  <option value="Condominium">Condominium</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Land">Land</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Workflow Status</label>
                <select
                  value={formData.standardStatus}
                  onChange={(e) => {
                    const nextStd = e.target.value;
                    let nextStatus = 'AVAILABLE';
                    if (nextStd === 'Pending Approval') nextStatus = 'PENDING';
                    else if (nextStd === 'Active Under Contract') nextStatus = 'RESERVED';
                    else if (nextStd === 'Closed') nextStatus = 'SOLD';
                    else if (nextStd === 'Draft') nextStatus = 'DRAFT';
                    handleFieldChange('standardStatus', nextStd);
                    handleFieldChange('status', nextStatus);
                  }}
                  className="w-full h-10 px-3 text-xs bg-white border border-[#E2E8F0] rounded-md text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#0D4446] focus:border-[#0D4446]"
                >
                  <option value="Active">Active</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Active Under Contract">Active Under Contract</option>
                  <option value="Closed">Closed</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Living Area (m²)</label>
                <input
                  type="number"
                  value={formData.livingArea}
                  onChange={(e) => handleFieldChange('livingArea', Number(e.target.value))}
                  className="w-full h-10 px-3.5 font-mono text-xs bg-white border border-[#E2E8F0] rounded-md text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#0D4446] focus:border-[#0D4446]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Cover Photo URL</label>
                <input
                  type="text"
                  value={formData.coverPhoto}
                  onChange={(e) => handleFieldChange('coverPhoto', e.target.value)}
                  className="w-full h-10 px-3.5 text-xs bg-white border border-[#E2E8F0] rounded-md text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#0D4446] focus:border-[#0D4446]"
                />
              </div>
            </div>
          </div>

          {/* TIER 1: STORY NARRATIVE COMPOSER (ALWAYS VISIBLE) */}
          <div className="bg-white p-6 rounded-xl border border-[#E5EBEB] shadow-2xs space-y-3">
            <div className="border-b border-[#E5EBEB] pb-2 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#0F172A]">Architectural Narrative</h2>
                <p className="text-xs text-slate-500">Brief overview describing structural geometry, spatial light, and provenance.</p>
              </div>
              <span className="font-mono text-[10px] text-slate-400">Editorial Copy</span>
            </div>

            <textarea
              rows={4}
              value={formData.story}
              onChange={(e) => handleFieldChange('story', e.target.value)}
              className="w-full p-3.5 text-xs leading-relaxed bg-white border border-[#E2E8F0] rounded-md text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#0D4446] focus:border-[#0D4446]"
            />
          </div>

          {/* 5-ACCORDION PROGRESSIVE DISCLOSURE SUITE */}
          <div className="space-y-3">
            
            {/* Accordion 1: Physical Specs & Dimensions */}
            <Accordion
              title="Physical Specs & Dimensions"
              description="Lot size, parking bays, bedrooms, bathrooms, stories, and architectural style."
            >
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Lot Size (m²)</label>
                  <input
                    type="number"
                    value={formData.lotArea}
                    onChange={(e) => handleFieldChange('lotArea', Number(e.target.value))}
                    className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-md font-mono text-xs text-[#0F172A]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Bedrooms</label>
                  <input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => handleFieldChange('bedrooms', Number(e.target.value))}
                    className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-md font-mono text-xs text-[#0F172A]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Bathrooms</label>
                  <input
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => handleFieldChange('bathrooms', Number(e.target.value))}
                    className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-md font-mono text-xs text-[#0F172A]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Parking Slots</label>
                  <input
                    type="number"
                    value={formData.parking}
                    onChange={(e) => handleFieldChange('parking', Number(e.target.value))}
                    className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-md font-mono text-xs text-[#0F172A]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Stories</label>
                  <input
                    type="number"
                    value={formData.stories}
                    onChange={(e) => handleFieldChange('stories', Number(e.target.value))}
                    className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-md font-mono text-xs text-[#0F172A]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Architectural Style</label>
                  <input
                    type="text"
                    value={formData.architecturalStyle}
                    onChange={(e) => handleFieldChange('architecturalStyle', e.target.value)}
                    placeholder="e.g. Modern Bauhaus"
                    className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-md text-xs text-[#0F172A]"
                  />
                </div>
              </div>
            </Accordion>

            {/* Accordion 2: Location & Neighborhood Cadastre */}
            <Accordion
              title="Location & Neighborhood Cadastre"
              description="Cadastral parcel identifier, gated subdivision, street address, and postal code."
            >
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Street Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-md text-xs text-[#0F172A]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Subdivision / Enclave</label>
                    <input
                      type="text"
                      value={formData.subdivisionName}
                      onChange={(e) => handleFieldChange('subdivisionName', e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-md text-xs text-[#0F172A]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">City / Municipality</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleFieldChange('city', e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-md text-xs text-[#0F172A]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Postal Code</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-md font-mono text-xs text-[#0F172A]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Cadastre Parcel ID</label>
                    <input
                      type="text"
                      value={formData.cadastralLotId}
                      onChange={(e) => handleFieldChange('cadastralLotId', e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-md font-mono text-xs text-[#0D4446]"
                    />
                  </div>
                </div>
              </div>
            </Accordion>

            {/* Accordion 3: Carrying Costs & HOA */}
            <Accordion
              title="Carrying Costs & HOA"
              description="Monthly homeowners association dues, real property tax, and base acquisition valuation."
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Monthly HOA Dues (PHP)</label>
                  <input
                    type="number"
                    value={formData.associationFee}
                    onChange={(e) => handleFieldChange('associationFee', Number(e.target.value))}
                    className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-md font-mono text-xs text-[#0F172A]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Fee Frequency</label>
                  <select
                    value={formData.associationFeeFrequency}
                    onChange={(e) => handleFieldChange('associationFeeFrequency', e.target.value)}
                    className="w-full h-9 px-2.5 bg-white border border-[#E2E8F0] rounded-md text-xs text-[#0F172A]"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Annually">Annually</option>
                    <option value="Quarterly">Quarterly</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Annual Tax Amount (PHP)</label>
                  <input
                    type="number"
                    value={formData.taxAnnualAmount}
                    onChange={(e) => handleFieldChange('taxAnnualAmount', Number(e.target.value))}
                    className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-md font-mono text-xs text-[#0F172A]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Original List Price (PHP)</label>
                  <input
                    type="number"
                    value={formData.originalListPrice}
                    onChange={(e) => handleFieldChange('originalListPrice', Number(e.target.value))}
                    className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-md font-mono text-xs text-[#0F172A]"
                  />
                </div>
              </div>
            </Accordion>

            {/* Accordion 4: Broker Confidential & Co-Broke */}
            <Accordion
              title="Broker Confidential & Co-Broke"
              description="Listing agent assignment, co-broke split, lockbox passcode, and showing protocol."
            >
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Listing Broker / Agent</label>
                    <input
                      type="text"
                      value={formData.listingAgent}
                      onChange={(e) => handleFieldChange('listingAgent', e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-md text-xs text-[#0F172A]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Co-Broke Compensation</label>
                    <input
                      type="text"
                      value={formData.commissionSplit}
                      onChange={(e) => handleFieldChange('commissionSplit', e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-md font-mono text-xs font-semibold text-[#0D4446]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Lockbox / Access Code</label>
                    <input
                      type="text"
                      value={formData.lockboxCode}
                      onChange={(e) => handleFieldChange('lockboxCode', e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-md font-mono text-xs text-[#0F172A]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Showing Instructions</label>
                    <input
                      type="text"
                      value={formData.showingInstructions}
                      onChange={(e) => handleFieldChange('showingInstructions', e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-md text-xs text-[#0F172A]"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Private Broker Notes (Confidential)</label>
                  <textarea
                    rows={2}
                    value={formData.privateNotes}
                    onChange={(e) => handleFieldChange('privateNotes', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-[#E2E8F0] rounded-md text-xs font-mono text-slate-700 resize-none"
                  />
                </div>
              </div>
            </Accordion>

            {/* Accordion 5: Media & CAD Blueprints */}
            <Accordion
              title="Media & CAD Blueprints"
              description="Architectural floor plans, structural CAD blueprints, and 3D virtual tour walk-throughs."
            >
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">CAD Blueprint Architectural Schema URL</label>
                  <input
                    type="text"
                    value={formData.blueprintUrl}
                    onChange={(e) => handleFieldChange('blueprintUrl', e.target.value)}
                    placeholder="https://.../blueprint.jpg"
                    className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-md text-xs text-[#0F172A]"
                  />
                  <p className="text-[10px] text-slate-400">
                    High-resolution floor plans and engineering schematics displayed in the interactive client CAD inspector.
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">3D Virtual Tour Embed URL</label>
                  <input
                    type="text"
                    value={formData.virtualTourUrl}
                    onChange={(e) => handleFieldChange('virtualTourUrl', e.target.value)}
                    placeholder="https://my.matterport.com/show/?m=..."
                    className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-md text-xs text-[#0F172A]"
                  />
                </div>
              </div>
            </Accordion>

          </div>
        </section>

        {/* Right Column: Sticky Reactive Live Client Preview (45% / 5 cols) */}
        <aside className="lg:col-span-5 sticky top-20 space-y-3">
          
          {/* Preview Controls Bar */}
          <div className="flex items-center justify-between font-mono text-xs text-slate-500 bg-white p-2.5 rounded-xl border border-[#E5EBEB]">
            <div className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#0D4446]" />
              <span className="font-semibold text-slate-700">Live Client Preview</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Dual-Mode Toggle: Photo vs CAD */}
              <div className="flex items-center bg-[#F4F5F4] p-0.5 rounded-lg border border-[#E2E8F0] text-[11px]">
                <button
                  type="button"
                  onClick={() => setPreviewMode('photo')}
                  className={cn(
                    "px-2 py-0.5 rounded font-mono transition-all cursor-pointer",
                    previewMode === 'photo' ? "bg-white text-[#0D4446] font-bold shadow-2xs" : "text-slate-500"
                  )}
                >
                  Photo
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('cad')}
                  className={cn(
                    "px-2 py-0.5 rounded font-mono transition-all cursor-pointer",
                    previewMode === 'cad' ? "bg-white text-[#0D4446] font-bold shadow-2xs" : "text-slate-500"
                  )}
                >
                  CAD Blueprint
                </button>
              </div>

              {/* Unit Switcher: m² vs sq ft */}
              <div className="flex items-center bg-[#F4F5F4] p-0.5 rounded-lg border border-[#E2E8F0] text-[11px]">
                <button
                  type="button"
                  onClick={() => setAreaUnit('sqm')}
                  className={cn(
                    "px-1.5 py-0.5 rounded font-mono transition-all cursor-pointer",
                    areaUnit === 'sqm' ? "bg-white text-[#0D4446] font-bold shadow-2xs" : "text-slate-500"
                  )}
                >
                  m²
                </button>
                <button
                  type="button"
                  onClick={() => setAreaUnit('sqft')}
                  className={cn(
                    "px-1.5 py-0.5 rounded font-mono transition-all cursor-pointer",
                    areaUnit === 'sqft' ? "bg-white text-[#0D4446] font-bold shadow-2xs" : "text-slate-500"
                  )}
                >
                  sq ft
                </button>
              </div>
            </div>
          </div>

          {/* Device Stage Wrapper */}
          <div className={cn(
            "mx-auto transition-all duration-300",
            previewDevice === 'mobile' ? "max-w-[340px]" : "w-full"
          )}>
            <div className="bg-white rounded-2xl border border-[#D8DFDF] shadow-[0_16px_36px_rgba(13,68,70,0.06)] overflow-hidden">
              
              {/* Media Viewport */}
              <div className="aspect-[16/10] bg-[#0C1618] relative overflow-hidden group">
                {previewMode === 'photo' ? (
                  <img
                    src={formData.coverPhoto}
                    alt={formData.title}
                    className="w-full h-full object-cover transition-all"
                  />
                ) : (
                  <div className="w-full h-full relative flex items-center justify-center bg-[#070D0E]">
                    {/* CAD Architectural Blueprint Grid Texture */}
                    <div 
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: 'radial-gradient(circle, #14B8A6 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                      }}
                    />
                    <img
                      src={formData.blueprintUrl}
                      alt="CAD Architectural Blueprint"
                      className="w-full h-full object-contain filter invert contrast-125 opacity-80"
                    />
                    <div className="absolute top-3 right-3 font-mono text-[9px] uppercase tracking-widest text-[#14B8A6] bg-[#070D0E]/80 px-2 py-0.5 rounded border border-[#14B8A6]/40">
                      CAD Architectural Blueprint
                    </div>
                  </div>
                )}

                <div className="absolute bottom-3 left-3 bg-[#0D4446]/95 backdrop-blur-md px-3 py-1 rounded-lg text-white font-mono text-sm font-bold shadow-sm">
                  ₱{formData.price.toLocaleString()}
                </div>
                <div className="absolute top-3 left-3">
                  <StatusBadge status={formData.standardStatus || formData.status} />
                </div>
              </div>

              {/* Card Details Body */}
              <div className="p-5 space-y-3.5">
                <div>
                  <p className="font-mono text-[10px] text-[#0D4446] font-semibold">
                    {formData.subdivisionName || formData.city}, {formData.city}
                  </p>
                  <h3 className="text-base font-bold text-[#0F172A] mt-0.5">
                    {formData.title}
                  </h3>
                </div>

                <div className="py-2.5 border-y border-[#E5EBEB] flex items-center justify-between font-mono text-[11px] text-slate-700">
                  <span>{formData.propertyType}</span>
                  <span>•</span>
                  <span>{formatArea(formData.livingArea)} Living</span>
                  <span>•</span>
                  <span>{formatArea(formData.lotArea)} Lot</span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {formData.story}
                </p>

                {/* Carrying Costs & Specs Telemetry Strip */}
                <div className="pt-2 border-t border-[#F4F5F4] flex items-center justify-between font-mono text-[10px] text-slate-500">
                  <span>HOA: ₱{formData.associationFee.toLocaleString()}/mo</span>
                  <span>Style: {formData.architecturalStyle || 'Bauhaus'}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

      </main>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/dashboard/PageHeader';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import DashboardModal from '../../../components/dashboard/DashboardModal';
import propertyService from '../../../services/propertyService';
import { useAuth } from '../../../context/AuthContext';
import { mockProperties } from '../../../mockData/mockProperties';
import { 
  Building2, Clock, CheckCircle2, AlertCircle, 
  Send, X, Sparkles, Bed, Bath, Maximize2, Car, MapPin, 
  ArrowLeft, Eye, Edit3
} from 'lucide-react';

export default function AgentPropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [property, setProperty] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [pendingProposal, setPendingProposal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showProposalDrawer, setShowProposalDrawer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Proposal Form State
  const [formTitle, setFormTitle] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCondition, setFormCondition] = useState('Pristine / Turnkey');
  const [formStandardStatus, setFormStandardStatus] = useState('Active');
  const [formBeds, setFormBeds] = useState(3);
  const [formBaths, setFormBaths] = useState(3);
  const [formSqm, setFormSqm] = useState(250);
  const [formDescription, setFormDescription] = useState('');
  const [agentNotes, setAgentNotes] = useState('');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const prop = await propertyService.getPropertyById(id);
        const resolvedProp = prop || mockProperties.find(p => p.id === id) || mockProperties[0];
        setProperty(resolvedProp);
        setActiveImage(resolvedProp?.mainImage || (resolvedProp?.images && resolvedProp.images[0]) || null);

        // Prepopulate proposal form
        setFormTitle(resolvedProp?.title || '');
        setFormTagline(resolvedProp?.tagline || '');
        setFormPrice(String(resolvedProp?.price_raw || (typeof resolvedProp?.price === 'number' ? resolvedProp.price : 50000000)));
        setFormCondition(resolvedProp?.property_condition || 'Pristine / Turnkey');
        setFormStandardStatus(resolvedProp?.standard_status || 'Active');
        setFormBeds(resolvedProp?.bedrooms || resolvedProp?.specs?.beds || 3);
        setFormBaths(resolvedProp?.bathrooms || resolvedProp?.specs?.baths || 3);
        setFormSqm(resolvedProp?.sqm || resolvedProp?.specs?.livingArea || 250);
        setFormDescription(resolvedProp?.description || resolvedProp?.public_remarks || '');

        // Fetch active pending proposals for this property
        const editsRes = await propertyService.getEditRequests({ propertyId: id, status: 'PENDING' });
        const rawEdits = Array.isArray(editsRes?.data) ? editsRes.data : editsRes?.data?.requests || [];
        if (rawEdits.length > 0) {
          setPendingProposal(rawEdits[0]);
        } else {
          setPendingProposal(null);
        }
      } catch (err) {
        console.warn('Error loading property detail:', err);
        const fallback = mockProperties.find(p => p.id === id) || mockProperties[0];
        setProperty(fallback);
        setActiveImage(fallback?.mainImage || null);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    setSubmissionError('');
    setIsSubmitting(true);

    try {
      const proposedChanges = {
        title: formTitle,
        tagline: formTagline,
        price: Number(formPrice),
        property_condition: formCondition,
        standard_status: formStandardStatus,
        bedrooms_total: Number(formBeds),
        bathrooms_total_integer: Number(formBaths),
        living_area: Number(formSqm),
        public_remarks: formDescription,
      };

      const result = await propertyService.proposeEdit(property.id, proposedChanges, agentNotes);
      setPendingProposal(result);
      setShowProposalDrawer(false);
      setSuccessToast('Your proposed modifications have been submitted for broker review.');
      setTimeout(() => setSuccessToast(''), 6000);
    } catch (err) {
      setSubmissionError(err.message || 'Could not submit proposal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelProposal = async () => {
    if (!pendingProposal) return;
    if (!window.confirm('Are you sure you want to cancel this pending edit proposal?')) return;

    try {
      await propertyService.cancelEditRequest(pendingProposal.id);
      setPendingProposal(null);
      setSuccessToast('Edit proposal was successfully cancelled.');
      setTimeout(() => setSuccessToast(''), 5000);
    } catch (err) {
      alert(`Could not cancel proposal: ${err.message}`);
    }
  };

  if (isLoading || !property) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F766E]" />
        <p className="text-xs text-[#64748B]">Loading luxury listing dossier...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Alert */}
      {successToast && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pending Review Alert Banner */}
      {pendingProposal && (
        <div className="p-4 rounded-lg bg-amber-50/90 border border-amber-200 text-[#1E293B] shadow-xs space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-md bg-amber-100 text-amber-700">
                <Clock className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-[#1E293B]">
                  Proposed Modifications Awaiting Broker Review
                </h4>
                <p className="text-[11px] text-[#64748B]">
                  Submitted on {new Date(pendingProposal.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}. Live public listing remains unchanged until approved.
                </p>
              </div>
            </div>
            <button
              onClick={handleCancelProposal}
              className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-100/50 text-[11px] font-semibold text-amber-800 transition-colors shadow-2xs"
            >
              Cancel Proposal
            </button>
          </div>

          {pendingProposal.agent_notes && (
            <div className="mt-2 text-xs bg-white/80 p-2.5 rounded-md border border-amber-200/60 text-[#1E293B]">
              <span className="font-semibold text-amber-800">Your Justification: </span>
              {pendingProposal.agent_notes}
            </div>
          )}
        </div>
      )}

      <PageHeader
        title={property.title}
        subtitle={`${property.property_type || 'Luxury Residence'} • ${typeof property.location === 'string' ? property.location : property.location?.address || 'Metro Manila'}`}
        breadcrumbs={[
          { label: "Dashboard", to: "/agent/dashboard" },
          { label: "Assigned Properties", to: "/agent/properties" },
          { label: property.title }
        ]}
        badge={<StatusBadge status={property.status} />}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowPreviewModal(true)}
              className="h-10 px-4 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#1E293B] text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs"
            >
              <Eye className="w-4 h-4 text-slate-500" />
              Preview Listing
            </button>
            <button
              onClick={() => setShowProposalDrawer(true)}
              className={`h-10 px-4 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all text-white shadow-xs ${
                pendingProposal 
                  ? 'bg-amber-600 hover:bg-amber-700' 
                  : 'bg-[#FF6B6B] hover:bg-[#fa5252]'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              {pendingProposal ? 'Revise Pending Proposal' : 'Propose Changes'}
            </button>
          </div>
        }
      />

      {/* Gallery Section */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-xs space-y-4">
        <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-lg overflow-hidden bg-slate-100">
          <img
            src={activeImage}
            alt={property.title}
            className="w-full h-full object-cover transition-all duration-300"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <StatusBadge status={property.status} />
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase backdrop-blur-xs text-white ${
              property.is_published ? 'bg-[#0F766E]/90' : 'bg-slate-800/90'
            }`}>
              {property.is_published ? 'Published' : 'Private Draft'}
            </span>
          </div>
          <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-xs text-white px-4 py-2 rounded-lg text-xl font-mono font-bold">
            {property.price || (property.price_raw ? `₱${property.price_raw.toLocaleString()}` : 'Price on Request')}
          </div>
        </div>

        {/* Thumbnails */}
        {property.images && property.images.length > 1 && (
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 custom-scrollbar">
            {property.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`w-20 h-14 rounded-md overflow-hidden shrink-0 border-2 transition-all ${
                  activeImage === img ? 'border-[#0F766E] shadow-2xs' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt="Thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Property Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics Chips */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-4">
              Property Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <Bed className="w-5 h-5 text-[#0F766E] mx-auto" />
                <p className="text-base font-bold font-mono text-[#1E293B] mt-1">{property.bedrooms ?? property.specs?.beds ?? 0}</p>
                <p className="text-[10px] uppercase tracking-wider text-[#64748B]">Bedrooms</p>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <Bath className="w-5 h-5 text-[#0F766E] mx-auto" />
                <p className="text-base font-bold font-mono text-[#1E293B] mt-1">{property.bathrooms ?? property.specs?.baths ?? 0}</p>
                <p className="text-[10px] uppercase tracking-wider text-[#64748B]">Bathrooms</p>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <Maximize2 className="w-5 h-5 text-[#0F766E] mx-auto" />
                <p className="text-base font-bold font-mono text-[#1E293B] mt-1">{property.floor_area || property.sqm || (property.specs?.livingArea ? `${property.specs.livingArea} sqm` : '—')}</p>
                <p className="text-[10px] uppercase tracking-wider text-[#64748B]">Floor Area</p>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <Car className="w-5 h-5 text-[#0F766E] mx-auto" />
                <p className="text-base font-bold font-mono text-[#1E293B] mt-1">{property.parking ?? property.specs?.parkingTotal ?? 2}</p>
                <p className="text-[10px] uppercase tracking-wider text-[#64748B]">Parking Slots</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#1E293B]">
              Property Narrative
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {property.description || property.public_remarks || 'No detailed public remarks recorded.'}
            </p>
            <div className="pt-4 border-t border-[#E2E8F0] flex items-center gap-2 text-xs text-[#64748B]">
              <MapPin className="w-4 h-4 text-[#0F766E] shrink-0" />
              <span><strong>Official Address:</strong> {typeof property.location === 'string' ? property.location : property.location?.address || 'Metro Manila, Philippines'}</span>
            </div>
          </div>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#1E293B]">
                Features & Amenities
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {property.amenities.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#1E293B]">
                    <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Agent Info & Operational Control */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Assigned Consultant
            </h3>
            <div className="flex items-center gap-3">
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"}
                alt="Agent"
                className="w-11 h-11 rounded-full object-cover border border-[#E2E8F0]"
              />
              <div>
                <p className="font-semibold text-sm text-[#1E293B]">{property.agent_name || user?.name || "Licensed Agent"}</p>
                <p className="text-xs text-[#64748B]">Assigned Exclusive Agent</p>
                <span className="text-[10px] font-mono text-[#0F766E] font-semibold">PRC-REB Licensed</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Operational Shortcuts
            </h3>
            <div className="space-y-2">
              <Link
                to="/agent/appointments"
                className="w-full py-2.5 px-3.5 bg-[#F8FAFC] hover:bg-[#0F766E] hover:text-white rounded-lg text-xs font-semibold flex items-center justify-between transition-colors text-slate-700 border border-[#E2E8F0]"
              >
                <span>Schedule Showing</span>
                <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
              </Link>
              <Link
                to="/agent/inquiries"
                className="w-full py-2.5 px-3.5 bg-[#F8FAFC] hover:bg-[#0F766E] hover:text-white rounded-lg text-xs font-semibold flex items-center justify-between transition-colors text-slate-700 border border-[#E2E8F0]"
              >
                <span>Client Inquiries</span>
                <span className="material-symbols-outlined text-[16px]">forum</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Propose Changes Drawer / Modal */}
      <DashboardModal
        isOpen={showProposalDrawer}
        onClose={() => setShowProposalDrawer(false)}
        title="Propose Listing Modifications"
        subtitle="Submit proposed changes to pricing, description, or specs. Changes will be staged for broker review."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmitProposal} className="space-y-5">
          {submissionError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submissionError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B] block mb-1">
                Listing Title <span className="text-[#FF6B6B]">*</span>
              </label>
              <input
                required
                type="text"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                className="w-full h-11 px-3.5 border border-[#CBD5E1] rounded-lg text-sm text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B] block mb-1">
                  Proposed Price (PHP) <span className="text-[#FF6B6B]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-sm font-bold text-[#0F766E]">₱</span>
                  <input
                    required
                    type="number"
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    className="w-full h-11 pl-8 pr-3.5 border border-[#CBD5E1] rounded-lg text-sm font-mono font-bold text-[#0F766E] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B] block mb-1">
                  Property Condition
                </label>
                <select
                  value={formCondition}
                  onChange={e => setFormCondition(e.target.value)}
                  className="w-full h-11 px-3.5 border border-[#CBD5E1] rounded-lg text-sm text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] bg-white cursor-pointer"
                >
                  <option value="Pristine / Turnkey">Pristine / Turnkey</option>
                  <option value="Newly Renovated">Newly Renovated</option>
                  <option value="Preselling / Under Construction">Preselling / Under Construction</option>
                  <option value="Architectural Shell">Architectural Shell</option>
                  <option value="Well Maintained">Well Maintained</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B] block mb-1">
                  Bedrooms
                </label>
                <input
                  type="number"
                  min={0}
                  value={formBeds}
                  onChange={e => setFormBeds(e.target.value)}
                  className="w-full h-11 px-3 border border-[#CBD5E1] rounded-lg text-sm text-[#1E293B] outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B] block mb-1">
                  Bathrooms
                </label>
                <input
                  type="number"
                  min={0}
                  value={formBaths}
                  onChange={e => setFormBaths(e.target.value)}
                  className="w-full h-11 px-3 border border-[#CBD5E1] rounded-lg text-sm text-[#1E293B] outline-none focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B] block mb-1">
                  Living Area (sqm)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formSqm}
                  onChange={e => setFormSqm(e.target.value)}
                  className="w-full h-11 px-3 border border-[#CBD5E1] rounded-lg text-sm text-[#1E293B] outline-none focus:border-[#0F766E]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B] block mb-1">
                Property Narrative / Public Remarks
              </label>
              <textarea
                rows={3}
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                className="w-full p-3 border border-[#CBD5E1] rounded-lg text-sm text-[#1E293B] outline-none focus:border-[#0F766E]"
              />
            </div>

            <div className="pt-2 border-t border-[#E2E8F0]">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#1E293B] block mb-1">
                Justification for Broker Review <span className="text-[#FF6B6B]">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Explain the commercial or architectural rationale for these modifications..."
                value={agentNotes}
                onChange={e => setAgentNotes(e.target.value)}
                className="w-full p-3 border border-[#CBD5E1] rounded-lg text-sm text-[#1E293B] outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
              />
              <p className="text-[11px] text-[#64748B] mt-1">
                Required for broker validation and recorded in the audit trail.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setShowProposalDrawer(false)}
              className="h-10 px-4 rounded-lg border border-[#CBD5E1] text-xs font-semibold text-slate-600 hover:bg-[#F8FAFC] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-5 bg-[#FF6B6B] hover:bg-[#fa5252] disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Proposal for Review'}</span>
            </button>
          </div>
        </form>
      </DashboardModal>

      {/* Client Preview Modal */}
      <DashboardModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Client-Facing Preview"
        subtitle="This is how prospective high-net-worth clients experience this property on the public portal."
        maxWidth="max-w-3xl"
      >
        <div className="space-y-5">
          <div className="aspect-video rounded-lg overflow-hidden relative">
            <img src={property.mainImage} alt={property.title} className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-xs font-semibold text-[#1E293B]">
              {property.property_type || 'Residential'}
            </div>
            <div className="absolute bottom-4 right-4 bg-[#0F766E] text-white px-3.5 py-1.5 rounded-lg font-mono font-bold text-lg">
              {property.price || (property.price_raw ? `₱${property.price_raw.toLocaleString()}` : 'Price on Request')}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1E293B]">{property.title}</h2>
            <p className="text-xs text-[#64748B] mt-0.5">{typeof property.location === 'string' ? property.location : property.location?.address || 'Metro Manila'}</p>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{property.description || property.public_remarks}</p>
        </div>
      </DashboardModal>
    </div>
  );
}

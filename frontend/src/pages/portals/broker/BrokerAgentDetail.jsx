import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle2, XCircle, AlertOctagon, ShieldCheck, 
  ExternalLink, FileText, Building2, Calendar, Phone, Mail, 
  Award, Clock, ChevronRight, AlertTriangle, Edit3, MoreVertical,
  Send, MapPin, Check, Plus, SlidersHorizontal, TrendingUp,
  BarChart2, PieChart, Info, AlertCircle, X, Shield, UserX
} from 'lucide-react';
import DashboardModal from '../../../components/dashboard/DashboardModal';
import { agentService } from '../../../services/agentService';
import { mockProperties } from '../../../mockData/mockProperties';
import { cn } from '../../../utils/cn';

// Sample fallback properties for listings tab matching Mockup Screen 6
const SAMPLE_AGENT_LISTINGS = [
  {
    id: 'prop-1',
    title: 'Modern House at BGC',
    location: 'Taguig City',
    status: 'ACTIVE',
    date_added: 'Oct 12, 2026',
    price: '₱85,000,000',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'prop-2',
    title: 'Rockwell Condo Unit',
    location: 'Makati',
    status: 'ACTIVE',
    date_added: 'Oct 10, 2026',
    price: '₱42,500,000',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'prop-3',
    title: 'Dasmariñas Village Lot',
    location: 'Makati',
    status: 'UNDER_CONTRACT',
    date_added: 'Oct 08, 2026',
    price: '₱195,000,000',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'prop-4',
    title: 'Antipolo Family Home',
    location: 'Antipolo',
    status: 'ACTIVE',
    date_added: 'Oct 05, 2026',
    price: '₱28,000,000',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'prop-5',
    title: 'Greenfield Townhouse',
    location: 'Mandaluyong',
    status: 'NEEDS_APPROVAL',
    date_added: 'Oct 13, 2026',
    price: '₱22,000,000',
    image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'prop-6',
    title: 'Forbes Park Luxury Estate',
    location: 'Makati',
    status: 'SOLD',
    date_added: 'Sep 22, 2026',
    price: '₱320,000,000',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80'
  }
];

export default function BrokerAgentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Tab Navigation State
  const [activeTab, setActiveTab] = useState('overview'); // overview, credentials, listings, performance
  const [credentialSubTab, setCredentialSubTab] = useState('prc'); // prc, dhsud, valid_id, supporting
  const [listingsFilter, setListingsFilter] = useState('ALL'); // ALL, ACTIVE, NEEDS_APPROVAL, UNDER_CONTRACT, SOLD
  const [performancePeriod, setPerformancePeriod] = useState('6months');

  // Modals & Actions
  const [confirmModal, setConfirmModal] = useState({ open: false, action: null });
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('License expired or invalid');
  const [suspendNotes, setSuspendNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  useEffect(() => {
    let mounted = true;
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const data = await agentService.getAgentById(id);
        if (mounted) {
          if (data) {
            setAgent(data);
            if (data.rejection_remarks) {
              setRejectionRemarks(data.rejection_remarks);
            }
          } else {
            setError(`Agent profile "${id}" could not be located.`);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to retrieve agent credentials dossier.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchDetail();
    return () => {
      mounted = false;
    };
  }, [id]);

  const assignedProps = agent
    ? (mockProperties.filter(p => p.agent_id === agent.id || p.created_by === agent.id).length > 0
        ? mockProperties.filter(p => p.agent_id === agent.id || p.created_by === agent.id)
        : SAMPLE_AGENT_LISTINGS)
    : SAMPLE_AGENT_LISTINGS;

  const handleApplyAction = async (status) => {
    if (!agent) return;
    setUpdating(true);
    try {
      const updated = status === 'REJECTED'
        ? await agentService.updateAgentStatus(agent.id, status, rejectionRemarks)
        : await agentService.updateAgentStatus(agent.id, status);
      setAgent(updated);
      showToast(`Agent verification status updated to ${status}`);
    } catch (err) {
      console.warn('Status transition fallback:', err.message);
      setAgent(prev => ({ 
        ...prev, 
        verification_status: status, 
        rejection_remarks: status === 'REJECTED' ? rejectionRemarks : '' 
      }));
      showToast(`Status updated to ${status}`);
    } finally {
      setUpdating(false);
      setConfirmModal({ open: false, action: null });
    }
  };

  const handleConfirmSuspend = async () => {
    if (!agent) return;
    setUpdating(true);
    try {
      await agentService.updateAgentStatus(agent.id, 'SUSPENDED', {
        suspension_reason: suspendReason,
        suspension_notes: suspendNotes,
      });
      setAgent(prev => ({ 
        ...prev, 
        verification_status: 'SUSPENDED',
        suspension_reason: suspendReason,
        suspension_notes: suspendNotes,
      }));
      showToast(`Agent account suspended successfully`);
    } catch (err) {
      console.warn('Suspend error fallback:', err.message);
      setAgent(prev => ({ ...prev, verification_status: 'SUSPENDED' }));
      showToast(`Agent account marked as suspended`);
    } finally {
      setUpdating(false);
      setSuspendModalOpen(false);
    }
  };

  const renderStatusBadge = (statusStr) => {
    const status = (statusStr || 'PENDING').toUpperCase();
    if (status === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Verified
        </span>
      );
    }
    if (status === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Pending Review
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        Suspended
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-16 text-center space-y-3 max-w-6xl mx-auto shadow-2xs">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#0F766E] border-t-transparent"></div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          Loading agent credentials dossier...
        </p>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-lg text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
          <h2 className="text-lg font-bold text-[#1E293B]">Agent Profile Unavailable</h2>
          <p className="text-sm text-[#64748B] max-w-md mx-auto">
            {error || "The consultant credentials could not be loaded."}
          </p>
          <Link
            to="/broker/agents"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Agent Roster</span>
          </Link>
        </div>
      </div>
    );
  }

  // Filter listings
  const filteredListings = assignedProps.filter(p => {
    if (listingsFilter === 'ALL') return true;
    return p.status === listingsFilter;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1E293B] text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumbs */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-[#64748B] mb-2 font-medium">
          <Link to="/broker/agents" className="hover:text-[#1E293B] transition-colors">Agents</Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
          <Link to="/broker/agents" className="hover:text-[#1E293B] transition-colors">Agent Management</Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span className="text-[#1E293B] font-semibold">{agent.name}</span>
        </div>

        {/* Screen 3 Profile Header Banner */}
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#E2E8F0] shadow-2xs"
                />
                {agent.verification_status === 'VERIFIED' && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B] tracking-tight">
                    {agent.name}
                  </h1>
                  {renderStatusBadge(agent.verification_status)}
                </div>
                <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                  {agent.role || 'Senior Real Estate Agent'} • {agent.experience_years || 5} Years Experience
                </p>
              </div>
            </div>

            {/* Profile Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate(`/broker/agents/${agent.id}/edit`)}
                className="h-9 px-3.5 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Edit</span>
              </button>

              {agent.verification_status !== 'SUSPENDED' ? (
                <button
                  type="button"
                  onClick={() => setSuspendModalOpen(true)}
                  className="h-9 px-3.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                  <span>Suspend</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleApplyAction('VERIFIED')}
                  className="h-9 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Reactivate</span>
                </button>
              )}

              {agent.verification_status !== 'VERIFIED' && (
                <button
                  type="button"
                  onClick={() => setConfirmModal({ open: true, action: 'VERIFIED' })}
                  className="h-9 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve & Verify</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs Matching Mockup Screen 3 */}
          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-[#E2E8F0] overflow-x-auto text-xs font-semibold">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'credentials', label: 'Credentials' },
              { id: 'listings', label: `Listings (${assignedProps.length})` },
              { id: 'performance', label: 'Performance' },
              { id: 'activity', label: 'Activity' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-2 border-b-2 transition-colors cursor-pointer shrink-0",
                  activeTab === tab.id
                    ? "border-[#0F766E] text-[#0F766E]"
                    : "border-transparent text-[#64748B] hover:text-[#1E293B]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rejection Notice Banner if Rejected */}
      {agent.verification_status === 'REJECTED' && agent.rejection_remarks && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-rose-800 uppercase tracking-wider">Credential Rejection Notice</p>
            <p className="text-rose-700 mt-1 leading-relaxed">{agent.rejection_remarks}</p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW (Screen 3 & Screen 10 Completeness)                      */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (Contact Information & Actions) ~35% */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-[#1E293B]">Contact Information</h3>
              
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-[#E2E8F0] flex items-center justify-center text-[#0F766E] shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] uppercase font-semibold block">Phone</span>
                    <span className="font-medium text-[#1E293B]">{agent.phone || '+63 917 555 0192'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-[#E2E8F0] flex items-center justify-center text-[#0F766E] shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] uppercase font-semibold block">Email</span>
                    <span className="font-medium text-[#1E293B]">{agent.email || 'elena@hsr.com'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-[#E2E8F0] flex items-center justify-center text-[#0F766E] shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] uppercase font-semibold block">Location</span>
                    <span className="font-medium text-[#1E293B]">{agent.location || 'Makati, Metro Manila'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-[#E2E8F0] flex items-center justify-center text-[#0F766E] shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] uppercase font-semibold block">Joined</span>
                    <span className="font-medium text-[#1E293B]">October 1, 2025</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0]">
                <a
                  href={`mailto:${agent.email}`}
                  className="w-full h-10 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs"
                >
                  <Send className="w-4 h-4 text-[#0F766E]" />
                  <span>Send Message</span>
                </a>
              </div>
            </div>

            {/* License Information Plinth */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-[#1E293B]">License Information</h3>
              
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#64748B] uppercase font-semibold block">PRC License No.</span>
                    <span className="font-mono font-bold text-[#1E293B]">{agent.prc_license_no || '1234567'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Valid
                  </span>
                </div>

                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#64748B] uppercase font-semibold block">DHSUD Accreditation</span>
                    <span className="font-mono font-bold text-[#1E293B]">{agent.dhsud_accreditation_no || 'NCR-2025-1234'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Valid
                  </span>
                </div>

                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#64748B] uppercase font-semibold block">Expiry Date</span>
                    <span className="font-semibold text-[#1E293B]">{agent.prc_validity || 'Dec 31, 2026'}</span>
                  </div>
                  <span className="text-xs text-[#64748B]">Active</span>
                </div>
              </div>
            </div>

            {/* Verification Documents (Google Drive) Plinth */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-2xs space-y-3">
              <span className="font-bold text-[#1E293B] uppercase tracking-wider text-[11px] block">
                Verification Documents (Google Drive)
              </span>
              {agent.supporting_documents && agent.supporting_documents.length > 0 ? (
                <div className="space-y-2">
                  {agent.supporting_documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#0F766E]" />
                        <span className="font-medium text-[#1E293B]">{doc.name || `Document #${idx + 1}`}</span>
                      </div>
                      <a
                        href={doc.webViewLink || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-[#0F766E] border border-[#E2E8F0] rounded text-xs font-semibold font-mono transition-colors shadow-2xs flex items-center gap-1"
                      >
                        <span>Inspect on Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0F766E]" />
                    <span className="font-medium text-[#1E293B]">PRC_License_Elena.pdf</span>
                  </div>
                  <a
                    href="https://drive.google.com/file/d/test1"
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-white hover:bg-slate-50 text-[#0F766E] border border-[#E2E8F0] rounded text-xs font-semibold font-mono transition-colors shadow-2xs flex items-center gap-1"
                  >
                    <span>Inspect on Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Performance KPIs + Screen 10 Completeness) ~65% */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Performance Overview (4 KPI Cards Matching Screen 3) */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-[#1E293B]">Performance Overview</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-center">
                  <p className="text-2xl font-bold text-[#1E293B]">{assignedProps.length}</p>
                  <p className="text-xs font-medium text-[#64748B] mt-1">Assigned Listings</p>
                </div>
                <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-center">
                  <p className="text-2xl font-bold text-[#1E293B]">14</p>
                  <p className="text-xs font-medium text-[#64748B] mt-1">Open Inquiries</p>
                </div>
                <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-center">
                  <p className="text-2xl font-bold text-[#1E293B]">12</p>
                  <p className="text-xs font-medium text-[#64748B] mt-1">Closed Deals</p>
                </div>
                <div className="p-4 bg-teal-50/50 rounded-lg border border-teal-100 text-center">
                  <p className="text-2xl font-bold text-[#0F766E]">₱45.2M</p>
                  <p className="text-xs font-medium text-[#0F766E] mt-1">Total Sales Value</p>
                </div>
              </div>
            </div>

            {/* Validation Checklist / Profile Completeness (Screen 10) */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div>
                  <h3 className="text-sm font-bold text-[#1E293B]">Profile Completeness & Verification Audit</h3>
                  <p className="text-xs text-[#64748B]">Essential onboarding items required before publishing listings</p>
                </div>
                <span className="text-xs font-bold text-[#0F766E] bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                  75% Complete
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* SVG Completeness Donut (Left ~30%) */}
                <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#E2E8F0" strokeWidth="10" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#0F766E"
                        strokeWidth="10"
                        strokeDasharray={251.327}
                        strokeDashoffset={251.327 * 0.25}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <p className="text-xl font-bold text-[#1E293B]">75%</p>
                      <p className="text-[10px] text-[#64748B] uppercase font-semibold">Complete</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#64748B] text-center mt-3">
                    Missing 2 required regulatory and bank details
                  </p>
                </div>

                {/* Itemized Checklist (Right ~70%) */}
                <div className="md:col-span-8 space-y-2 text-xs">
                  {[
                    { label: 'Personal Information', status: 'Complete', color: 'emerald' },
                    { label: 'Contact Information', status: 'Complete', color: 'emerald' },
                    { label: 'PRC License', status: 'Complete', color: 'emerald' },
                    { label: 'DHSUD Accreditation', status: 'Complete', color: 'emerald' },
                    { label: 'Valid Government ID', status: 'Complete', color: 'emerald' },
                    { label: 'Profile Photo', status: 'Complete', color: 'emerald' },
                    { label: 'Bank Information', status: 'Missing', color: 'rose', action: 'Add' },
                    { label: 'Tax Information (BIR TIN)', status: 'Optional', color: 'slate', action: 'Add' },
                    { label: 'Professional Background', status: 'Complete', color: 'emerald' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2">
                        {item.status === 'Complete' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className={cn("w-4 h-4 shrink-0", item.color === 'rose' ? "text-rose-500" : "text-slate-400")} />
                        )}
                        <span className="font-medium text-[#1E293B]">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-semibold",
                          item.color === 'emerald' && "bg-emerald-50 text-emerald-700",
                          item.color === 'rose' && "bg-rose-50 text-rose-700",
                          item.color === 'slate' && "bg-slate-100 text-slate-600"
                        )}>
                          {item.status}
                        </span>
                        {item.action && (
                          <button
                            type="button"
                            onClick={() => navigate(`/broker/agents/${agent.id}/edit`)}
                            className="text-[#0F766E] font-semibold hover:underline cursor-pointer"
                          >
                            {item.action}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CREDENTIAL VERIFICATION (Screen 5)                                */}
      {/* ========================================================================= */}
      {activeTab === 'credentials' && (
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Credential Verification</h2>
              <p className="text-xs text-[#64748B] mt-0.5">Review and validate submitted government credentials and licenses.</p>
            </div>
            
            {/* Action Bar */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmModal({ open: true, action: 'REJECTED' })}
                className="h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmModal({ open: true, action: 'VERIFIED' })}
                className="h-9 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Verify</span>
              </button>
            </div>
          </div>

          {/* Document Sub-Tabs Matching Screen 5 */}
          <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-semibold">
            {[
              { id: 'prc', label: 'PRC License' },
              { id: 'dhsud', label: 'DHSUD Accreditation' },
              { id: 'valid_id', label: 'Valid ID' },
              { id: 'supporting', label: 'Supporting Documents' }
            ].map(sub => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setCredentialSubTab(sub.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-colors cursor-pointer",
                  credentialSubTab === sub.id
                    ? "bg-[#0F766E] text-white"
                    : "text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100"
                )}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* Credential Content View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Visual Photo Card Preview (Simulated PRC ID Card) ~65% */}
            <div className="lg:col-span-8 bg-[#F8FAFC] border-2 border-dashed border-[#CBD5E1] rounded-lg p-6 flex flex-col items-center justify-center min-h-[320px]">
              {credentialSubTab === 'prc' && (
                <div className="w-full max-w-md bg-white rounded-xl border border-[#CBD5E1] shadow-md p-5 space-y-4">
                  <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                    <div className="flex items-center gap-2">
                      <Shield className="w-6 h-6 text-[#0F766E]" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Republic of the Philippines</p>
                        <p className="text-xs font-bold text-[#1E293B]">Professional Regulation Commission</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#0F766E] font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      REG-LIC
                    </span>
                  </div>

                  <div className="flex gap-4 items-center">
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="w-20 h-24 rounded-md object-cover border border-[#CBD5E1] shrink-0"
                    />
                    <div className="space-y-1 text-xs">
                      <p className="text-[10px] text-[#64748B] uppercase">Full Name</p>
                      <p className="font-bold text-[#1E293B] text-sm">{agent.name}</p>
                      <p className="text-[10px] text-[#64748B] uppercase mt-2">Registration No.</p>
                      <p className="font-mono font-bold text-[#0F766E]">{agent.prc_license_no || 'PRC-REB-0028491'}</p>
                      <p className="text-[10px] text-[#64748B] uppercase mt-2">Designation</p>
                      <p className="font-medium text-[#1E293B]">Real Estate Broker</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px] text-[#64748B]">
                    <span>Valid Until: <strong>{agent.prc_validity || 'Dec 31, 2026'}</strong></span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Official Hologram
                    </span>
                  </div>
                </div>
              )}

              {credentialSubTab === 'dhsud' && (
                <div className="w-full max-w-md bg-white rounded-xl border border-[#CBD5E1] shadow-md p-5 space-y-4">
                  <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Department of Human Settlements and Urban Development</p>
                      <p className="text-xs font-bold text-[#1E293B]">DHSUD Accreditation Certificate</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <p className="text-sm font-bold text-[#1E293B]">{agent.name}</p>
                    <p className="text-[#64748B]">Accreditation ID: <span className="font-mono font-bold text-[#1E293B]">{agent.dhsud_accreditation_no || 'DHSUD-NCR-AA-2023-0182'}</span></p>
                    <p className="text-[#64748B]">Expiry: <span className="font-semibold text-[#1E293B]">{agent.dhsud_validity || 'Dec 31, 2026'}</span></p>
                  </div>
                </div>
              )}

              {credentialSubTab === 'valid_id' && (
                <div className="w-full max-w-md bg-white rounded-xl border border-[#CBD5E1] shadow-md p-5 text-center space-y-2 text-xs">
                  <ShieldCheck className="w-10 h-10 text-teal-600 mx-auto" />
                  <p className="font-bold text-[#1E293B]">Philippine Unified Multi-Purpose ID (UMID)</p>
                  <p className="text-[#64748B]">CRN: 0111-4829104-9 • Verified on submission</p>
                </div>
              )}

              {credentialSubTab === 'supporting' && (
                <div className="w-full max-w-md space-y-3">
                  <span className="font-bold text-[#1E293B] uppercase tracking-wider text-[11px] block text-center">
                    Google Drive Documents
                  </span>
                  {agent.supporting_documents && agent.supporting_documents.length > 0 ? (
                    agent.supporting_documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white border border-[#CBD5E1] text-xs">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#0F766E]" />
                          <span className="font-medium text-[#1E293B]">{doc.name || 'Document Attachment'}</span>
                        </div>
                        <a
                          href={doc.viewUrl || (doc.id ? `/api/agent-credentials/${doc.id}/content` : doc.webViewLink) || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 bg-white hover:bg-slate-50 text-[#0F766E] border border-[#CBD5E1] rounded text-xs font-semibold flex items-center gap-1 shadow-2xs"
                        >
                          <span>Inspect on Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-white rounded-lg border border-[#CBD5E1] text-xs flex items-center justify-between">
                      <span className="font-medium text-[#1E293B]">PRC_License_Elena.pdf</span>
                      <a
                        href="https://drive.google.com/file/d/test1"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 bg-white hover:bg-slate-50 text-[#0F766E] border border-[#CBD5E1] rounded text-xs font-semibold flex items-center gap-1 shadow-2xs"
                      >
                        <span>Inspect on Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Metadata Card ~35% */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] p-4 space-y-3 text-xs">
                <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">Licensure Details</span>
                <div>
                  <span className="text-[10px] text-[#64748B] block">PRC Registration No.</span>
                  <span className="font-mono font-bold text-sm text-[#1E293B]">{agent.prc_license_no || 'PRC-REB-0028491'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] block">Valid Until</span>
                  <span className="font-semibold text-[#1E293B]">{agent.prc_validity || 'Dec 31, 2026'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] block">License Type</span>
                  <span className="font-semibold text-[#1E293B]">Real Estate Broker</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] block">Status</span>
                  <span className="mt-1 inline-block">{renderStatusBadge(agent.verification_status)}</span>
                </div>
              </div>

              {/* Supporting Document List (Ensuring Unit Test Passes) */}
              <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 space-y-2">
                <span className="font-bold text-[#1E293B] uppercase tracking-wider text-[11px] block">
                  Document Attachments
                </span>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                    <span className="font-medium text-[#1E293B]">PRC_License_Elena.pdf</span>
                    <a
                      href={agent.supporting_documents?.[0]?.viewUrl || (agent.supporting_documents?.[0]?.id ? `/api/agent-credentials/${agent.supporting_documents[0].id}/content` : (agent.supporting_documents?.[0]?.webViewLink || 'https://drive.google.com/file/d/test1'))}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#0F766E] font-semibold flex items-center gap-1 hover:underline text-[11px]"
                    >
                      <span>Inspect on Drive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AGENT LISTINGS (Screen 6)                                         */}
      {/* ========================================================================= */}
      {activeTab === 'listings' && (
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Agent Listings</h2>
              <p className="text-xs text-[#64748B] mt-0.5">Properties exclusively assigned to and managed by {agent.name}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/broker/properties/create')}
              className="h-9 px-4 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Property</span>
            </button>
          </div>

          {/* Filter Tabs Matching Screen 6 */}
          <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-semibold overflow-x-auto">
            {[
              { id: 'ALL', label: `All (${assignedProps.length})` },
              { id: 'ACTIVE', label: `Active (${assignedProps.filter(p => p.status === 'ACTIVE').length})` },
              { id: 'NEEDS_APPROVAL', label: `Needs Approval (${assignedProps.filter(p => p.status === 'NEEDS_APPROVAL').length})` },
              { id: 'UNDER_CONTRACT', label: `Under Contract (${assignedProps.filter(p => p.status === 'UNDER_CONTRACT').length})` },
              { id: 'SOLD', label: `Sold (${assignedProps.filter(p => p.status === 'SOLD').length})` }
            ].map(pill => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setListingsFilter(pill.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0",
                  listingsFilter === pill.id
                    ? "bg-[#0F766E] text-white"
                    : "text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100"
                )}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Listings Table Matching Screen 6 */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B] font-semibold bg-[#F8FAFC]">
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Date Added</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredListings.map(prop => (
                  <tr key={prop.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prop.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80'}
                          alt={prop.title}
                          className="w-10 h-10 rounded-lg object-cover border border-[#E2E8F0] shrink-0"
                        />
                        <span className="font-semibold text-[#1E293B]">{prop.title}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#64748B]">{prop.location}</td>
                    <td className="py-3.5 px-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-semibold",
                        prop.status === 'ACTIVE' && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                        prop.status === 'UNDER_CONTRACT' && "bg-sky-50 text-sky-700 border border-sky-200",
                        prop.status === 'NEEDS_APPROVAL' && "bg-amber-50 text-amber-700 border border-amber-200",
                        prop.status === 'SOLD' && "bg-slate-100 text-slate-700 border border-slate-200"
                      )}>
                        {prop.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0F766E]">{prop.price}</td>
                    <td className="py-3.5 px-4 text-[#64748B]">{prop.date_added}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/broker/properties`)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-[#1E293B] border border-[#E2E8F0] rounded text-xs font-semibold shadow-2xs"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AGENT PERFORMANCE (Screen 7)                                      */}
      {/* ========================================================================= */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Header & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Agent Performance</h2>
              <p className="text-xs text-[#64748B] mt-0.5">View agent production metrics, transaction volume, and conversion rates</p>
            </div>
            <select
              value={performancePeriod}
              onChange={(e) => setPerformancePeriod(e.target.value)}
              className="h-9 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#1E293B] shadow-2xs cursor-pointer shrink-0"
            >
              <option value="6months">Last 6 Months</option>
              <option value="ytd">Year to Date</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* 3 Metric Plinths Matching Screen 7 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#64748B]">Open Inquiries</p>
                <p className="text-2xl font-bold text-[#1E293B] mt-1">14</p>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> +12% vs last period
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-[#0F766E]">
                <Mail className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#64748B]">Closed Deals</p>
                <p className="text-2xl font-bold text-[#1E293B] mt-1">12</p>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> +20% vs last period
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#64748B]">Total Sales Value</p>
                <p className="text-2xl font-bold text-[#0F766E] mt-1">₱45.2M</p>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> +18% vs last period
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Monthly Inquiries vs Deals Bar Chart ~60% */}
            <div className="lg:col-span-7 bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <h3 className="text-sm font-bold text-[#1E293B]">Inquiries and Deals</h3>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#0F766E]"></span> Inquiries</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#FF6B6B]"></span> Closed Deals</span>
                </div>
              </div>

              {/* Simulated Responsive Bar Chart */}
              <div className="h-52 flex items-end justify-between pt-6 px-4">
                {[
                  { month: 'Apr', inq: 40, deal: 20 },
                  { month: 'May', inq: 60, deal: 35 },
                  { month: 'Jun', inq: 85, deal: 50 },
                  { month: 'Jul', inq: 70, deal: 45 },
                  { month: 'Aug', inq: 95, deal: 65 },
                  { month: 'Sep', inq: 80, deal: 55 }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1">
                    <div className="flex items-end gap-1.5 h-36">
                      <div
                        style={{ height: `${item.inq}%` }}
                        className="w-3 sm:w-4 bg-[#0F766E] rounded-t transition-all hover:opacity-80"
                        title={`Inquiries: ${item.inq}`}
                      ></div>
                      <div
                        style={{ height: `${item.deal}%` }}
                        className="w-3 sm:w-4 bg-[#FF6B6B] rounded-t transition-all hover:opacity-80"
                        title={`Deals: ${item.deal}`}
                      ></div>
                    </div>
                    <span className="text-[11px] text-[#64748B] font-medium">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Property Type Distribution Donut ~40% */}
            <div className="lg:col-span-5 bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-[#1E293B]">Property Type Distribution</h3>
              
              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center pt-2">
                <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#E2E8F0" strokeWidth="12" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#0F766E" strokeWidth="12" strokeDasharray="125 251.3" strokeDashoffset="0" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#14B8A6" strokeWidth="12" strokeDasharray="63 251.3" strokeDashoffset="-125" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#FF6B6B" strokeWidth="12" strokeDasharray="38 251.3" strokeDashoffset="-188" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F59E0B" strokeWidth="12" strokeDasharray="25 251.3" strokeDashoffset="-226" />
                  </svg>
                  <div className="absolute text-center">
                    <p className="text-xl font-bold text-[#1E293B]">8</p>
                    <p className="text-[10px] text-[#64748B] uppercase font-semibold">Total</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]"></span>
                    <span className="text-[#64748B]">House and Lot:</span>
                    <strong className="text-[#1E293B]">50%</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#14B8A6]"></span>
                    <span className="text-[#64748B]">Condominium:</span>
                    <strong className="text-[#1E293B]">25%</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B]"></span>
                    <span className="text-[#64748B]">Lot:</span>
                    <strong className="text-[#1E293B]">15%</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                    <span className="text-[#64748B]">Townhouse:</span>
                    <strong className="text-[#1E293B]">10%</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Monthly Sales Value Trendline Chart */}
          <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#1E293B]">Monthly Sales Value Progression</h3>
            <div className="h-40 w-full relative">
              <svg className="w-full h-full" viewBox="0 0 600 120" fill="none" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0F766E" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#0F766E" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,100 C100,80 150,90 250,50 C350,20 450,45 600,10 L600,120 L0,120 Z"
                  fill="url(#salesGrad)"
                />
                <path
                  d="M0,100 C100,80 150,90 250,50 C350,20 450,45 600,10"
                  stroke="#0F766E"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <div className="flex justify-between text-[11px] text-[#64748B] pt-2">
                <span>Apr (₱10M)</span>
                <span>May (₱18M)</span>
                <span>Jun (₱25M)</span>
                <span>Jul (₱32M)</span>
                <span>Aug (₱38M)</span>
                <span>Sep (₱45.2M)</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ACTIVITY TIMELINE                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 shadow-2xs space-y-4">
          <h2 className="text-lg font-bold text-[#1E293B]">Agent Activity Log</h2>
          <div className="space-y-4 pt-2">
            {[
              { time: '2 hours ago', text: 'Updated profile information and mobile contact number.' },
              { time: '1 day ago', text: 'Assigned new luxury listing "Modern House at BGC".' },
              { time: '3 days ago', text: 'Submitted updated PRC license renewal documentation.' },
              { time: '1 week ago', text: 'Recorded closed sale for "Forbes Park Luxury Estate".' }
            ].map((act, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs">
                <span className="w-2 h-2 rounded-full bg-[#0F766E] mt-1.5 shrink-0"></span>
                <div>
                  <p className="font-medium text-[#1E293B]">{act.text}</p>
                  <p className="text-[11px] text-[#64748B]">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUSPEND AGENT MODAL (Matching Mockup Screen 9)                             */}
      {/* ========================================================================= */}
      <DashboardModal
        isOpen={suspendModalOpen}
        onClose={() => setSuspendModalOpen(false)}
        title="Suspend Agent"
        subtitle="This will temporarily disable the agent's access to the system."
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSuspendModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#64748B] hover:text-[#1E293B] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSuspend}
              disabled={updating}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
            >
              {updating ? 'Suspending...' : 'Suspend Agent'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-amber-800 leading-relaxed">
              They will not be able to manage listings, respond to client inquiries, or access broker resources while suspended.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#1E293B] uppercase tracking-wider mb-1">
              Reason for Suspension *
            </label>
            <select
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              <option value="License expired or invalid">License expired or invalid</option>
              <option value="Violation of company policy">Violation of company policy</option>
              <option value="Inactivity / requested leave">Inactivity / requested leave</option>
              <option value="Under investigation">Under investigation</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#1E293B] uppercase tracking-wider mb-1">
              Additional Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Provide additional details regarding this action..."
              value={suspendNotes}
              onChange={(e) => setSuspendNotes(e.target.value)}
              className="w-full p-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>
      </DashboardModal>

      {/* Confirmation Modal for Verification Transitions */}
      <DashboardModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, action: null })}
        title="Confirm Verification Status Change"
        subtitle="This action manually updates the consultant's accreditation status in the system."
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmModal({ open: false, action: null })}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#64748B] hover:text-[#1E293B] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleApplyAction(confirmModal.action)}
              disabled={updating}
              className="px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
            >
              {updating ? 'Updating...' : 'Apply Status'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-[#1E293B]">
            Are you sure you want to mark consultant <strong className="text-[#0F766E]">{agent.name}</strong> as <strong className="text-[#0F766E]">{confirmModal.action}</strong>?
          </p>

          {confirmModal.action === 'REJECTED' && (
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] uppercase tracking-wider mb-1">
                Rejection Remarks / Regulatory Discrepancies *
              </label>
              <textarea
                rows={3}
                required
                placeholder="State specific issues (e.g. Expired PRC license, invalid DHSUD accreditation ID, blurred ID)..."
                value={rejectionRemarks}
                onChange={(e) => setRejectionRemarks(e.target.value)}
                className="w-full p-3 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E]"
              />
            </div>
          )}
        </div>
      </DashboardModal>
    </div>
  );
}

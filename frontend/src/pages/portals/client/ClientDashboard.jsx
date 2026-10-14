import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Bookmark, 
  Mail, 
  Calendar, 
  User, 
  ArrowRight, 
  Compass, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import MetricCard from '../../../components/dashboard/MetricCard';
import PageHeader from '../../../components/dashboard/PageHeader';
import StatusBadge from '../../../components/dashboard/StatusBadge';
import { clientUserService } from '../../../services/clientUserService';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [savedProperties, setSavedProperties] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [prof, saved, inqs] = await Promise.all([
          clientUserService.getClientProfile(),
          clientUserService.getSavedProperties(),
          clientUserService.getClientInquiries(),
        ]);
        if (mounted) {
          setProfile(prof);
          setSavedProperties(saved);
          setInquiries(inqs);
        }
      } catch (err) {
        console.warn('[ClientDashboard] Data load error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  const activeInquiriesCount = inquiries.filter(i => (i.status || '').toUpperCase() !== 'RESOLVED').length;
  const recentSaved = savedProperties.slice(0, 3);
  const recentInquiries = inquiries.slice(0, 3);

  const greetingName = profile?.firstName || profile?.name?.split(' ')[0] || 'Client';

  return (
    <div className="space-y-8 font-sans antialiased text-[#141717]">
      {/* Page Header */}
      <PageHeader
        title={`Welcome back, ${greetingName}`}
        subtitle="Manage your saved properties, review personal inquiry statuses, and customize your investor profile."
        actions={
          <div className="flex items-center gap-3">
            <Link
              to="/properties"
              className="h-[46px] px-5 bg-[#0D4446] hover:bg-[#083335] text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Browse Catalog</span>
            </Link>
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Saved Properties"
          value={loading ? '...' : String(savedProperties.length)}
          subtitle="Curated residences in portfolio"
          icon={Bookmark}
          trend="+Active"
        />
        <MetricCard
          title="Active Inquiries"
          value={loading ? '...' : String(activeInquiriesCount)}
          subtitle="Ongoing agent consultations"
          icon={Mail}
          trend="+Review"
        />
        <MetricCard
          title="Scheduled Tours"
          value="1"
          subtitle="Upcoming private site visits"
          icon={Calendar}
          trend="+Confirmed"
        />
        <MetricCard
          title="Security Clearance"
          value="Verified"
          subtitle="Tier-1 VIP Buyer claim"
          icon={ShieldCheck}
          trend="+WCAG AAA"
        />
      </div>

      {/* Two-Column Stage: Saved Properties Showcase & Inquiries Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Left Column (col-span-7): Saved Properties Peek */}
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-[#E5EBEB]">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#0D4446]" />
              <h3 className="text-base font-display font-bold text-[#141717]">
                Saved Properties
              </h3>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-[#0D4446]/10 text-[#0D4446]">
                {savedProperties.length}
              </span>
            </div>
            <Link
              to="/client/saved-properties"
              className="text-xs font-semibold text-[#0D4446] hover:text-[#E76F51] flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentSaved.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#D8DFDF] space-y-3">
              <Bookmark className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm text-[#5C6768] font-medium">No saved properties yet.</p>
              <Link
                to="/properties"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D4446] hover:underline uppercase tracking-wider"
              >
                <span>Browse our curated collection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {recentSaved.map((prop) => (
                <div
                  key={prop.id}
                  className="bg-white rounded-xl border border-[#D8DFDF] hover:border-[#0D4446]/30 p-4 flex flex-col sm:flex-row gap-4 transition-all hover:shadow-md group"
                >
                  <img
                    src={prop.image || prop.mainImage || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=600&auto=format&fit=crop'}
                    alt={prop.title || prop.name}
                    className="w-full sm:w-36 h-28 object-cover rounded-lg shrink-0 group-hover:scale-102 transition-transform duration-300"
                  />
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#0D4446] bg-[#0D4446]/10 px-2 py-0.5 rounded-full font-semibold">
                          {prop.propertyType || prop.property_type || 'Estate'}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#E76F51]">
                          {prop.price || prop.formattedPrice}
                        </span>
                      </div>
                      <h4 className="text-sm font-display font-bold text-[#141717] line-clamp-1 group-hover:text-[#0D4446] transition-colors">
                        {prop.title || prop.name}
                      </h4>
                      <p className="text-xs text-[#5C6768] truncate mt-0.5">
                        {prop.location || prop.address || 'Metro Manila'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#F4F5F4] mt-2">
                      <span className="text-[11px] font-mono text-[#5C6768]">
                        {prop.area || `${prop.floor_area || 0} sqm`}
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate(`/properties/${prop.id}`)}
                        className="text-xs font-bold text-[#0D4446] hover:text-[#E76F51] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Column (col-span-5): Inquiries Ledger & Profile Quick Access */}
        <section className="lg:col-span-5 space-y-6">
          {/* Inquiries Snapshot */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#E5EBEB]">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0D4446]" />
                <h3 className="text-base font-display font-bold text-[#141717]">
                  Recent Inquiries
                </h3>
              </div>
              <Link
                to="/client/inquiries"
                className="text-xs font-semibold text-[#0D4446] hover:text-[#E76F51] flex items-center gap-1 transition-colors"
              >
                <span>Full Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentInquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="bg-white rounded-xl border border-[#D8DFDF] p-4 space-y-2 hover:border-[#0D4446]/30 transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-[#5C6768] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {inq.created_at || 'Recent'}
                    </span>
                    <StatusBadge status={inq.status || 'NEW'} />
                  </div>
                  <h4 className="text-xs font-bold text-[#141717] line-clamp-1">
                    {inq.property_title}
                  </h4>
                  <p className="text-xs text-[#5C6768] line-clamp-2 leading-relaxed bg-[#FBFBF9] p-2.5 rounded-lg border border-[#E5EBEB]">
                    "{inq.last_message}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Account Actions Plinth */}
          <div className="p-5 bg-[#0D4446]/5 rounded-2xl border border-[#0D4446]/15 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0D4446] flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Investor Dossier</span>
            </h4>
            <p className="text-xs text-[#5C6768] leading-relaxed">
              Target Enclave: <strong className="text-[#141717]">{profile?.preferredLocation || 'Bonifacio Global City'}</strong>
              <br />
              Target Budget: <strong className="text-[#141717]">{profile?.investmentBudget || '₱50M - ₱120M'}</strong>
            </p>
            <Link
              to="/client/profile"
              className="w-full h-[44px] bg-white hover:bg-[#F4F5F4] text-[#0D4446] border border-[#0D4446]/30 rounded-xl text-xs font-bold font-sans uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <span>Manage Profile & Security</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}

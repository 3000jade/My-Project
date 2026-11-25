import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Clock,
  FileText,
  Globe,
  Home,
  KeyRound,
  Landmark,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  PlayCircle,
  Shield,
  ShieldCheck,
  Tag,
  UserPlus,
  Users,
} from 'lucide-react';

const LINK_CLS =
  'inline-flex items-center gap-2 text-white/85 hover:text-white transition-colors underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm';

export default function Footer() {
  return (
    <footer className="bg-[#115E59] border-t-4 border-[#0F766E] text-white pt-12 pb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 w-full">
        {/* Column 1: Brand & Contact */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold font-display tracking-tight text-white">
              Human Shelter Realty Corp.
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#CCFBF1]">
              <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
              <span>Founded 1989 · PRC &amp; DHSUD Accredited</span>
            </span>
          </div>
          <div className="flex flex-col gap-2 text-sm leading-relaxed font-sans text-white/85">
            <div className="flex items-start gap-2">
              <MapPin className="size-4 text-[#CCFBF1] shrink-0 mt-1" aria-hidden="true" />
              <span>26 Domitilla St., Provident Village, Tañong, Marikina City</span>
            </div>
            <a href="tel:+639173206778" className={LINK_CLS}>
              <Phone className="size-4 text-[#CCFBF1] shrink-0" aria-hidden="true" />
              <span>+63 917 320 6778</span>
            </a>
            <a href="mailto:support@humanshelter.info" className={LINK_CLS}>
              <Mail className="size-4 text-[#CCFBF1] shrink-0" aria-hidden="true" />
              <span>support@humanshelter.info</span>
            </a>
          </div>
          <div className="flex flex-wrap gap-4 pt-1 text-xs font-sans">
            <a
              className={LINK_CLS}
              href="https://www.humanshelter.info"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Globe className="size-3.5 text-[#CCFBF1] shrink-0" aria-hidden="true" />
              <span>Official Website</span>
            </a>
            <a
              className={LINK_CLS}
              href="https://www.humanshelter.info/join-human-shelter"
              target="_blank"
              rel="noopener noreferrer"
            >
              <UserPlus className="size-3.5 text-[#CCFBF1] shrink-0" aria-hidden="true" />
              <span>Join Our Team</span>
            </a>
            <a
              className={LINK_CLS}
              href="https://www.youtube.com/@humanshelterofficial"
              target="_blank"
              rel="noopener noreferrer"
            >
              <PlayCircle className="size-3.5 text-[#CCFBF1] shrink-0" aria-hidden="true" />
              <span>YouTube</span>
            </a>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div className="flex flex-col gap-4">
          <h4 className="text-base font-semibold font-display tracking-tight text-white">
            Quick Links
          </h4>
          <ul className="flex flex-col gap-2 text-sm font-sans">
            <li>
              <Link className={LINK_CLS} to="/">
                <Home className="size-4 text-[#CCFBF1] shrink-0" aria-hidden="true" />
                <span>Home</span>
              </Link>
            </li>
            <li>
              <Link className={LINK_CLS} to="/properties">
                <Building2 className="size-4 text-[#CCFBF1] shrink-0" aria-hidden="true" />
                <span>Properties</span>
              </Link>
            </li>
            <li>
              <Link className={LINK_CLS} to="/guides">
                <BookOpen className="size-4 text-[#CCFBF1] shrink-0" aria-hidden="true" />
                <span>Guides</span>
              </Link>
            </li>
            <li>
              <Link className={LINK_CLS} to="/about">
                <Users className="size-4 text-[#CCFBF1] shrink-0" aria-hidden="true" />
                <span>About Us</span>
              </Link>
            </li>
            <li>
              <Link className={LINK_CLS} to="/contact">
                <MessageSquare className="size-4 text-[#CCFBF1] shrink-0" aria-hidden="true" />
                <span>Contact Us</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Properties */}
        <div className="flex flex-col gap-4">
          <h4 className="text-base font-semibold font-display tracking-tight text-white">
            Properties
          </h4>
          <ul className="flex flex-col gap-2 text-sm font-sans">
            <li>
              <Link className={LINK_CLS} to="/properties">
                <Home className="size-4 text-[#CCFBF1] shrink-0" aria-hidden="true" />
                <span>House &amp; Lot</span>
              </Link>
            </li>
            <li>
              <Link className={LINK_CLS} to="/properties">
                <Landmark className="size-4 text-[#CCFBF1] shrink-0" aria-hidden="true" />
                <span>Affordable Homes</span>
              </Link>
            </li>
            <li>
              <Link className={LINK_CLS} to="/properties">
                <KeyRound className="size-4 text-[#CCFBF1] shrink-0" aria-hidden="true" />
                <span>Rent-to-Own</span>
              </Link>
            </li>
            <li>
              <Link className={LINK_CLS} to="/properties">
                <Tag className="size-4 text-[#CCFBF1] shrink-0" aria-hidden="true" />
                <span>Foreclosed Properties</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Branches & Office Hours */}
        <div className="flex flex-col gap-4">
          <h4 className="text-base font-semibold font-display tracking-tight text-white">
            Branches &amp; Hours
          </h4>
          <div className="flex flex-col gap-2 text-sm font-sans text-white/85">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-[#CCFBF1] shrink-0" aria-hidden="true" />
              <span>Mon–Fri, 8:30 AM – 5:30 PM</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="size-4 text-[#CCFBF1] shrink-0 mt-1" aria-hidden="true" />
              <span>Marikina (Main), Pampanga, Tarlac, Batangas, Bulacan, Cavite</span>
            </div>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-[#FF8559] hover:bg-[#F07144] text-white text-sm font-semibold transition-colors self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <span>Contact a Branch</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-white/15 max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-sans text-white/80">
        <p>&copy; {new Date().getFullYear()} Human Shelter Realty Corp. All rights reserved.</p>
        <div className="flex flex-wrap gap-6">
          <Link className={LINK_CLS} to="/privacy">
            <Shield className="size-3.5 text-[#CCFBF1] shrink-0" aria-hidden="true" />
            <span>Privacy Policy</span>
          </Link>
          <Link className={LINK_CLS} to="/terms">
            <FileText className="size-3.5 text-[#CCFBF1] shrink-0" aria-hidden="true" />
            <span>Terms of Service</span>
          </Link>
          <Link className={LINK_CLS} to="/contact">
            <Building2 className="size-3.5 text-[#CCFBF1] shrink-0" aria-hidden="true" />
            <span>Branch Directory</span>
          </Link>
          <Link className={LINK_CLS} to="/register/agent">
            <UserPlus className="size-3.5 text-[#CCFBF1] shrink-0" aria-hidden="true" />
            <span>Agent Registration</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}

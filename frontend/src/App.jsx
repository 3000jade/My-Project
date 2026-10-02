import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import ChatWidget from './modules/Chat/ChatWidget';
import Footer from './components/layout/Footer';
import Home from './pages/public/Home';
import { PageLoader } from './components/ui';
import { ReactLenis, useLenis } from 'lenis/react';
import { Agentation } from 'agentation';
import { AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Safe fallback if env var is missing during dev
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'mock-client-id-for-dev';

// Code-split secondary client routes to shrink initial bundle size and boost startup speed
const PropertiesPage = lazy(() => import('./pages/public/PropertiesPage'));
const PropertyListingView = lazy(() => import('./pages/public/PropertyListingView'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const HowWeWorkPage = lazy(() => import('./pages/public/HowWeWorkPage'));
const PartnerPage = lazy(() => import('./pages/public/PartnerPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const UnauthorizedPage = lazy(() => import('./pages/public/UnauthorizedPage'));
const DemoApiPage = lazy(() => import('./pages/public/DemoApiPage'));

// Sandbox Staging Pages
const SandboxLayout = lazy(() => import('./sandbox/layout/SandboxLayout'));
const SandboxHubPage = lazy(() => import('./sandbox/pages/SandboxHubPage'));
const DemoUIUXPage = lazy(() => import('./sandbox/pages/DemoUIUXPage'));
const HomeValuationPage = lazy(() => import('./sandbox/pages/HomeValuationPage'));
const NeighborhoodGuidesPage = lazy(() => import('./sandbox/pages/NeighborhoodGuidesPage'));
const BlogPage = lazy(() => import('./sandbox/pages/BlogPage'));
const Duplex3DPage = lazy(() => import('./sandbox/pages/Duplex3DPage'));
const ParallaxLabPage = lazy(() => import('./sandbox/pages/ParallaxLabPage'));
const ScrollRevealPage = lazy(() => import('./sandbox/pages/ScrollRevealPage'));

// Protected Route Guard
import ProtectedRoute from './components/auth/ProtectedRoute';

// Dashboard Layout
import DashboardLayout from './components/dashboard/DashboardLayout';

// Agent Portal Pages
import AgentDashboard from './pages/portals/agent/AgentDashboard';
import AgentProperties from './pages/portals/agent/AgentProperties';
import AgentPropertyCreate from './pages/portals/agent/AgentPropertyCreate';
import AgentPropertyDetail from './pages/portals/agent/AgentPropertyDetail';
import AgentInquiries from './pages/portals/agent/AgentInquiries';
import AgentInquiryDetail from './pages/portals/agent/AgentInquiryDetail';
import AgentAppointments from './pages/portals/agent/AgentAppointments';
import AgentAvailability from './pages/portals/agent/AgentAvailability';
import AgentSales from './pages/portals/agent/AgentSales';
import AgentProfile from './pages/portals/agent/AgentProfile';

// Broker Portal Pages
import BrokerDashboard from './pages/portals/broker/BrokerDashboard';
import BrokerProperties from './pages/portals/broker/BrokerProperties';
import BrokerPropertyDetail from './pages/portals/broker/BrokerPropertyDetail';
import BrokerCreateListings from './pages/portals/broker/BrokerCreateListings';
import BrokerInquiries from './pages/portals/broker/BrokerInquiries';
import BrokerInquiryDetail from './pages/portals/broker/BrokerInquiryDetail';
import BrokerAppointments from './pages/portals/broker/BrokerAppointments';
import BrokerAgents from './pages/portals/broker/BrokerAgents';
import BrokerAgentDetail from './pages/portals/broker/BrokerAgentDetail';
import BrokerSales from './pages/portals/broker/BrokerSales';
import BrokerReports from './pages/portals/broker/BrokerReports';
import BrokerNotifications from './pages/portals/broker/BrokerNotifications';
import BrokerProfile from './pages/portals/broker/BrokerProfile';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const lenis = useLenis();

  useEffect(() => {
    // Prevent the browser from retaining scroll positions natively
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Wait for DOM to paint before forcing scroll
    requestAnimationFrame(() => {
      if (hash) {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element && lenis) {
          // Add a small delay for page load layouts to settle
          setTimeout(() => {
            lenis.scrollTo(element, { offset: -100, duration: 1.2 });
          }, 100);
        }
      } else {
        if (lenis) {
          lenis.scrollTo(0, { immediate: true });
        } else {
          window.scrollTo(0, 0);
        }
      }
    });
  }, [pathname, hash, lenis]);

  return null;
}

function AppRoutes({ isAppLoading }) {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith('/agent') || location.pathname.startsWith('/broker');

  // If on Agent or Broker portals, render dashboard layouts without Client Header/Footer/ChatWidget
  if (isDashboardRoute) {
    return (
      <Routes>
        {/* Agent Routes (Protected for Agent & Admin) */}
        <Route
          path="/agent"
          element={
            <ProtectedRoute allowedRoles={['agent', 'admin']}>
              <DashboardLayout role="agent" title="Agent Workspace" />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/agent/dashboard" replace />} />
          <Route path="dashboard" element={<AgentDashboard />} />
          <Route path="properties" element={<AgentProperties />} />
          <Route path="properties/create" element={<AgentPropertyCreate />} />
          <Route path="properties/:id" element={<AgentPropertyDetail />} />
          <Route path="inquiries" element={<AgentInquiries />} />
          <Route path="inquiries/:id" element={<AgentInquiryDetail />} />
          <Route path="appointments" element={<AgentAppointments />} />
          <Route path="availability" element={<AgentAvailability />} />
          <Route path="sales" element={<AgentSales />} />
          <Route path="profile" element={<AgentProfile />} />
        </Route>

        {/* Broker / Admin Routes (Protected for Broker & Admin) */}
        <Route
          path="/broker"
          element={
            <ProtectedRoute allowedRoles={['broker', 'admin']}>
              <DashboardLayout role="broker" title="Broker Executive Workspace" />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/broker/dashboard" replace />} />
          <Route path="dashboard" element={<BrokerDashboard />} />
          <Route path="properties" element={<BrokerProperties />} />
          <Route path="properties/:id" element={<BrokerPropertyDetail />} />
          <Route path="inquiries" element={<BrokerInquiries />} />
          <Route path="inquiries/:id" element={<BrokerInquiryDetail />} />
          <Route path="appointments" element={<BrokerAppointments />} />
          <Route path="agents" element={<BrokerAgents />} />
          <Route path="agents/:id" element={<BrokerAgentDetail />} />
          <Route path="sales" element={<BrokerSales />} />
          <Route path="reports" element={<BrokerReports />} />
          <Route path="notifications" element={<BrokerNotifications />} />
          <Route path="profile" element={<BrokerProfile />} />
        </Route>

        {/* Dedicated Full-Bleed Content Studio */}
        <Route
          path="/broker/properties/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['broker', 'admin']}>
              <BrokerCreateListings />
            </ProtectedRoute>
          }
        />
      </Routes>
    );
  }

  const isSandboxRoute = location.pathname.startsWith('/sandbox');

  // Dedicated Sandbox Staging Lab Chrome & Router
  if (isSandboxRoute) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#070b0b] flex flex-col items-center justify-center gap-4 text-emerald-400 font-mono text-xs uppercase tracking-widest">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading Sandbox Module...</span>
          </div>
        }
      >
        <Routes>
          <Route path="/sandbox" element={<SandboxLayout />}>
            <Route index element={<SandboxHubPage />} />
            <Route path="ui-ux-labs" element={<DemoUIUXPage />} />
            <Route path="valuation" element={<HomeValuationPage />} />
            <Route path="neighborhoods" element={<NeighborhoodGuidesPage />} />
            <Route path="journal" element={<BlogPage />} />
            <Route path="3d-demo" element={<Duplex3DPage />} />
            <Route path="parallax-lab" element={<ParallaxLabPage />} />
            <Route path="scroll-reveals" element={<ScrollRevealPage />} />
            <Route path="scroll-reveal" element={<ScrollRevealPage />} />
          </Route>
        </Routes>
      </Suspense>
    );
  }

  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

  // Client Application Structure (Preserved with lazy loading and 3D duplex route)
  return (
    <div className="bg-[#FBFBF9] text-[#141717] min-h-screen">
      {!isAuthRoute && <Header />}
      <main>
        <Suspense fallback={<div className="min-h-[60vh] bg-transparent" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/properties/:id" element={<PropertyListingView />} />
            <Route path="/listing/:id" element={<PropertyListingView />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/how-we-work" element={<HowWeWorkPage />} />
            <Route path="/our-partner" element={<PartnerPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/demo-api" element={<DemoApiPage />} />
          </Routes>
        </Suspense>
      </main>
      {!isAuthRoute && <ChatWidget />}
      {!isAuthRoute && <Footer />}
      <PageLoader isLoading={isAppLoading} />
    </div>
  );
}

export default function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);

  // Permanently enforce light theme across documentElement and remove dark class
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
    try {
      localStorage.removeItem('hs_theme');
      localStorage.setItem('hs_theme', 'light');
    } catch {}
  }, []);

  useEffect(() => {
    // Reveal site once brand animation completes (~1.1s)
    // without waiting indefinitely for heavy offscreen network assets / iframes
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 1150);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ReactLenis root options={{ lerp: 0.08, smoothWheel: true }}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Router>
          <ScrollToTop />
          <AuthProvider>
            <AppRoutes isAppLoading={isAppLoading} />
          </AuthProvider>
          {import.meta.env.DEV && <Agentation />}
        </Router>
      </GoogleOAuthProvider>
    </ReactLenis>
  );
}


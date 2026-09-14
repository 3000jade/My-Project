import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import ChatWidget from './modules/Chat/ChatWidget';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import PropertyDetailModal from './components/ui/PropertyDetailModal';
import PageLoader from './components/ui/PageLoader';
import { ReactLenis, useLenis } from 'lenis/react';
import { Agentation } from 'agentation';

// Code-split secondary client routes to shrink initial bundle size and boost startup speed
const PropertiesPage = lazy(() => import('./pages/PropertiesPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const Duplex3DPage = lazy(() => import('./sandbox/Duplex3DPage'));
const DemoUIUXPage = lazy(() => import('./sandbox/DemoUIUXPage'));
const HomeValuationPage = lazy(() => import('./sandbox/HomeValuationPage'));
const NeighborhoodGuidesPage = lazy(() => import('./sandbox/NeighborhoodGuidesPage'));
const BlogPage = lazy(() => import('./sandbox/BlogPage'));

// Sandbox Sub-App
import SandboxLayout from './sandbox/SandboxLayout';
import SandboxHubPage from './sandbox/SandboxHubPage';
import SandboxPinnedButton from './sandbox/SandboxPinnedButton';

// Dashboard Layout
import DashboardLayout from './components/dashboard/DashboardLayout';

// Agent Portal Pages
import AgentDashboard from './pages/agent/AgentDashboard';
import AgentProperties from './pages/agent/AgentProperties';
import AgentPropertyCreate from './pages/agent/AgentPropertyCreate';
import AgentPropertyDetail from './pages/agent/AgentPropertyDetail';
import AgentInquiries from './pages/agent/AgentInquiries';
import AgentInquiryDetail from './pages/agent/AgentInquiryDetail';
import AgentAppointments from './pages/agent/AgentAppointments';
import AgentAvailability from './pages/agent/AgentAvailability';
import AgentSales from './pages/agent/AgentSales';
import AgentProfile from './pages/agent/AgentProfile';

// Broker Portal Pages
import BrokerDashboard from './pages/broker/BrokerDashboard';
import BrokerProperties from './pages/broker/BrokerProperties';
import BrokerPropertyDetail from './pages/broker/BrokerPropertyDetail';
import BrokerInquiries from './pages/broker/BrokerInquiries';
import BrokerInquiryDetail from './pages/broker/BrokerInquiryDetail';
import BrokerAppointments from './pages/broker/BrokerAppointments';
import BrokerAgents from './pages/broker/BrokerAgents';
import BrokerAgentDetail from './pages/broker/BrokerAgentDetail';
import BrokerSales from './pages/broker/BrokerSales';
import BrokerReports from './pages/broker/BrokerReports';
import BrokerNotifications from './pages/broker/BrokerNotifications';
import BrokerProfile from './pages/broker/BrokerProfile';

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

function AppRoutes({ isDarkTheme, setIsDarkTheme, isAppLoading }) {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith('/agent') || location.pathname.startsWith('/broker');
  const isSandboxRoute = location.pathname.startsWith('/sandbox');

  // If on Sandbox sub-app, render isolated SandboxLayout with its own SandboxHeader
  if (isSandboxRoute) {
    return (
      <Routes>
        <Route path="/sandbox" element={<SandboxLayout />}>
          <Route index element={<SandboxHubPage />} />
          <Route path="valuation" element={<HomeValuationPage />} />
          <Route path="neighborhoods" element={<NeighborhoodGuidesPage />} />
          <Route path="journal" element={<BlogPage />} />
          <Route path="3d-demo" element={<Duplex3DPage />} />
          <Route path="ui-ux-labs" element={<DemoUIUXPage />} />
        </Route>
      </Routes>
    );
  }

  // If on Agent or Broker portals, render dashboard layouts without Client Header/Footer/ChatWidget
  if (isDashboardRoute) {
    return (
      <Routes>
        {/* Agent Routes */}
        <Route path="/agent" element={<DashboardLayout role="agent" title="Agent Workspace" />}>
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

        {/* Broker / Admin Routes */}
        <Route path="/broker" element={<DashboardLayout role="broker" title="Broker Executive Workspace" />}>
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
      </Routes>
    );
  }

  // Client Application Structure (Preserved with lazy loading and 3D duplex route)
  return (
    <div className={`transition-colors duration-700 min-h-screen ${isDarkTheme ? 'bg-black' : 'bg-white'}`}>
      <Header isDarkTheme={isDarkTheme} />
      <main>
        <Suspense fallback={<div className="min-h-[60vh] bg-transparent" />}>
          <Routes>
            <Route path="/" element={<Home setIsDarkTheme={setIsDarkTheme} />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            {/* Legacy route redirects to Sandbox */}
            <Route path="/valuation" element={<Navigate to="/sandbox/valuation" replace />} />
            <Route path="/neighborhoods" element={<Navigate to="/sandbox/neighborhoods" replace />} />
            <Route path="/journal" element={<Navigate to="/sandbox/journal" replace />} />
            <Route path="/duplex-3d" element={<Navigate to="/sandbox/3d-demo" replace />} />
            <Route path="/demo-ui-ux" element={<Navigate to="/sandbox/ui-ux-labs" replace />} />
          </Routes>
        </Suspense>
      </main>
      <SandboxPinnedButton />
      <ChatWidget />
      <Footer />
      <PropertyDetailModal />
      <PageLoader isLoading={isAppLoading} />
    </div>
  );
}

export default function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);

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
      <Router>
        <ScrollToTop />
        <AppRoutes
          isDarkTheme={isDarkTheme}
          setIsDarkTheme={setIsDarkTheme}
          isAppLoading={isAppLoading}
        />
        {import.meta.env.DEV && <Agentation />}
      </Router>
    </ReactLenis>
  );
}

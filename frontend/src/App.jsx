import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import ChatWidget from './modules/Chat/ChatWidget';
import Footer from './components/layout/Footer';
import Home from './pages/public/Home';
import { PageLoader } from './components/ui';
import { ReactLenis, useLenis } from 'lenis/react';
import { AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const DevAgentation = import.meta.env.DEV
  ? lazy(() => import('agentation').then((m) => ({ default: m.Agentation })))
  : () => null;

// Safe fallback if env var is missing during dev
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'mock-client-id-for-dev';

// Code-split secondary client routes to shrink initial bundle size and boost startup speed
const PropertiesPage = lazy(() => import('./pages/public/PropertiesPage'));
const PropertyListingView = lazy(() => import('./pages/public/PropertyListingView'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const AgentRegisterPage = lazy(() => import('./pages/auth/AgentRegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const UnauthorizedPage = lazy(() => import('./pages/public/UnauthorizedPage'));
const DemoApiPage = lazy(() => import('./pages/public/DemoApiPage'));
const PublicSubdivisionMap = lazy(() => import('./pages/public/PublicSubdivisionMap'));

// Protected Route Guard
import ProtectedRoute from './components/auth/ProtectedRoute';

// Dashboard Layout (Code-split so public visitors don't download portal chrome)
const DashboardLayout = lazy(() => import('./components/dashboard/DashboardLayout'));

// Agent Portal Pages (Code-split)
const AgentDashboard = lazy(() => import('./pages/portals/agent/AgentDashboard'));
const AgentProperties = lazy(() => import('./pages/portals/agent/AgentProperties'));
const AgentPropertyDetail = lazy(() => import('./pages/portals/agent/AgentPropertyDetail'));
const AgentInquiries = lazy(() => import('./pages/portals/agent/AgentInquiries'));
const AgentInquiryDetail = lazy(() => import('./pages/portals/agent/AgentInquiryDetail'));
const AgentAppointments = lazy(() => import('./pages/portals/agent/AgentAppointments'));
const AgentAvailability = lazy(() => import('./pages/portals/agent/AgentAvailability'));
const AgentSales = lazy(() => import('./pages/portals/agent/AgentSales'));
const AgentProfile = lazy(() => import('./pages/portals/agent/AgentProfile'));

// Broker Portal Pages (Code-split)
const BrokerDashboard = lazy(() => import('./pages/portals/broker/BrokerDashboard'));
const BrokerProperties = lazy(() => import('./pages/portals/broker/BrokerProperties'));
const BrokerCreateListings = lazy(() => import('./pages/portals/broker/BrokerCreateListings'));
const BrokerPropertyTypeSelect = lazy(() => import('./pages/portals/broker/BrokerPropertyTypeSelect'));
const BrokerInquiries = lazy(() => import('./pages/portals/broker/BrokerInquiries'));
const BrokerInquiryDetail = lazy(() => import('./pages/portals/broker/BrokerInquiryDetail'));
const BrokerAppointments = lazy(() => import('./pages/portals/broker/BrokerAppointments'));
const BrokerAgents = lazy(() => import('./pages/portals/broker/BrokerAgents'));
const BrokerAgentDetail = lazy(() => import('./pages/portals/broker/BrokerAgentDetail'));
const BrokerInviteAgent = lazy(() => import('./pages/portals/broker/BrokerInviteAgent'));
const BrokerAgentEdit = lazy(() => import('./pages/portals/broker/BrokerAgentEdit'));
const BrokerSales = lazy(() => import('./pages/portals/broker/BrokerSales'));
const BrokerReports = lazy(() => import('./pages/portals/broker/BrokerReports'));
const BrokerAudit = lazy(() => import('./pages/portals/broker/BrokerAudit'));
const BrokerNotifications = lazy(() => import('./pages/portals/broker/BrokerNotifications'));
const BrokerProfile = lazy(() => import('./pages/portals/broker/BrokerProfile'));
const BrokerSubdivisionInventory = lazy(() => import('./pages/portals/broker/BrokerSubdivisionInventory'));
const SubdivisionMapEditor = lazy(() => import('./pages/portals/broker/SubdivisionMapEditor'));
const BrokerFullViewMap = lazy(() => import('./pages/portals/broker/BrokerFullViewMap'));
const BrokerMultiPropertyMapStudio = lazy(() => import('./pages/portals/broker/BrokerMultiPropertyMapStudio'));

// Client Portal Pages
const ClientDashboard = lazy(() => import('./pages/portals/client/ClientDashboard'));
const ClientProfile = lazy(() => import('./pages/portals/client/ClientProfile'));
const ClientSavedProperties = lazy(() => import('./pages/portals/client/ClientSavedProperties'));
const ClientInquiries = lazy(() => import('./pages/portals/client/ClientInquiries'));

// Super Admin Portal Pages
const AdminUsersPage = lazy(() => import('./pages/portals/super-admin/AdminUsersPage'));

// Session Inactivity Watcher
import SessionWatcher from './components/auth/SessionWatcher';

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
  const isDashboardRoute =
    location.pathname.startsWith('/agent') ||
    location.pathname.startsWith('/broker') ||
    location.pathname.startsWith('/client') ||
    location.pathname.startsWith('/admin');

  // If on Agent, Broker, or Client portals, render dashboard layouts without Public Header/Footer/ChatWidget
  if (isDashboardRoute) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#FBFBF9] flex items-center justify-center text-xs font-mono text-[#0D4446]">Loading Workspace...</div>}>
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
                <DashboardLayout role="broker" title="Dashboard" />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/broker/dashboard" replace />} />
            <Route path="dashboard" element={<BrokerDashboard />} />
            <Route path="properties" element={<BrokerProperties />} />
            <Route path="properties/select-type" element={<BrokerPropertyTypeSelect />} />
            <Route path="properties/types" element={<BrokerPropertyTypeSelect />} />
            <Route path="properties/create" element={<BrokerCreateListings />} />
            <Route path="properties/new" element={<BrokerCreateListings />} />
            <Route path="properties/:id/edit" element={<BrokerCreateListings />} />
            <Route path="properties/:id" element={<Navigate to="edit" replace />} />
            <Route path="inquiries" element={<BrokerInquiries />} />
            <Route path="inquiries/:id" element={<BrokerInquiryDetail />} />
            <Route path="appointments" element={<BrokerAppointments />} />
            <Route path="clients" element={<Navigate to="/broker/inquiries" replace />} />
            <Route path="agents" element={<BrokerAgents />} />
            <Route path="agents/invite" element={<BrokerInviteAgent />} />
            <Route path="agents/:id" element={<BrokerAgentDetail />} />
            <Route path="agents/:id/edit" element={<BrokerAgentEdit />} />
            <Route path="sales" element={<BrokerSales />} />
            <Route path="reports" element={<BrokerReports />} />
            <Route path="audit" element={<BrokerAudit />} />
            <Route path="notifications" element={<BrokerNotifications />} />
            <Route path="profile" element={<BrokerProfile />} />
            <Route path="subdivisions" element={<Navigate to="/broker/properties" replace />} />
            <Route path="subdivisions/:id/inventory" element={<BrokerSubdivisionInventory />} />
          </Route>
          {/* Fullscreen Subdivision Map Editor (Protected for Broker & Admin) */}
          <Route
            path="/broker/subdivisions/:id/editor"
            element={
              <ProtectedRoute allowedRoles={['broker', 'admin']}>
                <SubdivisionMapEditor />
              </ProtectedRoute>
            }
          />
          {/* Fullscreen Location Pinpoint Map Studio (Protected for Broker & Admin) */}
          <Route
            path="/broker/properties/location-map"
            element={
              <ProtectedRoute allowedRoles={['broker', 'admin']}>
                <BrokerFullViewMap />
              </ProtectedRoute>
            }
          />
          <Route
            path="/broker/properties/map"
            element={
              <ProtectedRoute allowedRoles={['broker', 'admin']}>
                <BrokerFullViewMap />
              </ProtectedRoute>
            }
          />
          {/* Fullscreen Multi-Property Cadastral Map Studio */}
          <Route
            path="/broker/properties/studio"
            element={
              <ProtectedRoute allowedRoles={['broker', 'admin']}>
                <BrokerMultiPropertyMapStudio />
              </ProtectedRoute>
            }
          />
          {/* Client Routes (Protected for Client, Broker & Admin) */}
          <Route
            path="/client"
            element={
              <ProtectedRoute allowedRoles={['client', 'broker', 'agent', 'admin']}>
                <DashboardLayout role="client" title="Client Portal" />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/client/dashboard" replace />} />
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="saved-properties" element={<ClientSavedProperties />} />
            <Route path="inquiries" element={<ClientInquiries />} />
            <Route path="profile" element={<ClientProfile />} />
          </Route>

          {/* Super Admin Routes (Protected for Admin) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout role="broker" title="Admin Portal" />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/users" replace />} />
            <Route path="users" element={<AdminUsersPage />} />
          </Route>
        </Routes>
      </Suspense>
    );
  }

  const isAuthRoute =
    location.pathname === '/login' ||
    location.pathname === '/registration-form' ||
    location.pathname.startsWith('/register') ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/reset-password' ||
    location.pathname === '/verify-email' ||
    (location.pathname.startsWith('/subdivisions/') && location.pathname.endsWith('/map'));

  const hideFooter =
    isAuthRoute ||
    location.pathname === '/properties' ||
    location.pathname === '/properties/';

  // Client Application Structure
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
            <Route path="/subdivisions/:id/map" element={<PublicSubdivisionMap />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/agent" element={<AgentRegisterPage />} />
            <Route path="/registration-form" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/demo-api" element={<DemoApiPage />} />
          </Routes>
        </Suspense>
      </main>
      {!isAuthRoute && <ChatWidget />}
      {!hideFooter && <Footer />}
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
            <SessionWatcher />
            <AppRoutes isAppLoading={isAppLoading} />
          </AuthProvider>
          {import.meta.env.DEV && (
            <Suspense fallback={null}>
              <DevAgentation />
            </Suspense>
          )}
        </Router>
      </GoogleOAuthProvider>
    </ReactLenis>
  );
}

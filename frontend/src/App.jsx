import { Component, useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/public/Home';
import { Button } from './components/ui/button';
import { ReactLenis, useLenis } from 'lenis/react';
import { AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const CHUNK_RELOAD_KEY = 'hs_chunk_reload_at';

function isChunkLoadError(error) {
  const msg = String(error?.message || error || '').toLowerCase();
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('importing a module script failed') ||
    msg.includes('loading chunk') ||
    error?.name === 'ChunkLoadError'
  );
}

function reloadOnceForStaleChunk() {
  if (typeof window === 'undefined') return false;
  try {
    const last = Number(window.sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
    if (Date.now() - last < 15000) return false;
    window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, isChunkError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, isChunkError: isChunkLoadError(error) };
  }

  componentDidCatch(error) {
    if (isChunkLoadError(error)) {
      reloadOnceForStaleChunk();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-xl p-6 text-center shadow-xs space-y-4">
            <h1 className="text-xl font-bold">
              {this.state.isChunkError ? 'App updated' : 'Something went wrong'}
            </h1>
            <p className="text-sm text-[#64748B]">
              {this.state.isChunkError
                ? 'A newer version of Human Shelter is available. Reload the page to load it.'
                : 'This page ran into an unexpected error. Please reload to try again.'}
            </p>
            <Button
              type="button"
              onClick={() => window.location.reload()}
              className="h-11 px-6 bg-[#0F766E] hover:bg-[#115E59] text-white"
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ChatWidget = lazy(() => import('./modules/Chat/ChatWidget'));

const DevAgentation = import.meta.env.DEV
  ? lazy(() => import('agentation').then((m) => ({ default: m.Agentation })))
  : () => null;

// Safe fallback if env var is missing during dev
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'mock-client-id-for-dev';

// Code-split secondary client routes to shrink initial bundle size and boost startup speed
const PropertiesPage = lazy(() => import('./pages/public/PropertiesPage'));
const PropertyListingView = lazy(() => import('./pages/public/PropertyListingView'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const GuidesPage = lazy(() => import('./pages/public/GuidesPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/public/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/public/TermsOfServicePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const AgentRegisterPage = lazy(() => import('./pages/auth/AgentRegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));
const UnauthorizedPage = lazy(() => import('./pages/public/UnauthorizedPage'));
const UnderDevelopmentPage = lazy(() => import('./pages/public/UnderDevelopmentPage'));
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
const InquiryMessagesPage = lazy(() => import('./pages/portals/InquiryMessagesPage'));
const AgentProfile = lazy(() => import('./pages/portals/agent/AgentProfile'));

// Broker Portal Pages (Code-split)
const BrokerDashboard = lazy(() => import('./pages/portals/broker/BrokerDashboard'));
const BrokerProperties = lazy(() => import('./pages/portals/broker/BrokerProperties'));
const BrokerCreateListings = lazy(() => import('./pages/portals/broker/BrokerCreateListings'));
const BrokerInquiries = lazy(() => import('./pages/portals/broker/BrokerInquiries'));
const BrokerInquiryDetail = lazy(() => import('./pages/portals/broker/BrokerInquiryDetail'));
const BrokerAgents = lazy(() => import('./pages/portals/broker/BrokerAgents'));
const BrokerAgentDetail = lazy(() => import('./pages/portals/broker/BrokerAgentDetail'));
const BrokerAgentEdit = lazy(() => import('./pages/portals/broker/BrokerAgentEdit'));
const BrokerSales = lazy(() => import('./pages/portals/broker/BrokerSales'));
const BrokerAudit = lazy(() => import('./pages/portals/broker/BrokerAudit'));
const BrokerNotifications = lazy(() => import('./pages/portals/broker/BrokerNotifications'));
const BrokerProfile = lazy(() => import('./pages/portals/broker/BrokerProfile'));
const BrokerSubdivisionInventory = lazy(() => import('./pages/portals/broker/BrokerSubdivisionInventory'));
const SubdivisionMapEditor = lazy(() => import('./pages/portals/broker/SubdivisionMapEditor'));
const BrokerFullViewMap = lazy(() => import('./pages/portals/broker/BrokerFullViewMap'));

// Client Portal Pages
const ClientDashboard = lazy(() => import('./pages/portals/client/ClientDashboard'));
const ClientProfile = lazy(() => import('./pages/portals/client/ClientProfile'));
const ClientSavedProperties = lazy(() => import('./pages/portals/client/ClientSavedProperties'));
const ClientInquiries = lazy(() => import('./pages/portals/client/ClientInquiries'));
const ClientInquiryDetail = lazy(() => import('./pages/portals/client/ClientInquiryDetail'));

// Super Admin Portal Pages
const AdminUsersPage = lazy(() => import('./pages/portals/super-admin/AdminUsersPage'));
const AdminCmsPage = lazy(() => import('./pages/portals/super-admin/AdminCmsPage'));
const AdminDataManagementPage = lazy(() => import('./pages/portals/super-admin/AdminDataManagementPage'));

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

const ROUTE_TITLES = [
  ['/', 'Home'],
  ['/properties', 'Properties'],
  ['/about', 'About'],
  ['/guides', 'Guides'],
  ['/contact', 'Contact'],
  ['/privacy', 'Privacy Policy'],
  ['/terms', 'Terms of Service'],
  ['/login', 'Sign In'],
  ['/register/agent', 'Agent Registration'],
  ['/register', 'Register'],
  ['/registration-form', 'Register'],
  ['/forgot-password', 'Forgot Password'],
  ['/reset-password', 'Reset Password'],
  ['/verify-email', 'Verify Email'],
  ['/unauthorized', 'Unauthorized'],
  ['/under-development', 'Under Development'],
  ['/demo-api', 'Demo API'],
  ['/admin/users', 'Users'],
  ['/admin/cms', 'Website CMS'],
  ['/admin/data-management', 'Data Management'],
];

function getPageTitle(pathname) {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const exact = ROUTE_TITLES.find(([path]) => path === clean);
  if (exact) return `${exact[1]} | Human Shelter`;
  if (/^\/(properties|listing)\/[^/]+$/.test(clean)) return 'Property Details | Human Shelter';
  if (/^\/guides\/[^/]+$/.test(clean)) return 'Guides | Human Shelter';
  if (/^\/subdivisions\/[^/]+\/map$/.test(clean)) return 'Subdivision Map | Human Shelter';
  if (/\/dashboard$/.test(clean)) return 'Dashboard | Human Shelter';
  if (/\/properties\/(create|new)$/.test(clean)) return 'Create Listing | Human Shelter';
  if (/\/properties\/[^/]+\/edit$/.test(clean)) return 'Edit Listing | Human Shelter';
  if (/\/properties\/(location-map|map)$/.test(clean)) return 'Location Map | Human Shelter';
  if (/\/properties\/[^/]+$/.test(clean)) return 'Property Details | Human Shelter';
  if (/\/properties$/.test(clean)) return 'Properties | Human Shelter';
  if (/\/inquiries\/messages/.test(clean)) return 'Inquiry Messages | Human Shelter';
  if (/\/inquiries\/[^/]+$/.test(clean)) return 'Inquiry Details | Human Shelter';
  if (/\/inquiries$/.test(clean)) return 'Inquiries | Human Shelter';
  if (/\/agents\/[^/]+/.test(clean)) return 'Agent Details | Human Shelter';
  if (/\/agents$/.test(clean)) return 'Agents | Human Shelter';
  if (/\/sales$/.test(clean)) return 'Sales | Human Shelter';
  if (/\/audit$/.test(clean)) return 'Audit | Human Shelter';
  if (/\/notifications$/.test(clean)) return 'Notifications | Human Shelter';
  if (/\/profile$/.test(clean)) return 'Profile | Human Shelter';
  if (/\/saved-properties$/.test(clean)) return 'Saved Properties | Human Shelter';
  if (/\/subdivisions\/[^/]+\/inventory$/.test(clean)) return 'Subdivision Inventory | Human Shelter';
  if (/\/subdivisions\/[^/]+\/editor$/.test(clean)) return 'Subdivision Map Editor | Human Shelter';
  return 'Human Shelter';
}

function AppRoutes() {
  const location = useLocation();
  const [chatReady, setChatReady] = useState(false);

  useEffect(() => {
    document.title = getPageTitle(location.pathname);
  }, [location.pathname]);

  // Defer ChatWidget chunk download until the browser is idle so it doesn't compete with initial paint
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setChatReady(true), { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(() => setChatReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);
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
            <Route path="inquiries/messages" element={<InquiryMessagesPage role="agent" />} />
            <Route path="inquiries/messages/:id" element={<InquiryMessagesPage role="agent" />} />
            <Route path="inquiries/:id" element={<AgentInquiryDetail />} />
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
            <Route path="properties/select-type" element={<Navigate to="/broker/properties/create" replace />} />
            <Route path="properties/types" element={<Navigate to="/broker/properties/create" replace />} />
            <Route path="properties/create" element={<BrokerCreateListings />} />
            <Route path="properties/new" element={<BrokerCreateListings />} />
            <Route path="properties/:id/edit" element={<BrokerCreateListings />} />
            <Route path="properties/:id" element={<Navigate to="edit" replace />} />
            <Route path="inquiries" element={<BrokerInquiries />} />
            <Route path="inquiries/messages" element={<InquiryMessagesPage role="broker" />} />
            <Route path="inquiries/messages/:id" element={<InquiryMessagesPage role="broker" />} />
            <Route path="inquiries/:id" element={<BrokerInquiryDetail />} />
            <Route path="clients" element={<Navigate to="/broker/inquiries" replace />} />
            <Route path="agents" element={<BrokerAgents />} />
            <Route path="agents/invite" element={<Navigate to="/broker/agents" replace />} />
            <Route path="agents/:id" element={<BrokerAgentDetail />} />
            <Route path="agents/:id/edit" element={<BrokerAgentEdit />} />
            <Route path="sales" element={<BrokerSales />} />
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
            <Route path="inquiries/:id" element={<ClientInquiryDetail />} />
            <Route path="profile" element={<ClientProfile />} />
          </Route>

          {/* Super Admin Routes (Protected for Admin) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout role="admin" title="Admin Portal" />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/users" replace />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="cms" element={<AdminCmsPage />} />
            <Route path="data-management" element={<AdminDataManagementPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
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

  const publicRoutes = (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC]" />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/:id" element={<PropertyListingView />} />
        <Route path="/listing/:id" element={<PropertyListingView />} />
        <Route path="/subdivisions/:id/map" element={<PublicSubdivisionMap />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/guides" element={<GuidesPage />} />
        <Route path="/guides/:slug" element={<GuidesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/terms-of-service" element={<Navigate to="/terms" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/agent" element={<AgentRegisterPage />} />
        <Route path="/registration-form" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/under-development" element={<UnderDevelopmentPage />} />
        {import.meta.env.DEV && <Route path="/demo-api" element={<DemoApiPage />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );

  // Client Application Structure
  return (
    <div className="bg-[#FBFBF9] text-[#141717] min-h-screen">
      {!isAuthRoute && <Header />}
      <main>
        {/* Only load Google's GSI script on auth pages where Google Sign-In is rendered */}
        {isAuthRoute ? (
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{publicRoutes}</GoogleOAuthProvider>
        ) : (
          publicRoutes
        )}
      </main>
      {!isAuthRoute && chatReady && (
        <Suspense fallback={null}>
          <ChatWidget />
        </Suspense>
      )}
      {!hideFooter && <Footer />}
    </div>
  );
}

export default function App() {
  // Permanently enforce light theme across documentElement and remove dark class
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
    try {
      localStorage.removeItem('hs_theme');
      localStorage.setItem('hs_theme', 'light');
    } catch { }
  }, []);

  useEffect(() => {
    const onPreloadError = () => {
      reloadOnceForStaleChunk();
    };
    window.addEventListener('vite:preloadError', onPreloadError);
    return () => window.removeEventListener('vite:preloadError', onPreloadError);
  }, []);

  return (
    <ReactLenis root options={{ lerp: 0.08, smoothWheel: true }}>
      <Router>
        <ScrollToTop />
        <AuthProvider>
          <SessionWatcher />
          <RouteErrorBoundary>
            <AppRoutes />
          </RouteErrorBoundary>
        </AuthProvider>
        {import.meta.env.DEV && (
          <Suspense fallback={null}>
            <DevAgentation />
          </Suspense>
        )}
      </Router>
    </ReactLenis>
  );
}

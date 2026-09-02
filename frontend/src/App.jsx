import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ReactLenis, useLenis } from 'lenis/react';

// Client imports
import ClientLayout from './components/layouts/ClientLayout';
import Home from './pages/Home';
import PropertiesPage from './pages/PropertiesPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/auth/LoginPage';

// Agent imports
import { AgentProvider } from './context/AgentContext';
import AgentLayout from './components/agent/layout/AgentLayout';
import Dashboard from './pages/agent/Dashboard';
import MyProperties from './pages/agent/properties/MyProperties';
import AddProperty from './pages/agent/properties/AddProperty';
import PropertyDetails from './pages/agent/properties/PropertyDetails';
import InquiryManagement from './pages/agent/inquiries/InquiryManagement';
import Leads from './pages/agent/crm/Leads';
import LeadDetails from './pages/agent/crm/LeadDetails';
import Clients from './pages/agent/crm/Clients';
import FollowUps from './pages/agent/crm/FollowUps';
import Schedule from './pages/agent/crm/Schedule';
import CommunicationHistory from './pages/agent/crm/CommunicationHistory';
import SalesOverview from './pages/agent/sales/SalesOverview';
import Transactions from './pages/agent/sales/Transactions';
import SalesReports from './pages/agent/sales/SalesReports';
import SalesAnalytics from './pages/agent/sales/SalesAnalytics';
import AIAssistant from './pages/agent/ai/AIAssistant';
import Notifications from './pages/agent/notifications/Notifications';
import MyProfile from './pages/agent/profile/MyProfile';
import Security from './pages/agent/profile/Security';
import Terms from './pages/agent/profile/Terms';
import AgentNotFound from './pages/agent/NotFound';

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
        if (lenis) {
          // Delay slightly to let the new page render, then scroll smoothly and slowly (3.5 seconds)
          setTimeout(() => {
            const butteryEasing = (t) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
            lenis.scrollTo(hash, { offset: -100, duration: 3.5, easing: butteryEasing });
          }, 50);
        } else {
          const el = document.querySelector(hash);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        if (lenis) {
          lenis.scrollTo(0, { immediate: true });
        }
        window.scrollTo(0, 0);
      }
    });
  }, [pathname, hash, lenis]);

  return null;
}

export default function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    // Ensure the animation has time to play (at least 2.5s)
    // but also wait for window load if it takes longer.
    const startTime = Date.now();
    const minDelay = 2500;
    
    const handleLoad = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDelay - elapsed);
      setTimeout(() => {
        setIsAppLoading(false);
      }, remaining);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  return (
    <ReactLenis root options={{ lerp: 0.08, smoothWheel: true }}>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* CLIENT-SIDE ROUTES */}
          <Route
            element={
              <ClientLayout
                isDarkTheme={isDarkTheme}
                isAppLoading={isAppLoading}
              />
            }
          >
            <Route path="/" element={<Home setIsDarkTheme={setIsDarkTheme} />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* AGENT-SIDE ROUTES */}
          <Route
            path="/agent"
            element={
              <AgentProvider>
                <AgentLayout />
              </AgentProvider>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="properties" element={<MyProperties />} />
            <Route path="properties/add" element={<AddProperty />} />
            <Route path="properties/:id" element={<PropertyDetails />} />
            <Route path="properties/:id/edit" element={<AddProperty />} />

            <Route path="inquiries" element={<InquiryManagement />} />
            <Route path="inquiries/new" element={<InquiryManagement presetStatus="New" />} />
            <Route path="inquiries/follow-up" element={<InquiryManagement presetStatus="Follow-up" />} />
            <Route path="inquiries/closed" element={<InquiryManagement presetStatus="Closed" />} />

            <Route path="crm/leads" element={<Leads />} />
            <Route path="crm/leads/:id" element={<LeadDetails />} />
            <Route path="crm/clients" element={<Clients />} />
            <Route path="crm/follow-ups" element={<FollowUps />} />
            <Route path="crm/schedule" element={<Schedule />} />
            <Route path="crm/communication-history" element={<CommunicationHistory />} />

            <Route path="sales" element={<SalesOverview />} />
            <Route path="sales/overview" element={<SalesOverview />} />
            <Route path="sales/transactions" element={<Transactions />} />
            <Route path="sales/reports" element={<SalesReports />} />
            <Route path="sales/analytics" element={<SalesAnalytics />} />

            <Route path="ai-assistant" element={<AIAssistant />} />
            <Route path="notifications" element={<Notifications />} />

            <Route path="profile" element={<MyProfile />} />
            <Route path="profile/security" element={<Security />} />
            <Route path="profile/terms" element={<Terms />} />

            <Route path="*" element={<AgentNotFound />} />
          </Route>
        </Routes>
      </Router>
    </ReactLenis>
  );
}
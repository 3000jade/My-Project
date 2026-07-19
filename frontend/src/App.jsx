import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import ChatWidget from './components/features/ChatWidget';
import Footer from './components/layout/Footer';
import LandingPage from './pages/LandingPage';
import PropertiesPage from './pages/PropertiesPage';

export default function App() {
  return (
    <Router>
      <div className="">
        <Navbar />
        <main className="">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/properties" element={<PropertiesPage />} />
          </Routes>
        </main>
        <ChatWidget />
        <Footer />
      </div>
    </Router>
  );
}
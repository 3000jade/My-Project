import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Hero from './components/features/Hero';
import Listings from './components/features/Listings';
import Consultation from './components/features/Consultation';
import ChatWidget from './components/features/ChatWidget';
import Footer from './components/layout/Footer';
import PropertiesPage from './pages/PropertiesPage';

function HomePage() {
  return (
    <>
      <Hero />
      <Listings />
      <Consultation />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <div className="relative flex flex-col min-h-screen pt-[100px]">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/properties" element={<PropertiesPage />} />
          </Routes>
        </main>
        <ChatWidget />
        <Footer />
      </div>
    </Router>
  );
}
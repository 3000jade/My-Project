import Navbar from './components/layout/Navbar';
import Hero from './components/features/Hero';
import Listings from './components/features/Listings';
import Consultation from './components/features/Consultation';
import ChatWidget from './components/features/ChatWidget';
import Footer from './components/layout/Footer';

export default function App() {
  return (
    <div className="relative">
      <Navbar />
      <Hero />
      <Listings />
      <Consultation />
      <ChatWidget />
      <Footer />
    </div>
  );
}
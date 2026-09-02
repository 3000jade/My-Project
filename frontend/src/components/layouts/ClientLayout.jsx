import { Outlet } from 'react-router-dom';
import Header from '../Header';
import Footer from '../Footer';
import ChatWidget from '../../modules/Chat/ChatWidget';
import PropertyDetailModal from '../ui/PropertyDetailModal';
import PageLoader from '../ui/PageLoader';

export default function ClientLayout({ isDarkTheme, isAppLoading }) {
  return (
    <div className={`transition-colors duration-700 min-h-screen ${isDarkTheme ? 'bg-black' : 'bg-white'}`}>
      <Header isDarkTheme={isDarkTheme} />
      <main>
        <Outlet />
      </main>
      <ChatWidget />
      <Footer />
      <PropertyDetailModal />
      <PageLoader isLoading={isAppLoading} />
    </div>
  );
}

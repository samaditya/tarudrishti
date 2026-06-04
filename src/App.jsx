import { useState } from 'react';
import Layout from './components/Layout';
import PlantGallery from './components/PlantGallery';
import AIChatSheet from './components/AIChatSheet';
import LandingPage from './components/LandingPage';
import PlantProfile from './components/PlantProfile';
import ScheduleView from './components/ScheduleView';
import ResetPassword from './components/ResetPassword';
import { useAuth } from './context/AuthContext';

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('gallery');
  const { user, logout } = useAuth();
  const [selectedPlant, setSelectedPlant] = useState(null);

  // Check for reset_token in URL
  const queryParams = new URLSearchParams(window.location.search);
  // Strip out any trailing double quotes that might have been accidentally copied from the terminal
  const rawToken = queryParams.get('reset_token');
  const resetToken = rawToken ? rawToken.replace(/"/g, '') : null;

  if (resetToken && !user) {
    return (
      <ResetPassword 
        token={resetToken} 
        onResetSuccess={() => {
          // Clear the token from the URL without refreshing
          window.history.replaceState({}, document.title, "/");
          // Re-render will fall through to LandingPage
        }} 
      />
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  if (selectedPlant) {
    return <PlantProfile plant={selectedPlant} onBack={() => setSelectedPlant(null)} />;
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} onFabClick={() => setIsChatOpen(true)} user={user} onLogout={logout}>
      {activeTab === 'gallery' ? (
        <PlantGallery onSelectPlant={setSelectedPlant} />
      ) : (
        <ScheduleView onSelectPlant={setSelectedPlant} />
      )}
      <AIChatSheet isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </Layout>
  );
}

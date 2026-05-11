import { useState } from 'react';
import Layout from './components/Layout';
import PlantGallery from './components/PlantGallery';
import AIChatSheet from './components/AIChatSheet';
import LandingPage from './components/LandingPage';
import PlantProfile from './components/PlantProfile';
import ScheduleView from './components/ScheduleView';
import { useAuth } from './context/AuthContext';

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('gallery');
  const { user, logout } = useAuth();
  const [selectedPlant, setSelectedPlant] = useState(null);

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

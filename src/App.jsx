import { useState } from 'react';
import Layout from './components/Layout';
import PlantGallery from './components/PlantGallery';
import AIChatSheet from './components/AIChatSheet';
import LandingPage from './components/LandingPage';
import PlantProfile from './components/PlantProfile';
import ScheduleView from './components/ScheduleView';

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('gallery');
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('tarudrishti_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [selectedPlant, setSelectedPlant] = useState(null);

  const handleLogin = (userData) => {
    const data = userData || { name: 'Guest' };
    localStorage.setItem('tarudrishti_user', JSON.stringify(data));
    setUser(data);
  };

  const handleLogout = () => {
    localStorage.removeItem('tarudrishti_user');
    setUser(null);
  };

  if (!user) {
    return <LandingPage onLogin={handleLogin} />;
  }

  if (selectedPlant) {
    return <PlantProfile plant={selectedPlant} onBack={() => setSelectedPlant(null)} />;
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} onFabClick={() => setIsChatOpen(true)} user={user} onLogout={handleLogout}>
      {activeTab === 'gallery' ? (
        <PlantGallery onSelectPlant={setSelectedPlant} />
      ) : (
        <ScheduleView onSelectPlant={setSelectedPlant} />
      )}
      <AIChatSheet isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </Layout>
  );
}

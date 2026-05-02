import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Droplets, Leaf, ShieldAlert, CheckCircle2, WifiOff, Loader2, Trash2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/* ===========================================================================
   Care Metric Configuration
   =========================================================================== */
const careMetricConfig = {
  Water: { icon: Droplets, color: '#0A84FF', title: 'Water', intervalDays: 7 },
  Fertilize: { icon: Leaf, color: '#FF9F0A', title: 'Fertilizer', intervalDays: 21 },
  Pesticide: { icon: ShieldAlert, color: '#BF5AF2', title: 'Pesticide', intervalDays: 30 },
};

/* ===========================================================================
   Utility: Compute live care metrics from care_logs
   =========================================================================== */
function computeCareMetrics(careLogs = []) {
  const metrics = Object.entries(careMetricConfig).map(([actionType, config]) => {
    // Find the most recent log for this action type (case-insensitive)
    const relevantLogs = careLogs
      .filter((log) => log.action_type.toLowerCase() === actionType.toLowerCase())
      .sort((a, b) => new Date(b.action_date) - new Date(a.action_date));

    const lastLog = relevantLogs[0];
    let lastApplied = 'Never';
    let nextDue = 'Anytime';
    let isOverdue = false;

    if (lastLog) {
      const lastDate = new Date(lastLog.action_date);
      const now = new Date();
      const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) lastApplied = 'Today';
      else if (diffDays === 1) lastApplied = 'Yesterday';
      else lastApplied = `${diffDays} days ago`;

      const daysUntilDue = config.intervalDays - diffDays;
      if (daysUntilDue <= 0) {
        isOverdue = true;
        nextDue = daysUntilDue === 0 ? 'Today' : `${Math.abs(daysUntilDue)}d overdue`;
      } else if (daysUntilDue === 1) {
        nextDue = 'Tomorrow';
      } else {
        nextDue = `In ${daysUntilDue} days`;
      }
    }

    return {
      id: actionType.toLowerCase(),
      title: config.title,
      icon: config.icon,
      color: config.color,
      lastApplied,
      nextDue,
      isOverdue,
    };
  });

  return metrics;
}

/* ===========================================================================
   Health Status Config
   =========================================================================== */
const healthColors = {
  Healthy: '#34C759',
  Thriving: '#34C759',
  'Needs Water': '#FF9F0A',
  'Needs Attention': '#FF453A',
};

/* ===========================================================================
   Gallery Placeholder Images
   =========================================================================== */
const galleryImages = [
  'https://images.unsplash.com/photo-1614594975525-e45190c55d40?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1545241047-6083a36a0d24?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1646667687331-e06974a7fda0?auto=format&fit=crop&q=80&w=800',
];

/* ===========================================================================
   MAIN COMPONENT
   =========================================================================== */
export default function PlantProfile({ plant, onBack }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${plant?.name}?`)) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/api/plants/${plant.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete plant');
      onBack(); // Go back to gallery, which will re-fetch
    } catch (err) {
      console.error(err);
      alert('Could not delete plant.');
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!plant?.id) return;

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/api/plants/${plant.id}`);
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        const data = await res.json();
        setProfileData(data);
      } catch (err) {
        console.error('Failed to fetch plant profile:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [plant?.id]);

  const healthStatus = profileData?.health_status || plant?.health || 'Healthy';
  const healthColor = healthColors[healthStatus] || '#34C759';
  const plantName = profileData?.name || plant?.name || 'Unknown Plant';
  const careLogs = profileData?.care_logs || [];
  const careMetrics = computeCareMetrics(careLogs);

  // Build timeline from care_logs
  const timeline = [...careLogs]
    .sort((a, b) => new Date(b.action_date) - new Date(a.action_date))
    .slice(0, 10)
    .map((log) => ({
      id: log.id,
      action: log.action_type,
      date: new Date(log.action_date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }),
      note: log.substance_used || 'No details recorded.',
    }));

  return (
    <div
      className="min-h-dvh flex flex-col relative theme-transition w-full items-center"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div className="flex-1 w-full max-w-5xl px-6 sm:px-10 lg:px-16 pt-16 sm:pt-24 pb-32 flex flex-col gap-10 sm:gap-14">
        
        {/* 1. Top Navigation */}
        <nav className="w-full flex items-center justify-between shrink-0">
          <button
            onClick={onBack}
            className="w-11 h-11 rounded-full flex items-center justify-center -ml-2 cursor-pointer transition-colors"
            style={{ backgroundColor: 'var(--fill-tertiary)' }}
          >
            <ChevronLeft size={22} strokeWidth={2.5} style={{ color: 'var(--text-primary)' }} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:bg-red-500/10"
            style={{ color: '#FF453A' }}
            title="Delete Plant"
          >
            {isDeleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
          </button>
        </nav>

        {/* 2. Header (Centered) */}
        <header className="flex flex-col items-center justify-center text-center gap-6 shrink-0">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[36px] sm:text-[44px] lg:text-[48px] font-bold tracking-tight leading-none"
            style={{ color: 'var(--text-primary)' }}
          >
            {plantName}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-4 py-1.5 rounded-full flex items-center gap-2 mt-2"
            style={{
              backgroundColor: isDark ? `${healthColor}26` : `${healthColor}1A`,
              border: `1px solid ${isDark ? `${healthColor}33` : `${healthColor}4D`}`
            }}
          >
            <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: healthColor }} />
            <span className="text-[13px] font-bold uppercase tracking-widest" style={{ color: healthColor }}>
              {healthStatus}
            </span>
          </motion.div>
        </header>

        {/* 3. Segmented Control (Tabs) */}
        <div className="w-full flex justify-center pb-4 shrink-0">
          <div 
            className="flex p-1.5 rounded-[16px] w-full max-w-md"
            style={{ backgroundColor: 'var(--fill-tertiary)' }}
          >
            {['Dashboard', 'Gallery'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative flex-1 py-3 text-[15px] font-semibold tracking-tight rounded-xl cursor-pointer transition-colors z-10"
                style={{
                  color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-tertiary)'
                }}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="profileTabHighlight"
                    className="absolute inset-0 rounded-xl -z-10 shadow-sm"
                    style={{ backgroundColor: 'var(--bg-elevated)' }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <span className="text-[14px] font-medium" style={{ color: 'var(--text-secondary)' }}>Loading plant data...</span>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--fill-secondary)' }}>
              <WifiOff size={24} style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <h3 className="text-[17px] font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
              Unable to connect to greenhouse
            </h3>
            <p className="text-[14px] font-normal" style={{ color: 'var(--text-secondary)' }}>
              Please ensure the backend server is running.
            </p>
          </motion.div>
        )}

        {/* Tab Content Area */}
        {!isLoading && !error && (
          <div className="flex-1 relative">
            <AnimatePresence mode="wait">
              
              {/* 3. Dashboard View */}
              {activeTab === 'Dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-16 pb-24"
                >
                  {/* Care Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {careMetrics.map((metric) => {
                      const Icon = metric.icon;
                      return (
                        <div
                          key={metric.id}
                          className="rounded-2xl p-4 flex flex-col backdrop-blur-xl"
                          style={{
                            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                          }}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: `${metric.color}20`, color: metric.color }}
                            >
                              <Icon size={16} strokeWidth={2.5} />
                            </div>
                            <span className="text-[13px] font-bold text-gray-500 uppercase tracking-widest">
                              {metric.title}
                            </span>
                          </div>
                          
                          <div className="mt-auto flex flex-col gap-1">
                            <span className="text-[12px] font-medium text-gray-500">
                              Last: {metric.lastApplied}
                            </span>
                            <span 
                              className="text-[16px] font-bold tracking-tight"
                              style={{ color: metric.isOverdue ? '#FF453A' : 'var(--text-primary)' }}
                            >
                              Due: {metric.nextDue}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recent Activity Timeline */}
                  <div className="mt-6">
                    <h3 className="text-[20px] font-bold tracking-tight mb-8 text-center sm:text-left" style={{ color: 'var(--text-primary)' }}>
                      Recent Activity
                    </h3>
                    {timeline.length > 0 ? (
                      <div className="flex flex-col gap-8">
                        {timeline.map((log, i) => (
                          <div 
                            key={log.id} 
                            className="flex gap-5 relative pl-2 pb-4"
                          >
                            {/* Timeline Line */}
                            {i !== timeline.length - 1 && (
                              <div 
                                className="absolute left-[15px] top-[30px] bottom-[-32px] w-px"
                                style={{ backgroundColor: 'var(--separator)' }}
                              />
                            )}
                            <div 
                              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10"
                              style={{ backgroundColor: 'var(--fill-secondary)' }}
                            >
                              <CheckCircle2 size={14} style={{ color: 'var(--text-secondary)' }} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col pb-4">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>
                                  {log.action}
                                </span>
                                <span className="text-[13px] font-medium text-gray-500">
                                  {log.date}
                                </span>
                              </div>
                              <p className="text-[15px] font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
                                {log.note}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[14px] font-medium py-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
                        No activity logged yet. Use the Botanical AI to start tracking!
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* 4. Gallery View */}
              {activeTab === 'Gallery' && (
                <motion.div
                  key="gallery"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 pb-24"
                >
                  {[...(plant?.image_url ? [plant.image_url] : []), ...galleryImages].map((imgUrl, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1, duration: 0.4 }}
                      className="relative rounded-2xl overflow-hidden group aspect-square shadow-sm"
                      style={{ backgroundColor: 'var(--fill-secondary)' }}
                    >
                      <img 
                        src={imgUrl} 
                        alt="Plant Gallery" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1545241047-6083a36a0d24?auto=format&fit=crop&q=80&w=800';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.div>
                  ))}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
}

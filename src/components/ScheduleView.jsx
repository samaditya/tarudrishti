import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Leaf } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ScheduleView({ onSelectPlant }) {
  const [plants, setPlants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/plants`)
      .then(res => {
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        return res.json();
      })
      .then(data => setPlants(data))
      .catch(err => {
        console.error('Failed to fetch schedule:', err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const formatNextDate = (lastDateStr, intervalDays) => {
    if (!lastDateStr) return "ASAP";
    const lastDate = new Date(lastDateStr);
    const nextDate = new Date(lastDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    
    // reset to midnight
    nextDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    const diffDays = Math.round((nextDate - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `In ${diffDays} days`;
  };

  const getNextWatering = (plant) => {
    const logs = plant.care_logs?.filter(log => log.action_type.toLowerCase().includes('water')) || [];
    logs.sort((a, b) => new Date(b.action_date) - new Date(a.action_date));
    const last = logs.length > 0 ? logs[0].action_date : null;
    return formatNextDate(last, 7); // Assume water every 7 days
  };
  
  const getNextFertilization = (plant) => {
    const logs = plant.care_logs?.filter(log => log.action_type.toLowerCase().includes('fertilize') || log.substance_used) || [];
    logs.sort((a, b) => new Date(b.action_date) - new Date(a.action_date));
    const last = logs.length > 0 ? logs[0] : null;
    const nextDate = formatNextDate(last?.action_date, 30);
    const label = last?.substance_used ? last.substance_used : 'Fertilize';
    return { label, date: nextDate };
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center opacity-50 flex justify-center items-center flex-col gap-3">
         <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
         <p>Loading schedule...</p>
      </div>
    );
  }

  return (
    <section className="w-full flex flex-col pb-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 sm:mb-10 flex flex-col items-center justify-center gap-2 text-center"
      >
        <h2
          className="text-[28px] sm:text-[32px] font-bold tracking-tight leading-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Care Schedule
        </h2>
        <p
          className="text-[13px] sm:text-[14px] font-normal mt-0.5 tracking-tight"
          style={{ color: 'var(--text-secondary)' }}
        >
          Upcoming tasks for your {plants.length} plant{plants.length !== 1 ? 's' : ''}
        </p>
      </motion.div>

      <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
        {plants.length === 0 ? (
           <div className="text-center py-10 opacity-50">No plants to schedule.</div>
        ) : (
          plants.map((plant, index) => (
            <motion.div
              key={plant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-2xl p-4 sm:p-5 flex items-center justify-between cursor-pointer overflow-hidden"
              style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
              onClick={() => onSelectPlant(plant)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex-shrink-0 overflow-hidden" style={{ backgroundColor: 'var(--fill-secondary)' }}>
                  {plant.image_url ? (
                    <img src={plant.image_url} alt={plant.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[var(--accent)] to-emerald-900 opacity-60" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-[15px] sm:text-[16px]" style={{ color: 'var(--text-primary)' }}>{plant.name}</h3>
                  <p className="text-[12px] sm:text-[13px]" style={{ color: 'var(--text-secondary)' }}>{plant.species}</p>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-medium text-blue-500 bg-blue-500/10 px-2 py-1 rounded-lg">
                  <Droplets size={12} />
                  {getNextWatering(plant)}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg max-w-[140px]">
                  <Leaf size={12} className="flex-shrink-0" />
                  <span className="truncate">
                    {getNextFertilization(plant).label}: {getNextFertilization(plant).date}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
}

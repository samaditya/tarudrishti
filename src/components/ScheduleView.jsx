import { motion } from 'framer-motion';
import { Droplets, Leaf, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../utils/api';
import toast from 'react-hot-toast';

export default function ScheduleView({ onSelectPlant }) {
  const queryClient = useQueryClient();
  const { data: plants = [], isLoading } = useQuery({
    queryKey: ['plants'],
    queryFn: async () => {
      const res = await apiFetch('/api/plants');
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      return res.json();
    }
  });

  const careMutation = useMutation({
    mutationFn: async ({ plantId, actionType, substance }) => {
      const res = await apiFetch('/api/care-logs', {
        method: 'POST',
        body: JSON.stringify({
          plant_id: plantId,
          action_type: actionType,
          substance_used: substance || null,
          action_date: new Date().toISOString()
        })
      });
      if (!res.ok) throw new Error('Failed to log care');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plants'] });
      toast.success(`${variables.actionType} logged for plant!`);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    },
    onError: () => {
      toast.error('Failed to log care activity');
      if (window.navigator.vibrate) window.navigator.vibrate([50, 50, 50]);
    }
  });

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
    return { 
      date: formatNextDate(last, 7), 
      isOverdue: last ? (new Date() - new Date(last)) / (1000*60*60*24) >= 7 : true 
    };
  };
  
  const getNextFertilization = (plant) => {
    const logs = plant.care_logs?.filter(log => log.action_type.toLowerCase().includes('fertilize') || log.substance_used) || [];
    logs.sort((a, b) => new Date(b.action_date) - new Date(a.action_date));
    const last = logs.length > 0 ? logs[0] : null;
    const nextDate = formatNextDate(last?.action_date, 30);
    const label = last?.substance_used ? last.substance_used : 'Fertilize';
    return { 
      label, 
      date: nextDate, 
      isOverdue: last ? (new Date() - new Date(last.action_date)) / (1000*60*60*24) >= 30 : true 
    };
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
    <section className="w-full flex flex-col pb-10 px-4">
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
          plants.map((plant, index) => {
            const watering = getNextWatering(plant);
            const fert = getNextFertilization(plant);
            
            return (
              <motion.div
                key={plant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="w-full rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
              >
                <div className="flex items-center gap-4 w-full cursor-pointer" onClick={() => onSelectPlant(plant)}>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex-shrink-0 overflow-hidden" style={{ backgroundColor: 'var(--fill-secondary)' }}>
                    {plant.image_url ? (
                      <img src={plant.image_url} alt={plant.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[var(--accent)] to-emerald-900 opacity-60" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[15px] sm:text-[16px]" style={{ color: 'var(--text-primary)' }}>{plant.name}</h3>
                    <p className="text-[12px] sm:text-[13px]" style={{ color: 'var(--text-secondary)' }}>{plant.species}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  {/* Watering Action */}
                  <div className="flex flex-col items-end gap-1">
                    <div className={`flex items-center gap-1.5 text-[11px] sm:text-[12px] font-medium px-2 py-1 rounded-lg ${watering.isOverdue ? 'text-orange-500 bg-orange-500/10' : 'text-blue-500 bg-blue-500/10'}`}>
                      <Droplets size={12} />
                      {watering.date}
                    </div>
                    <button 
                      onClick={() => careMutation.mutate({ plantId: plant.id, actionType: 'Watering' })}
                      className="p-1.5 rounded-full hover:bg-blue-500/10 text-blue-500 transition-colors"
                      title="Mark as Watered"
                    >
                      <Check size={16} strokeWidth={3} />
                    </button>
                  </div>

                  <div className="w-[1px] h-8 bg-gray-500/10" />

                  {/* Fertilizing Action */}
                  <div className="flex flex-col items-end gap-1">
                    <div className={`flex items-center gap-1.5 text-[11px] sm:text-[12px] font-medium px-2 py-1 rounded-lg ${fert.isOverdue ? 'text-orange-500 bg-orange-500/10' : 'text-emerald-500 bg-emerald-500/10'} max-w-[140px]`}>
                      <Leaf size={12} className="flex-shrink-0" />
                      <span className="truncate">{fert.date}</span>
                    </div>
                    <button 
                      onClick={() => careMutation.mutate({ plantId: plant.id, actionType: 'Fertilizing', substance: fert.label })}
                      className="p-1.5 rounded-full hover:bg-emerald-500/10 text-emerald-500 transition-colors"
                      title="Mark as Fertilized"
                    >
                      <Check size={16} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </section>
  );
}

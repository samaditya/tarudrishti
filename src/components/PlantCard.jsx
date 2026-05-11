import { motion } from 'framer-motion';
import { Droplets } from 'lucide-react';
import { springConfig } from '../utils/animations';

const healthConfig = {
  Thriving: { color: '#34C759', label: 'Thriving' },
  Healthy: { color: '#30D158', label: 'Healthy' },
  'Needs Water': { color: '#FF9F0A', label: 'Needs Water' },
  'Needs Attention': { color: '#FF453A', label: 'Attention' },
};

export default function PlantCard({ plant, index, onClick }) {
  const { name, species, health_status, image_url, care_logs } = plant;
  
  const waterLogs = care_logs?.filter(log => log.action_type.toLowerCase().includes('water')) || [];
  waterLogs.sort((a, b) => new Date(b.action_date) - new Date(a.action_date));
  const last_watered = waterLogs.length > 0 ? waterLogs[0].action_date : null;

  const substanceLogs = care_logs?.filter(log => log.substance_used) || [];
  substanceLogs.sort((a, b) => new Date(b.action_date) - new Date(a.action_date));
  const last_substance_log = substanceLogs.length > 0 ? substanceLogs[0] : null;

  const health = health_status || 'Healthy';
  const status = healthConfig[health] || healthConfig.Healthy;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not yet';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Not yet';
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Future';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        ...springConfig,
        delay: index * 0.05,
      }}
      whileHover={{ 
        scale: 0.98,
        boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
      }}
      whileTap={{ scale: 0.95 }}
      className="relative overflow-hidden rounded-[20px] cursor-pointer group"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--separator)',
      }}
      id={`plant-card-${plant.id}`}
    >
      {/* Edge-to-Edge Image Container with nested overflow */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-[19px]" style={{ backgroundColor: 'var(--fill-secondary)' }}>
        {image_url ? (
          <motion.img
            src={image_url}
            alt={name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={springConfig}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-transparent" />
        )}

        {/* Bottom Gradient for Text Legibility — refined for depth */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)',
          }}
        />

        {/* Health Indicator — Glassmorphic Pill with Border */}
        <div
          className="absolute top-3 right-3 flex items-center gap-2 px-2.5 py-1 rounded-full border border-white/10"
          style={{
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <span
            className="w-[7px] h-[7px] rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]"
            style={{ backgroundColor: status.color }}
          />
          <span className="text-[10px] font-bold text-white tracking-wide uppercase">
            {status.label}
          </span>
        </div>

        {/* Bottom Text — Improved Optical Alignment (Nested Radius Consideration) */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <h3 className="text-white text-[17px] font-bold tracking-tight leading-tight">
            {name}
          </h3>
          <p className="text-white/60 text-[13px] font-medium mt-0.5 tracking-tight">
            {species}
          </p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Droplets size={12} className="text-white/40" />
              <span className="text-white/40 text-[11px] font-semibold tracking-tight">
                {formatDate(last_watered)}
              </span>
            </div>
            {last_substance_log && (
              <div className="flex items-center gap-1.5">
                <div className="w-[3px] h-[3px] rounded-full bg-white/20 mx-0.5" />
                <span className="text-white/40 text-[11px] font-semibold tracking-tight truncate max-w-[100px]">
                  {last_substance_log.substance_used}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

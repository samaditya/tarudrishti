import { motion } from 'framer-motion';
import { Droplets } from 'lucide-react';

const healthConfig = {
  Thriving: { color: '#34C759', label: 'Thriving' },
  Healthy: { color: '#30D158', label: 'Healthy' },
  'Needs Water': { color: '#FF9F0A', label: 'Needs Water' },
  'Needs Attention': { color: '#FF453A', label: 'Attention' },
};

export default function PlantCard({ plant, index, onClick }) {
  const { name, species, last_watered, health, image_url } = plant;
  const status = healthConfig[health] || healthConfig.Healthy;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileTap={{ scale: 0.97 }}
      className="relative overflow-hidden rounded-2xl cursor-pointer"
      style={{
        backgroundColor: 'var(--bg-surface)',
        boxShadow: 'var(--shadow-card)',
      }}
      id={`plant-card-${plant.id}`}
    >
      {/* Edge-to-Edge Image */}
      <div className="relative aspect-[4/5] overflow-hidden" style={{ backgroundColor: 'var(--fill-secondary)' }}>
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-transparent" />
        )}

        {/* Bottom Gradient for Text Legibility */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 40%, transparent 65%)',
          }}
        />

        {/* Health Indicator — Small Pill */}
        <div
          className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-[3px] rounded-full"
          style={{
            backgroundColor: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <span
            className="w-[6px] h-[6px] rounded-full"
            style={{ backgroundColor: status.color }}
          />
          <span className="text-[10px] font-medium text-white/90 tracking-tight">
            {status.label}
          </span>
        </div>

        {/* Bottom Text */}
        <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-3">
          <h3 className="text-white text-[15px] font-semibold tracking-[-0.01em] leading-tight">
            {name}
          </h3>
          <p className="text-white/55 text-[12px] font-normal mt-0.5 tracking-tight">
            {species}
          </p>
          <div className="flex items-center gap-1 mt-1.5">
            <Droplets size={11} className="text-white/40" />
            <span className="text-white/40 text-[10px] font-medium tracking-tight">
              {formatDate(last_watered)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import { motion } from 'framer-motion';
import { Leaf, CalendarDays, Sparkles } from 'lucide-react';
import { springConfig } from '../utils/animations';

export default function BottomNav({ activeTab, onTabChange, onFabClick }) {

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom flex justify-center"
      id="bottom-nav"
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={springConfig}
        className="mx-4 mb-6 rounded-[28px] flex items-center justify-between px-3 w-full max-w-lg border border-white/10"
        style={{
          height: 72,
          backgroundColor: 'var(--glass-bg-heavy)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
        }}
      >
        {/* Left — Gallery */}
        <NavTab
          id="gallery"
          label="Gallery"
          Icon={Leaf}
          isActive={activeTab === 'gallery'}
          onClick={() => onTabChange('gallery')}
        />

        {/* Center — FAB — Enhanced Physics */}
        <div className="relative flex items-center justify-center" style={{ width: 80 }}>
          <motion.button
            onClick={onFabClick}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            transition={springConfig}
            className="absolute -top-8 w-[60px] h-[60px] rounded-full flex items-center justify-center cursor-pointer border-2 border-white/20"
            style={{
              backgroundColor: 'var(--accent)',
              boxShadow: '0 8px 24px var(--accent-dimmed)',
            }}
            aria-label="Open AI Command Center"
            id="fab-ai-center"
          >
            <Sparkles size={26} color="white" strokeWidth={2.2} />
          </motion.button>
          <span
            className="text-[10px] font-bold tracking-widest uppercase mt-8 opacity-50"
            style={{ color: 'var(--text-primary)' }}
          >
            AI
          </span>
        </div>

        {/* Right — Schedule */}
        <NavTab
          id="schedule"
          label="Schedule"
          Icon={CalendarDays}
          isActive={activeTab === 'schedule'}
          onClick={() => onTabChange('schedule')}
        />
      </motion.div>
    </nav>
  );
}

function NavTab({ id, label, Icon, isActive, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      transition={springConfig}
      className="flex flex-col items-center justify-center gap-1 py-1 rounded-2xl cursor-pointer relative flex-1 h-full"
      id={`nav-${id}`}
    >
      <Icon
        size={24}
        strokeWidth={isActive ? 2.5 : 1.8}
        style={{ color: isActive ? 'var(--accent)' : 'var(--text-tertiary)' }}
      />
      <span
        className="text-[11px] font-bold tracking-tight"
        style={{ color: isActive ? 'var(--accent)' : 'var(--text-tertiary)' }}
      >
        {label}
      </span>
      {isActive && (
        <motion.div
          layoutId="navDot"
          className="absolute -bottom-1 w-1 h-1 rounded-full bg-[var(--accent)]"
          transition={springConfig}
        />
      )}
    </motion.button>
  );
}

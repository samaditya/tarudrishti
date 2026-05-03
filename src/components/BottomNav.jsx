import { motion } from 'framer-motion';
import { Leaf, CalendarDays, Sparkles } from 'lucide-react';
import { useState } from 'react';

export default function BottomNav({ activeTab, onTabChange, onFabClick }) {

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom flex justify-center"
      id="bottom-nav"
    >
      <div
        className="mx-4 mb-4 rounded-[22px] flex items-center justify-between px-2 w-full max-w-lg"
        style={{
          height: 64,
          backgroundColor: 'var(--glass-bg-heavy)',
          backdropFilter: 'blur(40px) saturate(190%)',
          WebkitBackdropFilter: 'blur(40px) saturate(190%)',
          border: '0.5px solid var(--separator)',
          boxShadow: 'var(--shadow-elevated)',
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

        {/* Center — FAB */}
        <div className="relative flex items-center justify-center" style={{ width: 68 }}>
          <motion.button
            onClick={onFabClick}
            whileTap={{ scale: 0.86 }}
            className="absolute -top-7 w-[52px] h-[52px] rounded-full flex items-center justify-center cursor-pointer"
            style={{
              backgroundColor: 'var(--accent)',
              boxShadow: 'var(--shadow-fab)',
            }}
            aria-label="Open AI Command Center"
            id="fab-ai-center"
          >
            <Sparkles size={22} color="white" strokeWidth={2.2} />
          </motion.button>
          <span
            className="text-[9px] font-semibold tracking-wide uppercase mt-5"
            style={{ color: 'var(--text-tertiary)' }}
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
      </div>
    </nav>
  );
}

function NavTab({ id, label, Icon, isActive, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.86 }}
      className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-2xl cursor-pointer relative"
      style={{ minWidth: 72 }}
      id={`nav-${id}`}
    >
      <Icon
        size={22}
        strokeWidth={isActive ? 2.2 : 1.6}
        style={{ color: isActive ? 'var(--accent)' : 'var(--text-tertiary)' }}
      />
      <span
        className="text-[10px] font-medium"
        style={{ color: isActive ? 'var(--accent)' : 'var(--text-tertiary)' }}
      >
        {label}
      </span>
    </motion.button>
  );
}

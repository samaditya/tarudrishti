import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, LogOut } from 'lucide-react';
import BottomNav from './BottomNav';
import Logo from './Logo';

export default function Layout({ children, onFabClick, user, onLogout }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className="min-h-dvh flex flex-col relative w-full items-center"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* ===== Apple-Style Translucent Header ===== */}
      <header
        className="safe-top sticky top-0 z-40 w-full flex justify-center"
        style={{
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderBottom: '0.5px solid var(--separator)',
        }}
      >
        <div className="max-w-5xl w-full flex items-center justify-between px-6 md:px-10 lg:px-16 h-16 relative">
          {/* Left Spacer */}
          <div className="flex-1"></div>

          {/* Center Brand — Hero Element */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 cursor-pointer group z-10"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Logo size={32} />
            <h1
              className="text-[22px] md:text-[24px] font-extrabold tracking-tight transition-opacity group-hover:opacity-80"
              style={{ color: 'var(--text-primary)' }}
            >
              Tarudrishti
            </h1>
          </motion.div>

          <div className="flex items-center justify-end gap-3 md:gap-4 flex-1">
            {/* User Profile & Signout */}
            {user && (
              <div className="flex items-center gap-2 md:gap-3">
                <div 
                  className="flex items-center gap-2 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--separator)' }}
                >
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: 'var(--accent)' }}>
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="text-[12px] md:text-[13px] font-medium hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 md:p-2 rounded-full cursor-pointer hover:bg-[var(--fill-tertiary)] transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}

            {/* Theme Toggle — Minimal Circle */}
            <motion.button
              onClick={toggleTheme}
              whileTap={{ scale: 0.82 }}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              style={{ backgroundColor: 'var(--fill-tertiary)' }}
              aria-label="Toggle theme"
              id="theme-toggle"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={theme}
                  initial={{ rotate: -60, opacity: 0, scale: 0.4 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 60, opacity: 0, scale: 0.4 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  {theme === 'dark' ? (
                    <Sun size={15} strokeWidth={2} style={{ color: '#FFD60A' }} />
                  ) : (
                    <Moon size={15} strokeWidth={2} style={{ color: 'var(--text-secondary)' }} />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </header>

      {/* ===== Main Content — Centered Master Container ===== */}
      <main className="flex-1 w-full flex justify-center overflow-y-auto pb-28 pt-8">
        <div className="max-w-5xl w-full px-6 md:px-10 lg:px-16">
          {children}
        </div>
      </main>

      {/* ===== Bottom Navigation ===== */}
      <BottomNav onFabClick={onFabClick} />
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Wifi, Loader2 } from 'lucide-react';
import Logo from './Logo';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function BackendHealthGate({ children }) {
  const [isHealthy, setIsHealthy] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  // Elapsed time counter
  useEffect(() => {
    if (!isHealthy) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isHealthy]);

  // Health check logic with retry
  useEffect(() => {
    let cancelled = false;

    const checkHealth = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(`${API_BASE}/api/health`, { signal: controller.signal });
        clearTimeout(timeout);
        if (!cancelled && res.ok) {
          setIsHealthy(true);
          setIsChecking(false);
          clearInterval(timerRef.current);
        } else {
          throw new Error('Not OK');
        }
      } catch {
        if (!cancelled) {
          setIsChecking(false);
          // Exponential backoff: 3s, 4s, 5s, ... max 10s
          const delay = Math.min(3000 + retryCount * 1000, 10000);
          retryTimeoutRef.current = setTimeout(() => {
            if (!cancelled) {
              setRetryCount((prev) => prev + 1);
              setIsChecking(true);
            }
          }, delay);
        }
      }
    };

    if (isChecking) {
      checkHealth();
    }

    return () => {
      cancelled = true;
      clearTimeout(retryTimeoutRef.current);
    };
  }, [isChecking, retryCount]);

  // Format elapsed time
  const formatTime = (s) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  // If healthy, render children with a fade transition
  if (isHealthy) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    );
  }

  // Waiting/Splash Screen
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center relative overflow-hidden px-6"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Animated Background Gradient Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full"
          style={{
            background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
            opacity: 0.06,
            filter: 'blur(80px)',
          }}
        />
        <motion.div
          animate={{
            x: [0, -25, 15, 0],
            y: [0, 30, -25, 0],
            scale: [1, 0.8, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full"
          style={{
            background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
            opacity: 0.04,
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center text-center z-10 max-w-sm"
      >
        {/* Logo */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-8"
        >
          <Logo size={56} />
        </motion.div>

        {/* Brand */}
        <h1
          className="text-[32px] font-bold tracking-tight mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Tarudrishti
        </h1>
        <p
          className="text-[14px] font-medium mb-10"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Your Personal Botanical AI
        </p>

        {/* Server Status Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full p-6 rounded-[24px] backdrop-blur-xl flex flex-col items-center gap-5"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--separator)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          }}
        >
          {/* Server Icon with Pulse */}
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: 'var(--accent)' }}
            />
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center relative z-10"
              style={{ backgroundColor: 'var(--fill-secondary)' }}
            >
              <Server size={24} style={{ color: 'var(--accent)' }} />
            </div>
          </div>

          {/* Status Text */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <Loader2
                size={14}
                className="animate-spin"
                style={{ color: 'var(--accent)' }}
              />
              <span
                className="text-[15px] font-bold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Waking up secure server
              </span>
            </div>
            <p
              className="text-[13px] font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Free-tier servers sleep after inactivity
            </p>
          </div>

          {/* Progress Dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                }}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: 'var(--accent)' }}
              />
            ))}
          </div>

          {/* Elapsed Time & Retry Count */}
          <div
            className="flex items-center justify-center gap-4 w-full pt-4 border-t"
            style={{ borderColor: 'var(--separator)' }}
          >
            <div className="flex items-center gap-1.5">
              <Wifi size={12} style={{ color: 'var(--text-tertiary)' }} />
              <span
                className="text-[12px] font-semibold tabular-nums"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {formatTime(elapsedSeconds)} elapsed
              </span>
            </div>
            <div
              className="w-px h-3"
              style={{ backgroundColor: 'var(--separator)' }}
            />
            <span
              className="text-[12px] font-semibold tabular-nums"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Attempt {retryCount + 1}
            </span>
          </div>
        </motion.div>

        {/* Bottom Hint */}
        <p
          className="text-[12px] font-medium mt-6"
          style={{ color: 'var(--text-tertiary)' }}
        >
          This usually takes 15–30 seconds on the first visit
        </p>
      </motion.div>
    </div>
  );
}

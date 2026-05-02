import { motion } from 'framer-motion';

export default function Logo({ className = '', size = 26 }) {
  return (
    <motion.div
      whileHover={{ scale: 1.08, rotate: -8 }}
      whileTap={{ scale: 0.92 }}
      className={`relative flex items-center justify-center rounded-lg cursor-pointer ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, var(--accent) 0%, #10B981 100%)',
        boxShadow: '0 4px 12px var(--accent-dimmed)',
      }}
    >
      <svg
        width={size * 0.55}
        height={size * 0.55}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" fill="currentColor" fillOpacity="0.2" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    </motion.div>
  );
}

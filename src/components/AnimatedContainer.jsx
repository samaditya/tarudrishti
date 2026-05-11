import { motion } from 'framer-motion';
import { springConfig } from '../utils/animations';

/**
 * A reusable wrapper for components that need premium spring physics,
 * layout animations, and subtle interaction states.
 * 
 * @param {Object} props
 * @param {boolean} props.layout - Whether to enable Framer Motion layout animations
 * @param {boolean} props.hover - Whether to enable scale-down hover effect
 * @param {boolean} props.tap - Whether to enable scale-down tap effect
 * @param {string} props.className - Additional Tailwind classes
 */
export default function AnimatedContainer({ 
  children, 
  layout = false, 
  hover = false, 
  tap = false,
  className = "",
  initial = { opacity: 0, y: 15 },
  animate = { opacity: 1, y: 0 },
  exit = { opacity: 0, y: 15 },
  delay = 0,
  onClick
}) {
  return (
    <motion.div
      layout={layout}
      initial={initial}
      animate={animate}
      exit={exit}
      whileHover={hover ? { scale: 0.985, transition: { ...springConfig, stiffness: 500 } } : undefined}
      whileTap={tap ? { scale: 0.96 } : undefined}
      transition={{
        ...springConfig,
        delay: delay,
      }}
      onClick={onClick}
      className={`relative ${className}`}
    >
      {children}
    </motion.div>
  );
}

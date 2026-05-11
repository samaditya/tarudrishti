/**
 * Centralized Framer Motion physics constants for a consistent, premium feel.
 * Optimized for "Apple-tier" spring dynamics.
 */

export const springConfig = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 1,
};

export const softSpringConfig = {
  type: "spring",
  stiffness: 300,
  damping: 35,
};

export const transitionConfig = {
  duration: 0.4,
  ease: [0.22, 1, 0.36, 1], // Apple-style cubic-bezier
};

export const hoverStates = {
  scale: 0.98,
  transition: { type: "spring", stiffness: 400, damping: 25 },
};

export const tapStates = {
  scale: 0.95,
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
  transition: springConfig,
};

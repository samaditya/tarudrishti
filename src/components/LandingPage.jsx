import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { GoogleLogin } from '@react-oauth/google';
import Logo from './Logo';
import { jwtDecode } from 'jwt-decode';

/* ===========================================================================
   Premium Botanical Accents (Minimalist Animated Plants)
   Clean, translucent, swaying SVGs that sit quietly in the background.
   =========================================================================== */

function MonsteraLeaf() {
  return (
    <svg width="300" height="400" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M150 400 Q150 250 180 100 Q200 50 150 30 Q100 50 120 100 Q150 250 150 400Z"
        fill="var(--accent)"
        fillOpacity="0.15"
      />
      <path
        d="M180 100 Q250 100 280 150 Q240 200 160 180"
        fill="var(--accent)"
        fillOpacity="0.15"
      />
      <path
        d="M120 100 Q50 100 20 150 Q60 200 140 180"
        fill="var(--accent)"
        fillOpacity="0.15"
      />
      <path
        d="M170 180 Q250 200 260 280 Q200 280 150 250"
        fill="var(--accent)"
        fillOpacity="0.15"
      />
      <path
        d="M130 180 Q50 200 40 280 Q100 280 150 250"
        fill="var(--accent)"
        fillOpacity="0.15"
      />
      {/* Midrib */}
      <path d="M150 400 Q150 250 150 40" stroke="var(--accent)" strokeWidth="1" strokeOpacity="0.2" fill="none" />
    </svg>
  );
}

function SnakePlant() {
  return (
    <svg width="150" height="400" viewBox="0 0 150 400" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Tallest blade */}
      <path
        d="M75 400 Q70 200 85 20 Q95 200 75 400Z"
        fill="var(--accent)"
        fillOpacity="0.15"
      />
      {/* Left blade */}
      <path
        d="M70 400 Q40 250 30 80 Q60 250 70 400Z"
        fill="var(--accent)"
        fillOpacity="0.15"
      />
      {/* Right blade */}
      <path
        d="M80 400 Q110 250 120 80 Q90 250 80 400Z"
        fill="var(--accent)"
        fillOpacity="0.15"
      />
    </svg>
  );
}

function SwayingPlant({ children, delay = 0, duration = 8, className = '' }) {
  return (
    <motion.div
      animate={{ rotate: [-2, 2, -2] }}
      transition={{
        duration,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatType: 'loop',
        delay,
      }}
      style={{ transformOrigin: 'bottom center' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ===========================================================================
   Social Auth Icons
   =========================================================================== */

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

import { useAuth } from '../context/AuthContext';

/* ===========================================================================
   MAIN LANDING PAGE COMPONENT
   =========================================================================== */
export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      // Exchange Google email for a backend JWT token
      const authRes = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: decoded.email })
      });

      if (!authRes.ok) throw new Error('Failed to create session with backend');
      const authData = await authRes.json();

      login({ email: decoded.email, name: decoded.name, token: authData.access_token });
    } catch (err) {
      setAuthError('Google sign in failed.');
      console.error('Google Credential Error:', err);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);

    const email = e.target['auth-email'].value;
    const password = e.target['auth-password'].value;
    
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    try {
      if (!isLogin) {
        // Actual Signup
        const res = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Signup failed');
        login({ email, token: data.access_token });
      } else {
        // Actual Login using OAuth2 form data
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Invalid email or password');
        login({ email, token: data.access_token });
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-dvh flex flex-col relative overflow-hidden theme-transition"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Background Animated Plants */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center">
        <div className="relative w-full max-w-6xl h-full">
          <SwayingPlant
            delay={0}
            duration={12}
            className="absolute -bottom-8 left-[-5%] sm:left-[5%] md:left-[10%] lg:left-[5%]"
          >
            <MonsteraLeaf />
          </SwayingPlant>

          <SwayingPlant
            delay={2}
            duration={14}
            className="absolute -bottom-8 right-[-5%] sm:right-[5%] md:right-[10%] lg:right-[15%]"
          >
            <SnakePlant />
          </SwayingPlant>
        </div>
      </div>

      {/* Header */}
      <header
        className="safe-top sticky top-0 z-50 theme-transition"
        style={{ backgroundColor: 'transparent' }}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-6 md:px-12 lg:px-16 h-20 relative">
          {/* Left Spacer */}
          <div className="flex-1"></div>

          {/* Center Brand — Hero Element */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3.5 cursor-pointer group z-10"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Logo size={38} />
            <span
              className="text-[26px] md:text-[28px] font-extrabold tracking-tight transition-opacity group-hover:opacity-80"
              style={{ color: 'var(--text-primary)' }}
            >
              Tarudrishti
            </span>
          </motion.div>

          <div className="flex items-center justify-end flex-1">
            <motion.button
              onClick={toggleTheme}
              whileTap={{ scale: 0.82 }}
              className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 theme-transition"
              style={{ backgroundColor: 'var(--fill-tertiary)' }}
              aria-label="Toggle theme"
              id="theme-toggle-btn"
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
                    <Sun size={16} strokeWidth={2.5} style={{ color: '#FFD60A' }} />
                  ) : (
                    <Moon size={16} strokeWidth={2.5} style={{ color: 'var(--text-secondary)' }} />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Viewport Container */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-10 lg:py-16 relative z-10 flex flex-col lg:flex-row lg:justify-center lg:items-center gap-12 lg:gap-24">

        {/* Left Side: Heading & Subheading */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center lg:text-left w-full max-w-[540px] flex flex-col items-center lg:items-start"
        >
          <h1
            className="text-[40px] sm:text-[52px] md:text-[64px] lg:text-[76px] font-bold leading-[1.05] mb-4 sm:mb-6"
            style={{ letterSpacing: '-0.025em', color: 'var(--text-primary)' }}
          >
            Your Personal<br />Botanical AI.
          </h1>
          <p
            className="text-[15px] sm:text-[18px] lg:text-[20px] font-normal leading-relaxed max-w-[320px] sm:max-w-[420px]"
            style={{ color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}
          >
            Diagnose, track, and nurture your greenhouse with unprecedented intelligence.
          </p>
        </motion.div>

        {/* Right Side: Form Card & Footer */}
        <div className="w-full max-w-[480px] flex flex-col items-center lg:items-start">
          {/* Elevated Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[440px] rounded-[24px] sm:rounded-[32px] p-6 sm:p-10 relative overflow-hidden theme-transition flex flex-col gap-10 sm:gap-12"
            style={{
              backgroundColor: 'transparent',
            }}
          >
            {/* Enhanced Tab Alignment */}
            <div className="flex w-full relative" style={{ borderBottom: '1px solid var(--separator)' }}>
              <button
                onClick={() => setIsLogin(true)}
                className="flex-1 pb-3 sm:pb-4 text-[18px] sm:text-[20px] font-bold transition-colors duration-200 cursor-pointer relative"
                style={{ color: isLogin ? 'var(--accent)' : 'var(--text-tertiary)' }}
              >
                Log In
                {isLogin && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full"
                    style={{ backgroundColor: 'var(--accent)' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className="flex-1 pb-3 sm:pb-4 text-[18px] sm:text-[20px] font-bold transition-colors duration-200 cursor-pointer relative"
                style={{ color: !isLogin ? 'var(--accent)' : 'var(--text-tertiary)' }}
              >
                Create Account
                {!isLogin && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full"
                    style={{ backgroundColor: 'var(--accent)' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            </div>

            {/* Form Area */}
            <div className="w-full">
              <AnimatePresence mode="wait">
                <motion.form
                  key={isLogin ? 'login' : 'signup'}
                  initial={{ opacity: 0, x: isLogin ? -16 : 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLogin ? 16 : -16 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="flex flex-col gap-4 sm:gap-5"
                  onSubmit={handleAuth}
                >
                  {/* Full Name — Signup only */}
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="float-input-group"
                    >
                      <input type="text" id="signup-name" placeholder=" " autoComplete="name" required={!isLogin} />
                      <label htmlFor="signup-name">Full Name</label>
                    </motion.div>
                  )}

                  {/* Email */}
                  <div className="float-input-group">
                    <input type="email" id="auth-email" placeholder=" " autoComplete="email" required />
                    <label htmlFor="auth-email">Email Address</label>
                  </div>

                  {/* Password */}
                  <div className="float-input-group">
                    <input type="password" id="auth-password" placeholder=" " autoComplete={isLogin ? 'current-password' : 'new-password'} required minLength="6" />
                    <label htmlFor="auth-password">Password</label>
                  </div>

                  {/* Auth Error Display */}
                  <AnimatePresence>
                    {authError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-[13px] font-medium text-red-500 mt-[-4px]"
                      >
                        {authError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Forgot Password */}
                  {isLogin && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        className="text-[13px] font-medium cursor-pointer transition-opacity hover:opacity-80"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.01 }}
                    className="w-full h-[56px] rounded-2xl font-bold text-[15px] sm:text-[16px] tracking-tight text-white flex items-center justify-center mt-2 sm:mt-4 cursor-pointer theme-transition"
                    style={{
                      backgroundColor: isSubmitting ? 'var(--accent-dimmed)' : 'var(--accent)',
                      boxShadow: isSubmitting ? 'none' : '0 4px 16px var(--accent-dimmed)',
                    }}
                    id="auth-submit"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      isLogin ? 'Log In' : 'Create Account'
                    )}
                  </motion.button>
                </motion.form>
              </AnimatePresence>

              {/* Divider */}
              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--separator)' }} />
                <span
                  className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Or continue with
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--separator)' }} />
              </div>

              {/* Social Auth Buttons */}
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setAuthError('Google sign in failed.')}
                  theme="outline"
                  size="large"
                  width="360"
                  text="continue_with"
                  shape="pill"
                />
              </div>
            </div>
          </motion.div>

          {/* Legal footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center lg:text-right w-full max-w-[440px] text-[12px] font-normal mt-6 lg:mt-8 px-6 lg:px-0 leading-relaxed"
            style={{ color: 'var(--text-tertiary)' }}
          >
            By continuing, you agree to our <a href="#" className="underline hover:text-[var(--text-secondary)] transition-colors">Terms of Service</a> and <a href="#" className="underline hover:text-[var(--text-secondary)] transition-colors">Privacy Policy</a>.
          </motion.p>
        </div>
      </div>
    </div>
  );
}

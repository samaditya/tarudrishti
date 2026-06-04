import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { springConfig } from '../utils/animations';
import Logo from './Logo';

export default function ResetPassword({ token, onResetSuccess }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus('error');
      setErrorMessage('Passwords do not match');
      return;
    }
    
    setIsSubmitting(true);
    setStatus(null);
    setErrorMessage('');

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to reset password');
      }

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-dvh flex flex-col relative overflow-hidden theme-transition items-center justify-center p-6"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={springConfig}
        className="w-full max-w-[440px] rounded-[32px] p-8 sm:p-10 relative overflow-hidden shadow-2xl flex flex-col items-center"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--separator)'
        }}
      >
        <div className="mb-6 flex flex-col items-center">
          <Logo size={42} />
          <h2
            className="text-[24px] font-bold tracking-tight mt-4 text-center"
            style={{ color: 'var(--text-primary)' }}
          >
            Create New Password
          </h2>
          <p
            className="text-[14px] font-medium text-center mt-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Please enter your new password below.
          </p>
        </div>

        <div className="w-full">
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center text-center py-4"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                  style={{ backgroundColor: 'rgba(52, 199, 89, 0.1)' }}
                >
                  <CheckCircle2 size={32} color="#34C759" />
                </div>
                <h3
                  className="text-[20px] font-bold tracking-tight mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Password Reset!
                </h3>
                <p
                  className="text-[14px] font-medium leading-relaxed mb-6"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Your password has been successfully updated. You can now log in with your new password.
                </p>
                <button
                  onClick={onResetSuccess}
                  className="w-full h-[52px] rounded-2xl font-bold text-[15px] text-white cursor-pointer transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  Back to Login
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
                onSubmit={handleSubmit}
              >
                <div className="float-input-group">
                  <input
                    type="password"
                    id="new-password"
                    placeholder=" "
                    required
                    minLength="6"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <label htmlFor="new-password">New Password</label>
                </div>
                
                <div className="float-input-group">
                  <input
                    type="password"
                    id="confirm-password"
                    placeholder=" "
                    required
                    minLength="6"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <label htmlFor="confirm-password">Confirm Password</label>
                </div>

                {/* Error Message */}
                <AnimatePresence>
                  {status === 'error' && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-[13px] font-medium text-red-500"
                    >
                      {errorMessage}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.01 }}
                  className="w-full h-[52px] rounded-2xl font-bold text-[15px] text-white flex items-center justify-center mt-2 cursor-pointer transition-all"
                  style={{
                    backgroundColor: isSubmitting ? 'var(--accent-dimmed)' : 'var(--accent)',
                    boxShadow: isSubmitting ? 'none' : '0 4px 16px var(--accent-dimmed)',
                  }}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    'Save New Password'
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

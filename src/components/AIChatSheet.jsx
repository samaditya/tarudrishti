import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Camera, ArrowUp, Square, CheckCircle2, Leaf, AlertCircle, ImageIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/* ===========================================================================
   Image Compression Utility
   Resizes to max 1024px and returns raw base64 (no prefix).
   =========================================================================== */
async function compressAndEncodeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1024;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        // Return raw base64 string without prefix
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
        resolve(base64);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ===========================================================================
   Main Component
   =========================================================================== */
export default function AIChatSheet({ isOpen, onClose }) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const isDark = theme === 'dark';

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // { file, previewUrl }
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const inputRef = useRef(null);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        const prefix = recognitionRef.current._initialText || '';
        setInputText((prefix ? prefix + ' ' : '') + transcript);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /* ----- Voice Handlers ----- */
  const handleStartRecording = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }
    recognitionRef.current._initialText = inputText.trim();
    setIsRecording(true);
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error(e);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  /* ----- Image Selection Handler ----- */
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
  };

  const clearImage = (revoke = true) => {
    if (revoke && selectedImage?.previewUrl) {
      URL.revokeObjectURL(selectedImage.previewUrl);
    }
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ----- Send Message to Orchestrator ----- */
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text && !selectedImage) return;

    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD

    // Push user message immediately
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      type: 'text',
      content: text,
      imagePreview: selectedImage?.previewUrl || null,
      timestamp,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Compress image if present
    let base64String = null;
    if (selectedImage?.file) {
      try {
        base64String = await compressAndEncodeImage(selectedImage.file);
      } catch {
        base64String = null;
      }
    }

    // Clear the input preview, but DO NOT revoke the blob URL 
    // since the chat bubble still needs it!
    clearImage(false);

    // Format conversation history
    const history = messages.map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: typeof msg.content === 'string' ? msg.content : (msg.content.message || '')
    }));

    // Inject Weather Context if available
    let weatherContextStr = null;
    try {
      const storedWeather = localStorage.getItem('tarudrishti_weather_context');
      if (storedWeather) {
        const w = JSON.parse(storedWeather);
        weatherContextStr = `Current Location: ${w.location}, Temperature: ${w.temperature}°C, Weather Code: ${w.weathercode}`;
      }
    } catch (e) {
      // ignore parsing errors
    }

    // Construct API payload
    const payload = {
      user_message: text,
      current_date: currentDate,
      history: history,
      ...(base64String && { image_base64: base64String }),
      ...(weatherContextStr && { weather_context: weatherContextStr })
    };

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const userStr = localStorage.getItem('tarudrishti_user');
      const userToken = userStr ? JSON.parse(userStr)?.token : null;
      const res = await fetch(`${API_BASE}/api/chat/orchestrator`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken || ''}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }

      const data = await res.json();

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        type: data.intent || 'GENERAL_CHAT',
        content: data,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isStreaming: true, // Mark as new for typewriter
      };
      setMessages((prev) => [...prev, aiMsg]);

      // If AI logged care, refresh the data and show a toast
      if (data.intent === 'LOG_CARE') {
        queryClient.invalidateQueries({ queryKey: ['plants'] });
        toast.success(data.message || 'Activity logged successfully! 🌿');
        if (window.navigator.vibrate) window.navigator.vibrate(50);
      }
    } catch (err) {
      // Error bubble
      const errMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        type: 'ERROR',
        content: { message: err.message || 'Something went wrong. Please try again.' },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60]"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose();
            }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-[70] rounded-t-[32px] flex flex-col shadow-2xl"
            style={{
              height: '80vh',
              backgroundColor: 'var(--bg-primary)',
            }}
            id="ai-chat-sheet"
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2 shrink-0">
              <div
                className="w-12 h-[5px] rounded-full opacity-40"
                style={{ backgroundColor: 'var(--text-tertiary)' }}
              />
            </div>

            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 shrink-0"
              style={{ borderBottom: `1px solid var(--separator)` }}
            >
              <h3
                className="text-[20px] font-bold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Botanical AI
              </h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{ backgroundColor: 'var(--fill-tertiary)', border: '1px solid var(--separator)' }}
                aria-label="Close"
                id="close-chat-sheet"
              >
                <X size={18} strokeWidth={2.5} style={{ color: 'var(--text-secondary)' }} />
              </motion.button>
            </div>

            {/* Chat Timeline — Layout Prop for Smooth Reflow */}
            <motion.div 
              layout
              className="flex-1 overflow-y-auto overflow-x-hidden px-5 pt-8 pb-12 flex flex-col space-y-8"
            >
              {messages.length === 0 && !isTyping && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16 opacity-60">
                  <Leaf size={32} className="mb-4" style={{ color: 'var(--accent)' }} />
                  <p className="text-[15px] font-semibold tracking-tight" style={{ color: 'var(--text-secondary)' }}>
                    Ask me anything about your plants.
                  </p>
                  <p className="text-[13px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    I can log care activities, diagnose issues, or answer general gardening questions.
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="w-full"
                >
                  {msg.sender === 'user' ? (
                    <UserBubble message={msg} />
                  ) : msg.type === 'ERROR' ? (
                    <ErrorBubble message={msg} isDark={isDark} />
                  ) : msg.type === 'LOG_CARE' ? (
                    <CareLogBubble message={msg} isDark={isDark} />
                  ) : (
                    <TextBubble message={msg} isDark={isDark} />
                  )}
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5 px-4 py-3"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: 'var(--text-tertiary)' }}
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </motion.div>

            {/* ===== Image Preview Chip ===== */}
            {selectedImage && (
              <div className="px-5 pb-1">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                  }}
                >
                  <img src={selectedImage.previewUrl} alt="Selected" className="w-8 h-8 rounded-lg object-cover" />
                  <span className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>Image attached</span>
                  <button onClick={clearImage} className="ml-1 cursor-pointer">
                    <X size={14} style={{ color: 'var(--text-tertiary)' }} />
                  </button>
                </div>
              </div>
            )}

            {/* ===== Input Area — Floating Pill ===== */}
            <div className="shrink-0 px-5 pb-8 pt-2 safe-bottom bg-gradient-to-t from-[var(--bg-primary)] to-transparent">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageSelect}
              />
              <AnimatePresence mode="wait">
                {isRecording ? (
                  <RecordingPill
                    key="recording"
                    onStop={handleStopRecording}
                    isDark={isDark}
                  />
                ) : (
                  <InputPill
                    key="input"
                    inputRef={inputRef}
                    inputValue={inputText}
                    setInputValue={setInputText}
                    onMicPress={handleStartRecording}
                    onCameraPress={() => fileInputRef.current?.click()}
                    onSend={handleSend}
                    hasImage={!!selectedImage}
                    isDark={isDark}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ===========================================================================
   Input Pill
   =========================================================================== */
function InputPill({ inputRef, inputValue, setInputValue, onMicPress, onCameraPress, onSend, hasImage, isDark }) {
  const hasText = inputValue.trim().length > 0;
  const canSend = hasText || hasImage;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="flex items-center gap-3 rounded-full px-2 py-2 w-full max-w-md mx-auto backdrop-blur-md shadow-lg"
      style={{
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
      }}
    >
      {/* Camera */}
      <motion.button
        whileTap={{ scale: 0.82 }}
        onClick={onCameraPress}
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors"
        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
        aria-label="Camera"
        id="camera-btn"
      >
        <Camera size={18} strokeWidth={2} style={{ color: 'var(--text-secondary)' }} />
      </motion.button>

      {/* Text Input */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask Botanical AI..."
        className="flex-1 bg-transparent outline-none text-[15px] font-medium tracking-tight min-w-0"
        style={{ color: 'var(--text-primary)' }}
        id="chat-input"
      />

      {/* Mic or Send */}
      {canSend ? (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.82 }}
          onClick={onSend}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-md"
          style={{ backgroundColor: 'var(--accent)' }}
          aria-label="Send"
          id="send-btn"
        >
          <ArrowUp size={18} strokeWidth={2.5} color="white" />
        </motion.button>
      ) : (
        <motion.button
          whileTap={{ scale: 0.82 }}
          onClick={onMicPress}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-md"
          style={{ backgroundColor: 'var(--accent)' }}
          aria-label="Voice input"
          id="voice-input-btn"
        >
          <Mic size={18} strokeWidth={2.2} color="white" />
        </motion.button>
      )}
    </motion.div>
  );
}

/* ===========================================================================
   Voice Recording Pill with Waveform
   =========================================================================== */
function RecordingPill({ onStop, isDark }) {
  const barCount = 24;
  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 15 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="flex items-center gap-3 rounded-full px-3 py-2 w-full max-w-md mx-auto backdrop-blur-md shadow-lg"
      style={{
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
      }}
    >
      <div className="flex items-center gap-2 pl-2 shrink-0">
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: '#FF453A', boxShadow: '0 0 8px rgba(255,69,58,0.6)' }}
        />
        <span
          className="text-[14px] font-semibold tabular-nums tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Listening
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center gap-[2px] h-10 px-2">
        {bars.map((i) => (
          <motion.div
            key={i}
            className="waveform-bar rounded-full"
            style={{
              width: 3,
              height: '100%',
              backgroundColor: 'var(--accent)',
              opacity: 0.8,
              transformOrigin: 'center',
              animationDelay: `${i * 0.06}s`,
              animationDuration: `${0.5 + Math.random() * 0.6}s`,
            }}
          />
        ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.82 }}
        onClick={onStop}
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-md"
        style={{ backgroundColor: '#FF453A' }}
        aria-label="Stop recording"
        id="stop-recording-btn"
      >
        <Square size={14} fill="white" color="white" />
      </motion.button>
    </motion.div>
  );
}

/* ===========================================================================
   User Chat Bubble
   =========================================================================== */
function UserBubble({ message }) {
  return (
    <div className="flex w-full justify-end flex-col items-end">
      {message.imagePreview && (
        <img
          src={message.imagePreview}
          alt="Uploaded"
          className="w-36 h-36 rounded-2xl object-cover mb-2 shadow-md"
        />
      )}
      {message.content && (
        <div
          className="px-5 py-4 shadow-[0_0_15px_rgba(52,199,89,0.2)]"
          style={{
            backgroundColor: 'var(--accent)',
            borderRadius: '18px 18px 4px 18px',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            maxWidth: '85%',
            overflow: 'hidden',
          }}
        >
          <p className="text-[15px] text-white font-medium leading-relaxed tracking-tight">
            {message.content}
          </p>
        </div>
      )}
      <p className="text-xs text-gray-500 mt-1.5 font-medium pr-1">
        {message.timestamp}
      </p>
    </div>
  );
}

/* ===========================================================================
   Typewriter Effect Component
   =========================================================================== */
function Typewriter({ text, speed = 15, onComplete }) {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, text, speed, onComplete]);

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {displayedText}
    </ReactMarkdown>
  );
}

/* ===========================================================================
   AI Text Bubble (General Chat / Diagnosis)
   =========================================================================== */
function TextBubble({ message, isDark }) {
  const text = message.content?.message || '';
  const [isDone, setIsDone] = useState(false);

  // We only want to type out the NEWEST message. 
  // If the message is older (has an ID less than the current max), show it fully.
  // This prevents all history re-typing on every re-render.
  const isNew = message.isStreaming || false; 

  return (
    <div className="flex w-full justify-start flex-col items-start">
        <div
          className="px-5 py-4 backdrop-blur-xl"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            borderRadius: '24px 24px 24px 8px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
            maxWidth: '90%',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            overflow: 'hidden',
          }}
        >
        <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}
          style={{ '--tw-prose-body': 'var(--text-primary)', '--tw-prose-headings': 'var(--text-primary)' }}
        >
          {isNew && !isDone ? (
            <Typewriter text={text} onComplete={() => setIsDone(true)} />
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1.5 font-medium pl-1">
        {message.timestamp}
      </p>
    </div>
  );
}

/* ===========================================================================
   Care Log Bubble (LOG_CARE — Glassmorphic Activity Widget)
   =========================================================================== */
function CareLogBubble({ message, isDark }) {
  const data = message.content?.data;
  if (!data) return <TextBubble message={message} isDark={isDark} />;

  return (
    <div className="flex w-full justify-start flex-col items-start">
      <div
        className="w-full sm:w-[90%] overflow-hidden backdrop-blur-xl"
        style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
          borderRadius: '24px 24px 24px 8px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
        }}
      >
        {/* Header Ribbon */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ backgroundColor: isDark ? 'rgba(52, 199, 89, 0.15)' : 'rgba(52, 199, 89, 0.1)' }}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-[#34C759]" strokeWidth={2.5} />
            <span className="text-[14px] font-bold tracking-tight uppercase text-[#34C759]">
              Care Activity Logged
            </span>
          </div>
          <span className="text-[12px] font-medium text-gray-500">
            {message.timestamp}
          </span>
        </div>

        {/* Segmented Data Tiles */}
        <div className="flex flex-col p-2 gap-1.5">
          {/* Plant Name */}
          <div
            className="flex justify-between items-center px-4 py-3 rounded-xl"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/20 text-emerald-500">
                <Leaf size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[13px] font-semibold uppercase tracking-wider text-gray-500">
                Target
              </span>
            </div>
            <span className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>
              {data.plant_name || 'Plant'}
            </span>
          </div>

          {/* Action */}
          <div
            className="flex justify-between items-center px-4 py-3 rounded-xl"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-500">
                <ArrowUp size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[13px] font-semibold uppercase tracking-wider text-gray-500">
                Action
              </span>
            </div>
            <span className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>
              {data.action_type}
            </span>
          </div>

          {/* Substance */}
          {data.substance_used && (
            <div
              className="flex justify-between items-center px-4 py-3 rounded-xl"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-green-500/20 text-green-500">
                  <Leaf size={14} strokeWidth={2.5} />
                </div>
                <span className="text-[13px] font-semibold uppercase tracking-wider text-gray-500">
                  Substance
                </span>
              </div>
              <span className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>
                {data.substance_used}
              </span>
            </div>
          )}

          {/* Date */}
          <div
            className="flex justify-between items-center px-4 py-3 rounded-xl"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-purple-500/20 text-purple-500">
                <Square size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[13px] font-semibold uppercase tracking-wider text-gray-500">
                Date
              </span>
            </div>
            <span className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>
              {data.action_date}
            </span>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1.5 font-medium pl-1">
        {message.timestamp}
      </p>
    </div>
  );
}

/* ===========================================================================
   Error Bubble (Red-tinted)
   =========================================================================== */
function ErrorBubble({ message, isDark }) {
  return (
    <div className="flex w-full justify-start flex-col items-start">
      <div
        className="px-5 py-4 flex items-start gap-3 overflow-hidden"
        style={{
            backgroundColor: isDark ? 'rgba(255, 69, 58, 0.08)' : 'rgba(255, 69, 58, 0.06)',
            border: `1px solid ${isDark ? 'rgba(255,69,58,0.2)' : 'rgba(255,69,58,0.15)'}`,
            borderRadius: '20px 20px 20px 6px',
            maxWidth: '90%',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
        }}
      >
        <AlertCircle size={18} className="text-[#FF453A] shrink-0 mt-0.5" strokeWidth={2.5} />
        <p className="text-[14px] font-medium leading-relaxed text-[#FF453A]">
          {message.content?.message || 'An unexpected error occurred.'}
        </p>
      </div>
      <p className="text-xs text-gray-500 mt-1.5 font-medium pl-1">
        {message.timestamp}
      </p>
    </div>
  );
}

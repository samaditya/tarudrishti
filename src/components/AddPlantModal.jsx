import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Loader2, UploadCloud, Leaf } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import toast from 'react-hot-toast';
import { springConfig } from '../utils/animations';

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
        // Return data URL for preview AND base64 for backend
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AddPlantModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [plantDetails, setPlantDetails] = useState({ name: '', species: '' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef(null);

  const resetState = () => {
    setImagePreview(null);
    setImageBase64(null);
    setPlantDetails({ name: '', species: '' });
    setIsAnalyzing(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleImageCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressAndEncodeImage(file);
      setImagePreview(compressedDataUrl);
      
      const base64 = compressedDataUrl.replace(/^data:image\/jpeg;base64,/, '');
      setImageBase64(base64);
      analyzeImage(base64);
    } catch (err) {
      console.error("Compression failed", err);
      toast.error("Failed to process image.");
    }
  };

  const analyzeImage = async (base64) => {
    setIsAnalyzing(true);
    try {
      const res = await apiFetch('/api/plants/analyze-image', {
        method: 'POST',
        body: JSON.stringify({ image_base64: base64 })
      });
      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setPlantDetails({
        name: data.name !== 'Unknown' ? data.name : '',
        species: data.species !== 'Unknown' ? data.species : ''
      });
    } catch (err) {
      console.error(err);
      alert('Failed to analyze image. Please enter details manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...plantDetails,
        image_url: imagePreview || null,
      };
      const res = await apiFetch('/api/plants', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save plant');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants'] });
      toast.success('Plant added to your garden! 🌱');
      handleClose();
    },
    onError: (err) => {
      toast.error('Failed to save plant');
    }
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (!plantDetails.name || !plantDetails.species) return;
    saveMutation.mutate();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={springConfig}
            className="relative w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]"
            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--separator)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--separator)' }}>
              <h2 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Add New Plant
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--fill-secondary)] border border-transparent hover:border-[var(--separator)]"
              >
                <X size={22} style={{ color: 'var(--text-secondary)' }} />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
              {/* Image Upload Area */}
              <motion.div 
                whileHover={{ scale: 0.99 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/3] rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group transition-all"
                style={{ 
                  borderColor: imagePreview ? 'transparent' : 'var(--separator)',
                  backgroundColor: imagePreview ? 'black' : 'var(--fill-secondary)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                }}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-90 group-hover:opacity-75 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/60 backdrop-blur-xl px-5 py-2.5 rounded-full flex items-center gap-2.5 text-white font-bold text-[14px] border border-white/10">
                        <Camera size={18} /> Retake Photo
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4 text-[var(--text-secondary)]">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[var(--fill-tertiary)] border border-[var(--separator)]">
                      <Camera size={28} />
                    </div>
                    <div className="text-center">
                      <span className="block text-[16px] font-bold text-[var(--text-primary)]">Snap a Photo</span>
                      <span className="text-[13px] font-medium opacity-60">AI will identify the species</span>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={handleImageCapture}
                  className="hidden"
                />
              </motion.div>

              {/* Analysis Status */}
              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-center gap-3 text-[var(--accent)] font-bold text-[14px] py-1"
                  >
                    <Loader2 size={18} className="animate-spin" />
                    Consulting Botanical Database...
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSave} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-bold tracking-[0.05em] text-[var(--text-secondary)] uppercase pl-1">
                    Common Name
                  </label>
                  <input
                    type="text"
                    required
                    value={plantDetails.name}
                    onChange={(e) => setPlantDetails({ ...plantDetails, name: e.target.value })}
                    placeholder="e.g. Monstera Deliciosa"
                    className="w-full px-5 py-4 rounded-2xl border outline-none font-semibold text-[16px] transition-all focus:ring-2 focus:ring-[var(--accent)]/20"
                    style={{
                      backgroundColor: 'var(--fill-secondary)',
                      borderColor: 'var(--separator)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-bold tracking-[0.05em] text-[var(--text-secondary)] uppercase pl-1">
                    Scientific Species
                  </label>
                  <input
                    type="text"
                    required
                    value={plantDetails.species}
                    onChange={(e) => setPlantDetails({ ...plantDetails, species: e.target.value })}
                    placeholder="e.g. Epipremnum aureum"
                    className="w-full px-5 py-4 rounded-2xl border outline-none font-semibold text-[16px] transition-all focus:ring-2 focus:ring-[var(--accent)]/20"
                    style={{
                      backgroundColor: 'var(--fill-secondary)',
                      borderColor: 'var(--separator)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={saveMutation.isPending || isAnalyzing}
                  className="w-full mt-4 py-4.5 rounded-2xl font-bold text-[17px] text-white flex items-center justify-center gap-2.5 cursor-pointer transition-all disabled:opacity-50 shadow-lg shadow-[var(--accent)]/20"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  {saveMutation.isPending ? (
                    <Loader2 size={22} className="animate-spin" />
                  ) : (
                    <>
                      <Leaf size={20} /> Add to Garden
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

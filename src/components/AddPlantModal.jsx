import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Loader2, UploadCloud, Leaf } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/api';
import toast from 'react-hot-toast';

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

  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
      // Remove data:image... prefix for backend
      const base64 = event.target.result.split(',')[1];
      setImageBase64(base64);
      analyzeImage(base64);
    };
    reader.readAsDataURL(file);
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
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]"
            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--separator)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--separator)' }}>
              <h2 className="text-[20px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Add New Plant
              </h2>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--fill-secondary)]"
              >
                <X size={20} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {/* Image Upload Area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group transition-colors"
                style={{ 
                  borderColor: imagePreview ? 'transparent' : 'var(--separator)',
                  backgroundColor: imagePreview ? 'black' : 'var(--fill-secondary)'
                }}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-90 group-hover:opacity-70 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-white font-medium text-[14px]">
                        <Camera size={16} /> Retake Photo
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-[var(--text-secondary)]">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--fill-tertiary)]">
                      <Camera size={24} />
                    </div>
                    <span className="text-[15px] font-medium">Tap to snap or upload</span>
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
              </div>

              {/* Analysis Status */}
              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-center gap-3 text-[var(--accent)] font-medium text-[14px]"
                  >
                    <Loader2 size={16} className="animate-spin" />
                    Analyzing plant species...
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
                    Common Name
                  </label>
                  <input
                    type="text"
                    required
                    value={plantDetails.name}
                    onChange={(e) => setPlantDetails({ ...plantDetails, name: e.target.value })}
                    placeholder="e.g. Monstera Deliciosa"
                    className="w-full px-4 py-3.5 rounded-xl border outline-none font-medium text-[15px] transition-colors"
                    style={{
                      backgroundColor: 'var(--fill-secondary)',
                      borderColor: 'var(--separator)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
                    Scientific Species
                  </label>
                  <input
                    type="text"
                    required
                    value={plantDetails.species}
                    onChange={(e) => setPlantDetails({ ...plantDetails, species: e.target.value })}
                    placeholder="e.g. Epipremnum aureum"
                    className="w-full px-4 py-3.5 rounded-xl border outline-none font-medium text-[15px] transition-colors"
                    style={{
                      backgroundColor: 'var(--fill-secondary)',
                      borderColor: 'var(--separator)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={saveMutation.isPending || isAnalyzing}
                  className="w-full mt-4 py-4 rounded-xl font-bold text-[16px] text-white flex items-center justify-center gap-2 cursor-pointer transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  {saveMutation.isPending ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Leaf size={18} /> Add to Garden
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

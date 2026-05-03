import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, WifiOff, Loader2 } from 'lucide-react';
import PlantCard from './PlantCard';
import WeatherWidget from './WeatherWidget';
import ErrorBoundary from './ErrorBoundary';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function PlantGallery({ onSelectPlant }) {
  const [plants, setPlants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlants = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/api/plants`);
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        const data = await res.json();
        setPlants(data);
      } catch (err) {
        console.error('Failed to fetch plants:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlants();
  }, []);

  const filteredPlants = plants.filter((plant) =>
    plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plant.species.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="w-full flex flex-col" id="plant-gallery">
      {/* Section Header & Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6 sm:mb-8 flex flex-col items-center justify-center gap-5 text-center relative"
      >
        <div>
          <h2
            className="text-[28px] sm:text-[32px] lg:text-[36px] font-bold tracking-[-0.03em] leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            My Garden
          </h2>
          <p
            className="text-[13px] sm:text-[14px] font-normal mt-0.5 tracking-tight"
            style={{ color: 'var(--text-secondary)' }}
          >
            {plants.length} plant{plants.length !== 1 ? 's' : ''} · {isLoading ? 'Syncing...' : 'All healthy'}
          </p>
        </div>
      </motion.div>

      {/* Action Bar: Search & Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center w-full mb-8 sm:mb-10 relative z-10">
        <div className="hidden lg:block" /> {/* Left Spacer for centering Search */}
        
        <div className="flex justify-center w-full relative group">
          {/* Premium Search Bar */}
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-2 pl-4 flex items-center pointer-events-none">
              <Search size={18} style={{ color: 'var(--text-tertiary)' }} strokeWidth={2.5} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[46px] pl-[48px] pr-4 rounded-xl outline-none transition-all duration-200 
                         bg-[var(--fill-secondary)] border border-[var(--separator)] 
                         text-[var(--text-primary)] text-[15px] font-medium placeholder-[var(--text-tertiary)]
                         focus:bg-[var(--fill-tertiary)] focus:border-[var(--accent)] 
                         focus:ring-4 focus:ring-[var(--accent-dimmed)]"
            />
          </div>
        </div>

        <div className="flex justify-center lg:justify-end w-full">
           <ErrorBoundary componentName="WeatherWidget">
             <WeatherWidget />
           </ErrorBoundary>
        </div>
      </div>

      {/* Loading State — Skeleton Grid */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              className="aspect-[4/5] rounded-2xl"
              style={{ backgroundColor: 'var(--fill-secondary)' }}
            />
          ))}
        </div>
      )}

      {/* Error State — Unable to Connect */}
      {!isLoading && error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--fill-secondary)' }}>
            <WifiOff size={24} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <h3 className="text-[17px] font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
            Unable to connect to greenhouse
          </h3>
          <p className="text-[14px] font-normal mb-4" style={{ color: 'var(--text-secondary)' }}>
            Please ensure the backend server is running.
          </p>
          <button
            onClick={() => {
              setIsLoading(true);
              setError(null);
              fetch(`${API_BASE}/api/plants`)
                .then(res => {
                  if (!res.ok) throw new Error(`Server responded ${res.status}`);
                  return res.json();
                })
                .then(data => setPlants(data))
                .catch(err => setError(err.message))
                .finally(() => setIsLoading(false));
            }}
            className="px-5 py-2.5 rounded-full text-[14px] font-semibold text-white cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* Loaded State — Plant Grid */}
      {!isLoading && !error && (
        <>
          {filteredPlants.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {filteredPlants.map((plant, index) => (
                <PlantCard key={plant.id} plant={plant} index={index} onClick={() => onSelectPlant(plant)} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--fill-secondary)' }}>
                <Search size={24} style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <h3 className="text-[17px] font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
                No plants found
              </h3>
              <p className="text-[14px] font-normal" style={{ color: 'var(--text-secondary)' }}>
                We couldn't find anything matching "{searchQuery}"
              </p>
            </motion.div>
          )}
        </>
      )}
    </section>
  );
}

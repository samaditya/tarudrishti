import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, CloudSun, Loader2, Cloud, Sun, CloudRain, Droplets, Wind, Thermometer, Leaf } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function WeatherWidget() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const savedCoords = localStorage.getItem('tarudrishti_coords');
    if (savedCoords) {
      const { lat, lon } = JSON.parse(savedCoords);
      fetchWeather(lat, lon);
    }
  }, []);

  const fetchWeather = async (lat, lon) => {
    try {
      // 1. Reverse Geocoding (City/Village)
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const geoData = await geoRes.json();
      const city = geoData?.address?.city || geoData?.address?.town || geoData?.address?.village || geoData?.address?.county || 'Local Garden';

      // 2. Weather Data
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      const weatherData = await weatherRes.json();

      setLocation(city);
      setWeather(weatherData.current_weather);

      // Store globally for AI Orchestrator to use
      localStorage.setItem('tarudrishti_weather_context', JSON.stringify({
        location: city,
        temperature: weatherData.current_weather.temperature,
        weathercode: weatherData.current_weather.weathercode
      }));

      setLoading(false);
    } catch (err) {
      setError('Failed to load weather data');
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    setLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          localStorage.setItem('tarudrishti_coords', JSON.stringify({ lat: latitude, lon: longitude }));
          fetchWeather(latitude, longitude);
        },
        (err) => {
          console.error(err);
          setError('Location access denied');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation not supported');
      setLoading(false);
    }
  };

  const getWeatherDetails = (code, temp) => {
    if (code <= 3) {
      return {
        icon: <Sun size={20} className="text-yellow-500" />,
        condition: 'Clear & Sunny',
        suggestion: temp > 28 ? 'High heat. Check soil moisture and delay fertilizing.' : 'Perfect conditions for outdoor plants.',
      };
    }
    if (code <= 69) {
      return {
        icon: <Cloud size={20} className="text-gray-400" />,
        condition: 'Overcast',
        suggestion: 'Lower evaporation today. Hold off on heavy watering.',
      };
    }
    return {
      icon: <CloudRain size={20} className="text-blue-400" />,
      condition: 'Rainy',
      suggestion: 'Skip watering today! Let nature do the work.',
    };
  };

  if (error) {
    return (
      <div className="w-full flex items-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6 sm:mb-8">
        <MapPin size={18} className="text-red-500" />
        <span className="text-[13px] font-semibold text-red-500">{error}</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="w-full flex flex-col items-center justify-center p-6 rounded-2xl mb-6 sm:mb-8"
        style={{ backgroundColor: 'var(--fill-secondary)' }}
      >
        <Loader2 size={24} className="animate-spin text-gray-400 mb-2" />
        <span className="text-[13px] font-semibold text-gray-500">Acquiring satellite data...</span>
      </div>
    );
  }

  if (weather && location) {
    const details = getWeatherDetails(weather.weathercode, weather.temperature);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 rounded-[20px] flex flex-col gap-5 backdrop-blur-xl w-full sm:w-[320px]"
        style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.03)'
        }}
      >
        {/* Top: Temperature & Icon */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
              <MapPin size={12} style={{ color: 'var(--accent)' }} />
              <span className="text-[11px] font-bold tracking-widest uppercase text-gray-500">
                {location}
              </span>
            </div>
            <span className="text-[36px] font-bold tracking-tighter leading-none mb-1.5" style={{ color: 'var(--text-primary)' }}>
              {Math.round(weather.temperature)}°C
            </span>
            <span className="text-[14px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              {details.condition}
            </span>
          </div>
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-white shadow-sm shrink-0" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff' }}>
            {details.icon}
          </div>
        </div>

        {/* Bottom: AI Insight */}
        <div className="pt-4 border-t" style={{ borderColor: 'var(--separator)' }}>
          <div className="flex items-start gap-2.5">
            <Leaf size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
            <p className="text-[13px] font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>AI Insight: </strong>
              {details.suggestion}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={handleGetLocation}
      className="w-full sm:w-[320px] p-6 sm:p-8 rounded-[24px] flex flex-col items-center justify-center text-center transition-all group overflow-hidden relative"
      style={{
        backgroundColor: isDark ? 'rgba(52, 199, 89, 0.05)' : 'rgba(52, 199, 89, 0.03)',
        border: `1px dashed ${isDark ? 'rgba(52, 199, 89, 0.3)' : 'rgba(52, 199, 89, 0.4)'}`
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#34C759]/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
      <CloudSun size={28} className="mb-3 text-[#34C759]" strokeWidth={2} />
      <span className="text-[15px] font-bold tracking-tight text-[#34C759] mb-1">
        Enable Local Weather Insights
      </span>
      <span className="text-[13px] font-medium text-[#34C759]/70 max-w-sm text-center">
        Allow location access to receive dynamic AI care suggestions based on your city's current climate.
      </span>
    </motion.button>
  );
}

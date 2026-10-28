import React, { useState, useEffect, useRef, useCallback } from 'react';
import { mapsService } from '../../../services/mapsService';

export default function GooglePlacesSearchInput({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Search location, subdivision, or landmark...',
  country = 'ph',
  className = '',
  disabled = false,
}) {
  const [query, setQuery] = useState(value || '');
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync external value
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Outside click listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch predictions
  const fetchPredictions = useCallback(
    async (text) => {
      if (!text || text.trim().length < 2) {
        setPredictions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await mapsService.autocomplete(text.trim(), country);
        setPredictions(Array.isArray(results) ? results : []);
        setIsOpen(Array.isArray(results) && results.length > 0);
      } catch (err) {
        console.error('[GooglePlacesSearchInput] Autocomplete error:', err);
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [country]
  );

  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    if (typeof onChange === 'function') {
      onChange(text);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchPredictions(text);
    }, 280);
  };

  const handleSelectPrediction = async (prediction) => {
    const chosenText = prediction.formattedAddress || prediction.description || prediction.mainText || '';
    setQuery(chosenText);
    setIsOpen(false);
    setPredictions([]);

    if (typeof onChange === 'function') {
      onChange(chosenText);
    }

    let lat = prediction.latitude;
    let lng = prediction.longitude;
    let city = prediction.city;
    let postalCode = prediction.postalCode;

    // If coordinates are missing on the prediction item, forward geocode
    if (!lat || !lng) {
      try {
        const geo = await mapsService.geocode(chosenText, country);
        if (geo) {
          lat = geo.latitude;
          lng = geo.longitude;
          city = geo.city || city;
          postalCode = geo.postalCode || postalCode;
        }
      } catch (err) {
        console.warn('[GooglePlacesSearchInput] Geocode fallback error:', err);
      }
    }

    if (typeof onSelect === 'function') {
      onSelect({
        address: chosenText,
        formattedAddress: chosenText,
        latitude: lat,
        longitude: lng,
        city,
        postalCode,
        placeId: prediction.placeId,
      });
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || predictions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < predictions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : predictions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < predictions.length) {
        e.preventDefault();
        handleSelectPrediction(predictions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input Field */}
      <div className="relative flex items-center">
        <span className="absolute left-3 text-[#64748B] pointer-events-none text-sm">
          🔍
        </span>
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (predictions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full h-10 pl-9 pr-8 bg-white border border-[#E2E8F0] hover:border-slate-300 focus:border-[#0F766E] rounded-lg text-sm text-[#1E293B] placeholder-[#64748B] outline-none focus:ring-1 focus:ring-[#0F766E] transition-colors"
        />
        {isLoading && (
          <span className="absolute right-3 w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        )}
        {!isLoading && query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setPredictions([]);
              setIsOpen(false);
              if (typeof onChange === 'function') onChange('');
            }}
            className="absolute right-2.5 text-[#64748B] hover:text-[#1E293B] text-xs p-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Predictions Dropdown Popover */}
      {isOpen && predictions.length > 0 && (
        <ul
          data-lenis-prevent="true"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-[#E2E8F0] rounded-lg shadow-lg max-h-64 overflow-y-auto divide-y divide-[#E2E8F0] py-1"
        >
          {predictions.map((item, idx) => {
            const isHighlighted = idx === selectedIndex;
            return (
              <li
                key={item.placeId || idx}
                onClick={() => handleSelectPrediction(item)}
                className={`px-3 py-2.5 flex items-start gap-2.5 cursor-pointer min-h-[44px] transition-colors ${
                  isHighlighted ? 'bg-teal-50 text-[#0F766E]' : 'hover:bg-slate-50 text-[#1E293B]'
                }`}
              >
                <span className="text-[#0F766E] text-xs mt-0.5">📍</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-tight line-clamp-1">
                    {item.mainText || item.description}
                  </p>
                  {item.secondaryText && (
                    <p className="text-[11px] text-[#64748B] leading-tight line-clamp-1 mt-0.5">
                      {item.secondaryText}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

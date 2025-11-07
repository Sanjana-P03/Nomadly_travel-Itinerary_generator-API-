import React, { useState, useEffect } from 'react';
import { Search, MapPin, Globe, Map } from 'lucide-react';
import { PlacesService } from '../services/placesService';
import { PlacesSuggestion } from '../types';

interface DestinationSearchProps {
  onDestinationSelect: (placeId: string, name: string) => void;
  value: string;
  provider?: 'nominatim' | 'google';
  onProviderChange?: (provider: 'nominatim' | 'google') => void;
}

export function DestinationSearch({ 
  onDestinationSelect, 
  value, 
  provider,
  onProviderChange 
}: DestinationSearchProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<PlacesSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState<'nominatim' | 'google'>(
    provider || PlacesService.getProvider() as 'nominatim' | 'google' || 'nominatim'
  );

  const isGoogleAvailable = PlacesService.isGoogleAvailable();

  const handleProviderChange = (newProvider: 'nominatim' | 'google') => {
    if (newProvider === 'google' && !isGoogleAvailable) {
      return; 
    }
    setActiveProvider(newProvider);
    setSuggestions([]);
    if (onProviderChange) {
      onProviderChange(newProvider);
    }
  };

  useEffect(() => {
    if (provider) {
      setActiveProvider(provider);
    }
  }, [provider]);

  useEffect(() => {
    const searchPlaces = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const results = await PlacesService.searchPlaces(query, activeProvider);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error searching places:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchPlaces, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, activeProvider]);

  const handleSuggestionClick = (suggestion: PlacesSuggestion) => {
    setQuery(suggestion.structured_formatting.main_text);
    setShowSuggestions(false);
    onDestinationSelect(suggestion.place_id, suggestion.structured_formatting.main_text);
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Destination
        </label>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">Search via:</span>
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => handleProviderChange('nominatim')}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                activeProvider === 'nominatim'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="OpenStreetMap Nominatim (Free)"
            >
              <Map className="h-3 w-3" />
              <span>Nominatim</span>
            </button>
            <button
              type="button"
              onClick={() => handleProviderChange('google')}
              disabled={!isGoogleAvailable}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                activeProvider === 'google'
                  ? 'bg-white text-green-600 shadow-sm'
                  : isGoogleAvailable
                  ? 'text-gray-600 hover:text-gray-900'
                  : 'text-gray-400 cursor-not-allowed opacity-50'
              }`}
              title={isGoogleAvailable ? "Google Places API" : "Google Places API key not configured"}
            >
              <Globe className="h-3 w-3" />
              <span>Google</span>
            </button>
          </div>
        </div>
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(suggestions.length > 0)}
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Search for a destination..."
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg border border-gray-200 overflow-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {suggestion.structured_formatting.main_text}
                  </div>
                  <div className="text-sm text-gray-500">
                    {suggestion.structured_formatting.secondary_text}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {activeProvider === 'google' ? (
                    <Globe className="h-3 w-3" />
                  ) : (
                    <Map className="h-3 w-3" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
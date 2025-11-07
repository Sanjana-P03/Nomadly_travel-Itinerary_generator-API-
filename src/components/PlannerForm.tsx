import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Users } from 'lucide-react';
import { DestinationSearch } from './DestinationSearch';
import { CurrencyService } from '../services/currencyService';
import { PlacesService } from '../services/placesService';

interface PlannerFormProps {
  onSubmit: (data: {
    destinationId: string;
    destinationName: string;
    startDate: string;
    days: number;
    budget: number;
    currency: string;
    placesProvider?: 'nominatim' | 'google';
  }) => void;
  loading: boolean;
}

export function PlannerForm({ onSubmit, loading }: PlannerFormProps) {
  const [destinationId, setDestinationId] = useState('');
  const [destinationName, setDestinationName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState(1000);
  const [currency, setCurrency] = useState('USD');
  const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']);
  const [currenciesLoading, setCurrenciesLoading] = useState(true);
  const [placesProvider, setPlacesProvider] = useState<'nominatim' | 'google'>('nominatim');

  // Fetch supported currencies on component mount
  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        setCurrenciesLoading(true);
        const currencies = await CurrencyService.getSupportedCurrencies();
        setSupportedCurrencies(currencies);
      } catch (error) {
        console.error('Failed to load currencies:', error);
        // Keep default currencies if API fails
      } finally {
        setCurrenciesLoading(false);
      }
    };

    loadCurrencies();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationId || !startDate) return;

    onSubmit({
      destinationId,
      destinationName,
      startDate,
      days,
      budget,
      currency,
      placesProvider,
    });
  };

  const handleDestinationSelect = async (placeId: string, name: string) => {
    setDestinationId(placeId);
    setDestinationName(name);
    // Auto-detect currency based on destination address
    try {
      const details = await PlacesService.getPlaceDetails(placeId, placesProvider);
      const detected = CurrencyService.detectCurrencyFromAddress(details.formatted_address);
      if (detected && detected !== currency) {
        setCurrency(detected);
      }
    } catch (e) {
      // Ignore detection failures; keep current currency
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Plan Your Trip</h2>
        <p className="text-gray-600">
          Tell us about your travel preferences and we'll create a personalized itinerary
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <DestinationSearch
          onDestinationSelect={handleDestinationSelect}
          value={destinationName}
          provider={placesProvider}
          onProviderChange={setPlacesProvider}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Days
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((day) => (
                  <option key={day} value={day}>
                    {day} {day === 1 ? 'day' : 'days'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 font-medium">
                  {CurrencyService.getCurrencySymbol(currency)}
                </span>
              </div>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                min="100"
                step="50"
                className="block w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                placeholder="1000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={currenciesLoading}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currenciesLoading ? (
                <option value="USD">Loading currencies...</option>
              ) : (
                supportedCurrencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr} ({CurrencyService.getCurrencySymbol(curr)})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !destinationId || !startDate}
          className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white py-3 px-6 rounded-lg font-medium hover:from-pink-600 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Creating Your Itinerary...</span>
            </div>
          ) : (
            'Create Itinerary'
          )}
        </button>
      </form>
    </div>
  );
}

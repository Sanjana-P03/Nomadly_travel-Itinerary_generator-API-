import React from 'react';
import { Download, Save, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Itinerary } from '../types';
import { DayPlanCard } from './DayPlanCard';
import { CurrencyService } from '../services/currencyService';

interface ItineraryDisplayProps {
  itinerary: Itinerary;
  currencySymbol: string;
  onSave: () => void;
  onDownload: () => void;
  saving: boolean;
}

export function ItineraryDisplay({ 
  itinerary, 
  currencySymbol, 
  onSave, 
  onDownload, 
  saving 
}: ItineraryDisplayProps) {
  const totalCost = itinerary.day_plans.reduce((sum, day) => sum + day.total_cost, 0);
  
  const displayCurrencySymbol = currencySymbol || CurrencyService.getCurrencySymbol(itinerary.currency);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Your {itinerary.days}-Day Trip to {itinerary.destination.name}
            </h2>
            <div className="flex items-center space-x-6 text-gray-600">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>{itinerary.destination.formatted_address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(itinerary.start_date)} - {formatDate(itinerary.end_date)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Total: {displayCurrencySymbol}{totalCost.toFixed(2)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Budget: {displayCurrencySymbol}{itinerary.budget.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {itinerary.currency}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
            <button
              onClick={onDownload}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-orange-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-pink-600">{itinerary.days}</div>
              <div className="text-sm text-gray-600">Days</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-500">{displayCurrencySymbol}{totalCost.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Estimated Cost</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">{displayCurrencySymbol}{itinerary.budget.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Your Budget</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-rose-500">
                {itinerary.day_plans.reduce((sum, day) => sum + day.activities.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Activities</div>
            </div>
          </div>
        </div>
      </div>

      {/* Day Plans */}
      <div className="space-y-6">
        {itinerary.day_plans.map((dayPlan) => (
          <DayPlanCard
            key={dayPlan.day}
            dayPlan={dayPlan}
            currencySymbol={displayCurrencySymbol}
          />
        ))}
      </div>
    </div>
  );
}

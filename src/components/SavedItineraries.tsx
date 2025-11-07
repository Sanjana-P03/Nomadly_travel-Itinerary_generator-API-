import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, DollarSign, Trash2, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Itinerary } from '../types';
import { CurrencyService } from '../services/currencyService';

interface SavedItinerariesProps {
  onViewItinerary: (itinerary: Itinerary) => void;
}

export function SavedItineraries({ onViewItinerary }: SavedItinerariesProps) {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchItineraries();
    }
  }, [user]);

  const fetchItineraries = async () => {
    try {
      const { data, error } = await supabase
        .from('itineraries')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedItineraries: Itinerary[] = data.map(item => ({
        id: item.id,
        user_id: item.user_id,
        destination: {
          place_id: item.destination_name.toLowerCase().replace(' ', '_'),
          name: item.destination_name,
          formatted_address: item.destination_address,
          lat: item.destination_lat,
          lng: item.destination_lng
        },
        start_date: item.start_date,
        end_date: item.end_date,
        days: item.days,
        budget: item.budget,
        currency: item.currency,
        day_plans: item.day_plans,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setItineraries(formattedItineraries);
    } catch (error) {
      console.error('Error fetching itineraries:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteItinerary = async (id: string) => {
    try {
      const { error } = await supabase
        .from('itineraries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItineraries(itineraries.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting itinerary:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };


  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (itineraries.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved itineraries</h3>
        <p className="text-gray-600">Create your first travel plan to see it here!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Your Saved Itineraries</h3>
      
      <div className="space-y-4">
        {itineraries.map((itinerary) => {
          const totalCost = itinerary.day_plans.reduce((sum, day) => sum + day.total_cost, 0);
          const currencySymbol = CurrencyService.getCurrencySymbol(itinerary.currency);
          
          return (
            <div
              key={itinerary.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {itinerary.days}-Day Trip to {itinerary.destination.name}
                  </h4>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{itinerary.destination.formatted_address}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(itinerary.start_date)} - {formatDate(itinerary.end_date)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3" />
                      <span>{currencySymbol}{totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onViewItinerary(itinerary)}
                    className="p-2 bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400 text-white hover:from-pink-600 hover:via-rose-500 hover:to-orange-500 rounded-lg transition-all"
                    title="View itinerary"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteItinerary(itinerary.id)}
                    className="p-2 bg-gradient-to-r from-red-400 via-rose-400 to-pink-400 text-white hover:from-red-500 hover:via-rose-500 hover:to-pink-500 rounded-lg transition-all"
                    title="Delete itinerary"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

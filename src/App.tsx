import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { AuthForm } from './components/AuthForm';
import { PlannerForm } from './components/PlannerForm';
import { ItineraryDisplay } from './components/ItineraryDisplay';
import { SavedItineraries } from './components/SavedItineraries';
import { useAuth } from './hooks/useAuth';
import { PlacesService } from './services/placesService';
import { WeatherService } from './services/weatherService';
import { CurrencyService } from './services/currencyService';
import { ItineraryService } from './services/itineraryService';
import { supabase } from './lib/supabase';
import { Itinerary, Destination } from './types';

function App() {
  const { user, loading: authLoading } = useAuth();
  const [currentItinerary, setCurrentItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState('$');

  const handlePlanSubmit = async (data: {
    destinationId: string;
    destinationName: string;
    startDate: string;
    days: number;
    budget: number;
    currency: string;
    placesProvider?: 'nominatim' | 'google';
  }) => {
    setLoading(true);
    try {
      const destination = await PlacesService.getPlaceDetails(
        data.destinationId, 
        data.placesProvider
      );
      
      // Use the user-selected name instead of API response if available
      if (data.destinationName) {
        destination.name = data.destinationName;
      }
      
      // Get weather forecast
      const weatherForecasts = await WeatherService.getForecast(
        destination.lat,
        destination.lng,
        data.days
      );
      
      // Get currency rate and symbol
      const currencyRate = await CurrencyService.getExchangeRate('USD', data.currency);
      setCurrencySymbol(currencyRate.symbol);
      
      // Generate itinerary with currency conversion
      // Pass full destination object for dynamic activity generation
      // All activity costs will be converted from USD to selected currency
      const dayPlans = await ItineraryService.generateItinerary(
        destination,
        data.startDate,
        data.days,
        weatherForecasts,
        data.currency,
        data.placesProvider,
        data.budget
      );
      
      // Calculate end date
      const endDate = new Date(data.startDate);
      endDate.setDate(endDate.getDate() + data.days - 1);
      
      const itinerary: Itinerary = {
        id: crypto.randomUUID(),
        user_id: user?.id || '',
        destination,
        start_date: data.startDate,
        end_date: endDate.toISOString().split('T')[0],
        days: data.days,
        budget: data.budget,
        currency: data.currency,
        day_plans: dayPlans,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setCurrentItinerary(itinerary);
    } catch (error) {
      console.error('Error creating itinerary:', error);
      alert('Failed to create itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItinerary = async () => {
    if (!currentItinerary || !user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase.from('itineraries').insert({
        id: currentItinerary.id,
        user_id: user.id,
        user_email: user.email,
        destination_name: currentItinerary.destination.name,
        destination_address: currentItinerary.destination.formatted_address,
        destination_lat: currentItinerary.destination.lat,
        destination_lng: currentItinerary.destination.lng,
        start_date: currentItinerary.start_date,
        end_date: currentItinerary.end_date,
        days: currentItinerary.days,
        budget: currentItinerary.budget,
        currency: currentItinerary.currency,
        day_plans: currentItinerary.day_plans
      });
      
      if (error) throw error;
      
      alert('Itinerary saved successfully!');
    } catch (error) {
      console.error('Error saving itinerary:', error);
      alert('Failed to save itinerary. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!currentItinerary) return;
    
    // Create a simple text version for download
    const content = `
${currentItinerary.days}-Day Trip to ${currentItinerary.destination.name}
${currentItinerary.destination.formatted_address}
${new Date(currentItinerary.start_date).toLocaleDateString()} - ${new Date(currentItinerary.end_date).toLocaleDateString()}

${currentItinerary.day_plans.map(day => `
Day ${day.day} - ${new Date(day.date).toLocaleDateString()}
Weather: ${day.weather.description}, ${day.weather.temperature}°C

Activities:
${day.activities.map(activity => `- ${activity.name}: ${activity.description} (${activity.duration}h, ${currencySymbol}${activity.cost_estimate})`).join('\n')}

Total Cost: ${currencySymbol}${day.total_cost}
`).join('\n')}

Total Trip Cost: ${currencySymbol}${currentItinerary.day_plans.reduce((sum, day) => sum + day.total_cost, 0)}
    `.trim();
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentItinerary.destination.name}-itinerary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleViewItinerary = (itinerary: Itinerary) => {
    setCurrentItinerary(itinerary);
    // Set currency symbol directly from the itinerary's currency
    const symbol = CurrencyService.getCurrencySymbol(itinerary.currency);
    setCurrencySymbol(symbol);
  };

  const handleNewItinerary = () => {
    setCurrentItinerary(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <Layout>
      {currentItinerary ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Your Itinerary</h1>
            <button
            onClick={handleNewItinerary}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-lg hover:from-pink-600 hover:to-orange-500 transition-colors"
            >
            Plan New Trip
          </button>
          </div>
          <ItineraryDisplay
            itinerary={currentItinerary}
            currencySymbol={currencySymbol}
            onSave={handleSaveItinerary}
            onDownload={handleDownloadPDF}
            saving={saving}
          />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent mb-4">
            Plan Your Perfect Trip
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get personalized itineraries with real-time weather updates, local attractions, and budget planning
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PlannerForm onSubmit={handlePlanSubmit} loading={loading} />
            <SavedItineraries onViewItinerary={handleViewItinerary} />
          </div>
        </div>
      )}
    </Layout>
  );
}

export default App;

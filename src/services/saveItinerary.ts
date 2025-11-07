// src/services/saveItinerary.ts
import { supabase } from '../lib/supabase';
import { Itinerary } from '../types';

export async function saveItineraryToSupabase(itinerary: Itinerary, user: any) {
  if (!user) {
    console.error('No user logged in — cannot save itinerary.');
    return null;
  }

  const dest = itinerary.destination || {
    name: '',
    formatted_address: '',
    lat: 0,
    lng: 0
  };

  const row = {
    user_id: user.id,
    user_email: user.email,
    destination_name: dest.name,
    destination_address: dest.formatted_address,
    destination_lat: dest.lat,
    destination_lng: dest.lng,
    start_date: itinerary.start_date,
    end_date: itinerary.end_date,
    days: itinerary.days,
    budget: itinerary.budget,
    currency: itinerary.currency,
    day_plans: itinerary.day_plans
  };

  const { data, error } = await supabase
    .from('itineraries')
    .insert([row])
    .select('*')
    .single();

  if (error) {
    console.error('❌ Error saving itinerary to Supabase:', error);
    throw error;
  }

  console.log('✅ Itinerary saved to Supabase:', data);
  return data;
}

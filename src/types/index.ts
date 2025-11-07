export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

export interface Destination {
  place_id: string;
  name: string;
  formatted_address: string;
  lat: number;
  lng: number;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  wind_speed: number;
  icon: string;
}

export interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  symbol: string;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  category: 'sightseeing' | 'outdoor' | 'indoor' | 'cultural' | 'food' | 'shopping';
  duration: number; // in hours
  weather_dependent: boolean;
  cost_estimate: number;
}

export interface DayPlan {
  day: number;
  date: string;
  weather: WeatherData;
  activities: Activity[];
  total_cost: number;
  notes?: string;
}

export interface Itinerary {
  id: string;
  user_id: string;
  destination: Destination;
  start_date: string;
  end_date: string;
  days: number;
  budget: number;
  currency: string;
  day_plans: DayPlan[];
  created_at: string;
  updated_at: string;
}

export interface PlacesSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  lat?: number;
  lng?: number;
  provider?: 'nominatim' | 'google';
}
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      itineraries: {
        Row: {
          id: string;
          user_id: string;
          destination_name: string;
          destination_address: string;
          destination_lat: number;
          destination_lng: number;
          start_date: string;
          end_date: string;
          days: number;
          budget: number;
          currency: string;
          day_plans: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          destination_name: string;
          destination_address: string;
          destination_lat: number;
          destination_lng: number;
          start_date: string;
          end_date: string;
          days: number;
          budget: number;
          currency: string;
          day_plans: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          destination_name?: string;
          destination_address?: string;
          destination_lat?: number;
          destination_lng?: number;
          start_date?: string;
          end_date?: string;
          days?: number;
          budget?: number;
          currency?: string;
          day_plans?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
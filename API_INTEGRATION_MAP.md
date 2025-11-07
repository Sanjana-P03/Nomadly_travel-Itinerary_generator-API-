# API Integration Map - Nomadly Travel Planner

This document lists all API integrations and their locations in the codebase.

## 📍 API Integrations Overview

### 1. **Supabase Auth & Database API**
**Purpose:** User authentication and itinerary storage

**Location:** `src/lib/supabase.ts`
- Initializes Supabase client
- Used for authentication and database operations

**Files Using Supabase:**
- `src/hooks/useAuth.ts` - Authentication hook
- `src/components/AuthForm.tsx` - Login/signup forms
- `src/components/SavedItineraries.tsx` - Fetch saved itineraries
- `src/App.tsx` - Save itinerary to database (line 97-110)
- `src/services/saveItinerary.ts` - Save itinerary service

**Environment Variables:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

### 2. **Places API** (Nominatim/Google Places)
**Purpose:** Search destinations and fetch attractions

**Service File:** `src/services/placesService.ts`

**API Endpoints Used:**
1. **Nominatim (OpenStreetMap)** - Free, no API key required
   - Search: `https://nominatim.openstreetmap.org/search`
   - Lookup: `https://nominatim.openstreetmap.org/lookup`
   - Overpass API: `https://overpass-api.de/api/interpreter` (for attractions)

2. **Google Places API** - Requires API key
   - Autocomplete: `https://maps.googleapis.com/maps/api/place/autocomplete/json`
   - Details: `https://maps.googleapis.com/maps/api/place/details/json`
   - Nearby Search: `https://maps.googleapis.com/maps/api/place/nearbysearch/json`
   - Text Search: `https://maps.googleapis.com/maps/api/place/textsearch/json`

**Methods in placesService.ts:**
- `searchPlaces()` (line 228) - Autocomplete search
- `getPlaceDetails()` (line 383) - Get destination coordinates
- `getAttractions()` (line 465) - Fetch tourist attractions
- `fetchOSMAttractions()` (line 496) - Overpass API for Nominatim
- `fetchGoogleAttractions()` (line 562) - Google Places for attractions

**Files Using Places API:**
- `src/components/DestinationSearch.tsx` (line 55) - Search autocomplete
- `src/components/PlannerForm.tsx` (line 63) - Auto-detect currency from destination
- `src/App.tsx` (line 33-36) - Get destination details when creating itinerary
- `src/services/itineraryService.ts` (line 188) - Fetch attractions for itinerary

**Environment Variables:**
- `VITE_PLACES_API_PROVIDER` (nominatim/google)
- `VITE_PLACES_API_KEY` (for Google only)
- `VITE_USE_PLACES_API` (true/false)

---

### 3. **Weather API** (OpenWeatherMap + Open-Meteo)
**Purpose:** Get weather forecasts for itinerary days

**Service File:** `src/services/weatherService.ts`

**API Endpoints Used:**
1. **OpenWeatherMap** - Requires API key
   - Current: `https://api.openweathermap.org/data/2.5/weather`
   - Forecast: `https://api.openweathermap.org/data/2.5/forecast`

2. **Open-Meteo** - Free, no API key (preferred for 14-day forecasts)
   - Forecast: `https://api.open-meteo.com/v1/forecast`

**Methods in weatherService.ts:**
- `getCurrentWeather()` (line 84) - Current weather conditions
- `getForecast()` (line 150) - Multi-day forecast (up to 14 days)

**Files Using Weather API:**
- `src/App.tsx` (line 44-48) - Get weather forecast when creating itinerary
- `src/components/WeatherCard.tsx` - Display weather information

**Environment Variables:**
- `VITE_WEATHER_API_KEY` (OpenWeatherMap key)
- `VITE_USE_WEATHER_API` (true/false)
- `VITE_WEATHER_API_BASE` (optional, defaults to OpenWeatherMap)

---

### 4. **Currency Exchange API**
**Purpose:** Convert costs to user's selected currency

**Service File:** `src/services/currencyService.ts`

**API Endpoint Used:**
- Exchange Rate API: `https://api.exchangerate-api.com/v4/latest/{base}`

**Methods in currencyService.ts:**
- `getExchangeRate()` (line 84) - Get exchange rate between currencies
- `getSupportedCurrencies()` (line 137) - Get list of supported currencies
- `detectCurrencyFromAddress()` (line 187) - Auto-detect currency from destination address
- `convertAmount()` (line 170) - Convert amount between currencies
- `formatCurrency()` (line 182) - Format currency with symbol

**Files Using Currency API:**
- `src/components/PlannerForm.tsx` (line 35) - Load supported currencies
- `src/components/PlannerForm.tsx` (line 63) - Auto-detect currency from destination
- `src/App.tsx` (line 51-52) - Get exchange rate for itinerary
- `src/services/itineraryService.ts` (line 181) - Convert activity costs
- `src/components/ItineraryDisplay.tsx` (line 24) - Display currency symbol
- `src/components/SavedItineraries.tsx` - Display currency in saved list

**Environment Variables:**
- `VITE_CURRENCY_API_BASE` (optional, defaults to exchangerate-api.com)
- `VITE_CURRENCY_API_KEY` (optional)
- `VITE_USE_CURRENCY_API` (true/false)

---

## 📊 API Call Flow

### When User Creates Itinerary:
1. **User selects destination** → `PlacesService.searchPlaces()` → `PlacesService.getPlaceDetails()`
2. **Auto-detect currency** → `CurrencyService.detectCurrencyFromAddress()` (from destination address)
3. **Get weather forecast** → `WeatherService.getForecast()` (for selected dates)
4. **Get exchange rate** → `CurrencyService.getExchangeRate()` (USD to selected currency)
5. **Fetch attractions** → `PlacesService.getAttractions()` (near destination coordinates)
6. **Generate itinerary** → `ItineraryService.generateItinerary()` (combines all data)
7. **User clicks Save** → `supabase.from('itineraries').insert()` (save to database)

---

## 🔑 Required Environment Variables

Create a `.env` file in the project root with:

```env
# Supabase (Required)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Places (Optional - Nominatim works without key)
VITE_PLACES_API_PROVIDER=nominatim
# VITE_PLACES_API_KEY=your_google_places_key (if using Google)

# Weather (Optional - Open-Meteo works without key)
VITE_USE_WEATHER_API=true
VITE_WEATHER_API_KEY=your_openweather_key (optional)

# Currency (Optional - exchangerate-api.com works without key)
VITE_USE_CURRENCY_API=true
VITE_CURRENCY_API_KEY= (optional)
```

---

## 📝 Notes

- **Nominatim** (OpenStreetMap) is free and doesn't require an API key
- **Open-Meteo** is free and provides 14-day forecasts without API key
- **Exchange Rate API** is free tier without API key
- All APIs have fallback mock data if API calls fail
- Google Places API requires billing setup but has free tier



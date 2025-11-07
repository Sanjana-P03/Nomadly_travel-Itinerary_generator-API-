import { WeatherData } from '../types';

// Weather API configuration
const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY || '';
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const USE_WEATHER_API = import.meta.env.VITE_USE_WEATHER_API !== 'false'; // Default to true if key exists

// Cache for weather data to reduce API calls
interface WeatherCache {
  data: WeatherData;
  lat: number;
  lng: number;
  timestamp: number;
}

interface ForecastCache {
  data: WeatherData[];
  lat: number;
  lng: number;
  days: number;
  timestamp: number;
}

let currentWeatherCache: WeatherCache | null = null;
let forecastCache: ForecastCache | null = null;
const CACHE_DURATION = 10 * 60 * 1000;


const mapWeatherCondition = (weatherMain: string, weatherId: number): string => {
  if (weatherId >= 200 && weatherId < 300) return 'Storm';
  if (weatherId >= 300 && weatherId < 400) return 'Drizzle';
  if (weatherId >= 500 && weatherId < 600) return 'Rain';
  if (weatherId >= 600 && weatherId < 700) return 'Snow';
  if (weatherId >= 700 && weatherId < 800) return 'Mist';
  if (weatherId === 800) return 'Clear';
  if (weatherId >= 801 && weatherId < 805) return 'Clouds';
  return weatherMain;
};

const getMockWeather = (lat: number, lng: number, dayOffset: number = 0): WeatherData => {
  const mockWeatherConditions = [
    { condition: 'Clear', description: 'Clear sky', icon: '01d', temp: 25 },
    { condition: 'Clouds', description: 'Few clouds', icon: '02d', temp: 22 },
    { condition: 'Clouds', description: 'Partly cloudy', icon: '03d', temp: 20 },
    { condition: 'Clouds', description: 'Overcast', icon: '04d', temp: 19 },
    { condition: 'Rain', description: 'Light rain', icon: '10d', temp: 18 },
    { condition: 'Rain', description: 'Moderate rain', icon: '10d', temp: 16 },
    { condition: 'Drizzle', description: 'Drizzle', icon: '09d', temp: 17 },
    { condition: 'Storm', description: 'Thunderstorm', icon: '11d', temp: 15 },
    { condition: 'Mist', description: 'Misty', icon: '50d', temp: 21 },
    { condition: 'Clear', description: 'Sunny', icon: '01d', temp: 28 }
  ];
  
  
  const locationSeed = Math.floor((Math.abs(lat) + Math.abs(lng)) * 1000);
  const daySeed = dayOffset * 13; 
  const timeSeed = Math.floor(Date.now() / (1000 * 60 * 60)) % 24; 
  const combinedSeed = (locationSeed + daySeed + timeSeed) % mockWeatherConditions.length;
  

  const weatherIndex = combinedSeed < 0 ? Math.abs(combinedSeed) : combinedSeed;
  const randomWeather = mockWeatherConditions[weatherIndex] || mockWeatherConditions[0];
  
 
  const tempVariation = Math.sin(dayOffset * 0.3) * 5 + Math.cos(locationSeed * 0.01) * 3;
  const baseTemp = randomWeather.temp + Math.floor(tempVariation);
  
  return {
    temperature: Math.max(10, Math.min(35, baseTemp)), // Clamp between 10-35°C
    condition: randomWeather.condition,
    description: randomWeather.description,
    humidity: Math.floor((Math.sin(daySeed * 0.5) * 15) + 55) % 80 + 30, // 30-80%
    wind_speed: Math.floor((Math.sin(daySeed * 0.7) * 8) + 12), // 4-20 km/h
    icon: randomWeather.icon
  };
};

export class WeatherService {
  /**
   * Fetches current weather from OpenWeatherMap API
   */
  static async getCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
    try {
      // Check cache first
      if (currentWeatherCache && 
          currentWeatherCache.lat === lat && 
          currentWeatherCache.lng === lng &&
          Date.now() - currentWeatherCache.timestamp < CACHE_DURATION) {
        return currentWeatherCache.data;
      }

      // If no API key or API is disabled, use mock data
      if (!USE_WEATHER_API || !WEATHER_API_KEY) {
        // Use current date as day offset for some variety
        const dayOffset = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % 10;
        const mockData = getMockWeather(lat, lng, dayOffset);
        currentWeatherCache = {
          data: mockData,
          lat,
          lng,
          timestamp: Date.now()
        };
        return mockData;
      }

      // Fetch from OpenWeatherMap API
      const response = await fetch(
        `${WEATHER_BASE_URL}/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API returned ${response.status}`);
      }

      const data = await response.json();

      // Map API response to our WeatherData format
      const weatherData: WeatherData = {
        temperature: Math.round(data.main.temp),
        condition: mapWeatherCondition(data.weather[0].main, data.weather[0].id),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        wind_speed: Math.round(data.wind?.speed * 3.6 || 0), // Convert m/s to km/h
        icon: data.weather[0].icon
      };

      // Update cache
      currentWeatherCache = {
        data: weatherData,
        lat,
        lng,
        timestamp: Date.now()
      };

      return weatherData;
    } catch (error) {
      console.warn('Weather API error, using fallback:', error);
      // Return mock data as fallback with day offset for variety
      const dayOffset = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % 10;
      const mockData = getMockWeather(lat, lng, dayOffset);
      return mockData;
    }
  }

  /**
   * Fetches weather forecast for multiple days
   */
  static async getForecast(lat: number, lng: number, days: number): Promise<WeatherData[]> {
    try {
      // Cap at 14 days as requested
      const requestedDays = Math.min(Math.max(days, 1), 14);

      // Prefer Open-Meteo for up to 14-day daily forecast (no API key)
      try {
        const url = `${OPEN_METEO_BASE_URL}?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,weathercode,windspeed_10m_max,precipitation_sum&timezone=auto&forecast_days=${requestedDays}`;
        const resp = await fetch(url);
        if (resp.ok) {
          const data = await resp.json();
          const result: WeatherData[] = [];
          const len = Math.min(requestedDays, (data?.daily?.time || []).length);
          for (let i = 0; i < len; i++) {
            const tmax = data.daily.temperature_2m_max[i];
            const tmin = data.daily.temperature_2m_min[i];
            const code = data.daily.weathercode[i];
            const wind = data.daily.windspeed_10m_max[i];
            const avg = Math.round(((tmax + tmin) / 2));
            result.push({
              temperature: avg,
              condition: mapOpenMeteoCode(code),
              description: describeOpenMeteoCode(code),
              humidity: 55, // Open-Meteo daily endpoint doesn't include humidity; use neutral value
              wind_speed: Math.round(wind || 0),
              icon: openMeteoIcon(code)
            });
          }
          // If fewer days returned than requested, extend using last day's variation
          while (result.length < requestedDays) {
            const last = result[result.length - 1];
            result.push({ ...last, temperature: last.temperature + ((result.length % 2 === 0) ? 1 : -1) });
          }
          // If caller asked more than 14 days, extend by repeating pattern
          while (result.length < days) {
            const idx = (result.length) % requestedDays;
            result.push(result[idx]);
          }
          // Cache and return
          forecastCache = { data: result, lat, lng, days: result.length, timestamp: Date.now() };
          return result.slice(0, days);
        }
      } catch (e) {
        // ignore and fall back to OWM logic below
      }
      // Check cache first
      if (forecastCache &&
          forecastCache.lat === lat &&
          forecastCache.lng === lng &&
          forecastCache.days === days &&
          Date.now() - forecastCache.timestamp < CACHE_DURATION) {
        return forecastCache.data;
      }

      // If no API key or API is disabled, generate mock forecast
      if (!USE_WEATHER_API || !WEATHER_API_KEY) {
        const forecasts: WeatherData[] = [];
        for (let i = 0; i < days; i++) {
          // Pass day index to get different weather for each day
          const dayWeather = getMockWeather(lat, lng, i);
          forecasts.push(dayWeather);
        }
        forecastCache = {
          data: forecasts,
          lat,
          lng,
          days,
          timestamp: Date.now()
        };
        return forecasts;
      }

      // Fetch 5-day forecast from OpenWeatherMap API
      // OpenWeatherMap provides 3-hour intervals for 5 days
      const response = await fetch(
        `${WEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Forecast API returned ${response.status}`);
      }

      const data = await response.json();
      const forecasts: WeatherData[] = [];

      // OpenWeatherMap returns forecasts in 3-hour intervals
      // Group by day and take the forecast closest to noon (12:00) for each day
      const dailyForecasts: { [key: string]: any } = {};

      data.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const hour = date.getHours();

        // Prefer forecasts around noon (12:00), but accept any if not available
        if (!dailyForecasts[dateKey] || Math.abs(hour - 12) < Math.abs(new Date(dailyForecasts[dateKey].dt * 1000).getHours() - 12)) {
          dailyForecasts[dateKey] = item;
        }
      });

      // Convert to WeatherData format and limit to requested number of days
      const sortedDates = Object.keys(dailyForecasts).sort().slice(0, Math.min(days, 7));
      
      sortedDates.forEach((dateKey) => {
        const item = dailyForecasts[dateKey];
        forecasts.push({
          temperature: Math.round(item.main.temp),
          condition: mapWeatherCondition(item.weather[0].main, item.weather[0].id),
          description: item.weather[0].description,
          humidity: item.main.humidity,
          wind_speed: Math.round(item.wind?.speed * 3.6 || 0), // Convert m/s to km/h
          icon: item.weather[0].icon
        });
      });

      // If we don't have enough days from the forecast, fill up to requested days (max 14) with variations
      while (forecasts.length < Math.min(days, 14)) {
        const lastForecast = forecasts[forecasts.length - 1] || await this.getCurrentWeather(lat, lng);
        forecasts.push({
          ...lastForecast,
          temperature: lastForecast.temperature + Math.round(Math.sin(forecasts.length) * 3)
        });
      }
      // If caller asked for more than 14 days, repeat pattern
      while (forecasts.length < days) {
        forecasts.push(forecasts[forecasts.length % 14]);
      }

      // Update cache
      forecastCache = {
        data: forecasts,
        lat,
        lng,
        days,
        timestamp: Date.now()
      };

      return forecasts;
    } catch (error) {
      console.warn('Forecast API error, using fallback:', error);
      // Generate mock forecast as fallback with varied weather per day
      const forecasts: WeatherData[] = [];
      for (let i = 0; i < days; i++) {
        // Each day gets different weather
        const dayWeather = getMockWeather(lat, lng, i);
        forecasts.push(dayWeather);
      }
      return forecasts;
    }
  }

  /**
   * Clears the weather cache (useful for testing or forcing refresh)
   */
  static clearCache(): void {
    currentWeatherCache = null;
    forecastCache = null;
  }
}

// --- Open-Meteo helpers ---
function mapOpenMeteoCode(code: number): string {
  // https://open-meteo.com/en/docs#weathervariables
  if ([0].includes(code)) return 'Clear';
  if ([1,2,3].includes(code)) return 'Clouds';
  if ([45,48].includes(code)) return 'Mist';
  if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) return 'Rain';
  if ([71,73,75,77,85,86].includes(code)) return 'Snow';
  if ([95,96,99].includes(code)) return 'Storm';
  return 'Clouds';
}

function describeOpenMeteoCode(code: number): string {
  const map: Record<number, string> = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    56: 'Freezing drizzle', 57: 'Dense freezing drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    66: 'Freezing rain', 67: 'Heavy freezing rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
    77: 'Snow grains', 80: 'Rain showers', 81: 'Heavy rain showers', 82: 'Violent rain showers',
    85: 'Snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail'
  };
  return map[code] || 'Cloudy';
}

function openMeteoIcon(code: number): string {
  if (code === 0) return '01d';
  if ([1,2,3].includes(code)) return '02d';
  if ([45,48].includes(code)) return '50d';
  if ([61,63,65,80,81,82].includes(code)) return '10d';
  if ([71,73,75,85,86].includes(code)) return '13d';
  if ([95,96,99].includes(code)) return '11d';
  return '03d';
}
import React, { useState } from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets, Zap } from 'lucide-react';
import { WeatherData } from '../types';

interface WeatherCardProps {
  weather: WeatherData;
  date: string;
}

export function WeatherCard({ weather, date }: WeatherCardProps) {
  const [iconLoadError, setIconLoadError] = useState(false);

  // Get local icon based on condition
  const getLocalIcon = () => {
    const condition = weather.condition.toLowerCase();
    switch (condition) {
      case 'clear':
      case 'sunny':
        return <Sun className="h-8 w-8 text-yellow-400" />;
      case 'rain':
      case 'drizzle':
        return <CloudRain className="h-8 w-8 text-blue-500" />;
      case 'storm':
      case 'thunderstorm':
        return <Zap className="h-8 w-8 text-purple-500" />;
      case 'clouds':
      case 'cloudy':
        return <Cloud className="h-8 w-8 text-gray-500" />;
      case 'mist':
      case 'fog':
        return <Cloud className="h-8 w-8 text-gray-400" />;
      default:
        return <Sun className="h-8 w-8 text-yellow-400" />;
    }
  };

  // Render weather icon - use OpenWeatherMap icon if available, otherwise local icon
  const renderWeatherIcon = () => {
    // Use OpenWeatherMap icon if available and hasn't failed to load
    if (weather.icon && weather.icon.startsWith('0') && !iconLoadError) {
      return (
        <img 
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
          alt={weather.description}
          className="h-12 w-12"
          onError={() => setIconLoadError(true)}
        />
      );
    }

    // Fallback to local icon
    return getLocalIcon();
  };

  const formatDate = (dateString: string) => {
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 rounded-lg p-4 border border-pink-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-pink-800">
          {formatDate(date)}
        </div>
        <div className="relative">
          {renderWeatherIcon()}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-pink-900">
            {Math.round(weather.temperature)}°C
          </span>
          <span className="text-sm text-pink-700 capitalize">
            {weather.description}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-xs text-pink-600">
          <div className="flex items-center space-x-1">
            <Droplets className="h-3 w-3" />
            <span>{weather.humidity}%</span>
          </div>
          <div className="flex items-center space-x-1">
            <Wind className="h-3 w-3" />
            <span>{weather.wind_speed} km/h</span>
          </div>
        </div>
      </div>
    </div>
  );
}

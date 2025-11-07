import { Clock, DollarSign, MapPin, Camera, Utensils, ShoppingBag, Building } from 'lucide-react';
import { Activity } from '../types';

interface ActivityCardProps {
  activity: Activity;
  currencySymbol: string;
}

export function ActivityCard({ activity, currencySymbol }: ActivityCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sightseeing':
        return <Camera className="h-4 w-4" />;
      case 'food':
        return <Utensils className="h-4 w-4" />;
      case 'shopping':
        return <ShoppingBag className="h-4 w-4" />;
      case 'cultural':
        return <Building className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sightseeing':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'food':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'shopping':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'cultural':
        return 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200';
      case 'outdoor':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'indoor':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-pink-100 text-pink-700 border-pink-200';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{activity.name}</h4>
          <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
        </div>
        <div
          className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(
            activity.category
          )}`}
        >
          {getCategoryIcon(activity.category)}
          <span className="capitalize">{activity.category}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{activity.duration}h</span>
          </div>
          <div className="flex items-center space-x-1">
            <DollarSign className="h-4 w-4" />
            <span>
              {currencySymbol}
              {activity.cost_estimate.toFixed(2)}
            </span>
          </div>
        </div>
        {activity.weather_dependent && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
            Weather dependent
          </span>
        )}
      </div>
    </div>
  );
}

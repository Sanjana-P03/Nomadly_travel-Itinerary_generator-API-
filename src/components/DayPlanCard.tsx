import React from 'react';
import { DayPlan } from '../types';
import { WeatherCard } from './WeatherCard';
import { ActivityCard } from './ActivityCard';
import { DollarSign } from 'lucide-react';

interface DayPlanCardProps {
  dayPlan: DayPlan;
  currencySymbol: string;
}

export function DayPlanCard({ dayPlan, currencySymbol }: DayPlanCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header with new gradient */}
      <div className="bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">
            Day {dayPlan.day}
          </h3>
          <div className="flex items-center space-x-2 text-white">
            <DollarSign className="h-4 w-4" />
            <span className="font-semibold">
              {currencySymbol}{dayPlan.total_cost.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-6">
          <WeatherCard weather={dayPlan.weather} date={dayPlan.date} />
        </div>
        
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 mb-3">Planned Activities</h4>
          {dayPlan.activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              currencySymbol={currencySymbol}
            />
          ))}
        </div>
        
        {dayPlan.notes && (
          <div className="mt-4 p-3 bg-pink-50 rounded-lg">
            <p className="text-sm text-gray-600">{dayPlan.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

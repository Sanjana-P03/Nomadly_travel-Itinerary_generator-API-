import React from 'react';
import { Flower, MapPin, Cloud, DollarSign, Calendar, Sparkles, ArrowRight, LogIn, UserPlus } from 'lucide-react';

interface LandingPageProps {
  onSignUp: () => void;
  onSignIn: () => void;
}

export function LandingPage({ onSignUp, onSignIn }: LandingPageProps) {
  const features = [
    {
      icon: MapPin,
      title: 'Smart Destination Search',
      description: 'Find the perfect destination with intelligent place suggestions'
    },
    {
      icon: Calendar,
      title: 'Personalized Itineraries',
      description: 'Get custom day-by-day plans tailored to your preferences'
    },
    {
      icon: Cloud,
      title: 'Real-Time Weather',
      description: 'Plan ahead with accurate weather forecasts for your trip'
    },
    {
      icon: DollarSign,
      title: 'Budget Planning',
      description: 'Track expenses and manage your travel budget effortlessly'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-rose-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="px-4 sm:px-6 lg:px-8 pt-8">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400 p-2 rounded-lg flex items-center justify-center shadow-lg">
                <Flower className="h-6 w-6 text-yellow-400" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400 bg-clip-text text-transparent">
                Nomadly
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onSignIn}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </button>
              <button
                onClick={onSignUp}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400 text-white rounded-lg hover:from-pink-600 hover:to-orange-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <UserPlus className="h-4 w-4" />
                <span>Sign Up</span>
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          <div className="text-center mb-16">
            {/* App Icon/Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400 rounded-2xl blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400 p-6 rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <Flower className="h-16 w-16 text-yellow-400" />
                  <Sparkles className="h-6 w-6 text-white absolute -top-2 -right-2 animate-pulse" />
                </div>
              </div>
            </div>

            {/* App Name */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400 bg-clip-text text-transparent">
                Nomadly
              </span>
            </h1>

            {/* Tagline */}
            <p className="text-xl md:text-2xl text-gray-600 mb-4 font-medium">
              Your Intelligent Travel Companion
            </p>

            {/* Description */}
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              Plan your perfect trip with personalized itineraries, real-time weather updates, 
              local attractions, and smart budget planning. Let Nomadly turn your travel dreams into reality.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
              <button
                onClick={onSignUp}
                className="group flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400 text-white text-lg font-semibold rounded-xl hover:from-pink-600 hover:to-orange-500 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 w-full sm:w-auto"
              >
                <UserPlus className="h-5 w-5" />
                <span>Get Started Free</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onSignIn}
                className="flex items-center space-x-3 px-8 py-4 bg-white text-gray-700 text-lg font-semibold rounded-xl border-2 border-gray-200 hover:border-pink-300 hover:text-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full sm:w-auto"
              >
                <LogIn className="h-5 w-5" />
                <span>Sign In</span>
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                >
                  <div className="bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400 p-3 rounded-lg w-fit mb-4">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>

          {/* Additional Info Section */}
          <div className="mt-20 text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100 max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Start Planning Your Next Adventure
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Join thousands of travelers who trust Nomadly to plan their perfect trips. 
                Create detailed itineraries, discover hidden gems, and stay within your budget.
              </p>
              <button
                onClick={onSignUp}
                className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400 text-white text-lg font-semibold rounded-xl hover:from-pink-600 hover:to-orange-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <span>Create Your First Itinerary</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}


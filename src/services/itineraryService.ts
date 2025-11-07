import { Activity, DayPlan, WeatherData, Destination } from '../types';
import { CurrencyService } from './currencyService';

import { PlacesService } from './placesService';

export class ItineraryService {
 
  static generateActivities(weather: WeatherData, destination: string | Destination): Activity[] {
    const destName = typeof destination === 'string' ? destination : destination.name;
    const destAddress = typeof destination === 'string' ? '' : destination.formatted_address;
    const addressParts = destAddress.split(',').map(p => p.trim());

    let city = destName;
    for (const part of addressParts) {
      if (part && !part.match(/^\d+$/) && !part.match(/^\d+[a-z]*\s*/i)) {
        city = part;
        break;
      }
    }
    if (!city || city.match(/^\d+$/)) city = destName;

    const country = addressParts[addressParts.length - 1] || '';
    const isCapital = this.isLikelyCapital(city);
    const isCoastal = this.isLikelyCoastal(destAddress);
    const isMountainous = this.isLikelyMountainous(destAddress);
    const continent = this.detectContinent(destAddress, country);

    const allActivities: Record<string, Activity[]> = {
      'Paris': [
        { id: '1', name: 'Visit Eiffel Tower', description: 'Iconic iron lattice tower and symbol of Paris', category: 'sightseeing', duration: 3, weather_dependent: true, cost_estimate: 25 },
        { id: '2', name: 'Louvre Museum', description: 'World\'s largest art museum', category: 'cultural', duration: 4, weather_dependent: false, cost_estimate: 17 },
        { id: '3', name: 'Seine River Cruise', description: 'Scenic boat tour along the Seine', category: 'sightseeing', duration: 2, weather_dependent: true, cost_estimate: 15 },
        { id: '4', name: 'Montmartre District', description: 'Historic hilltop district with Sacré-Cœur', category: 'cultural', duration: 3, weather_dependent: true, cost_estimate: 10 }
      ],
      'Tokyo': [
        { id: '5', name: 'Senso-ji Temple', description: 'Ancient Buddhist temple in Asakusa', category: 'cultural', duration: 2, weather_dependent: false, cost_estimate: 0 },
        { id: '6', name: 'Tokyo Skytree', description: 'Tallest structure in Japan with panoramic views', category: 'sightseeing', duration: 2, weather_dependent: false, cost_estimate: 20 },
        { id: '7', name: 'Shibuya Crossing', description: 'World\'s busiest pedestrian crossing', category: 'sightseeing', duration: 1, weather_dependent: true, cost_estimate: 0 },
        { id: '8', name: 'Tsukiji Outer Market', description: 'Famous fish market and food stalls', category: 'food', duration: 3, weather_dependent: false, cost_estimate: 30 }
      ]
    };

    const defaultActivities: Activity[] = [
      { id: 'default1', name: 'City Walking Tour', description: 'Explore the main attractions on foot', category: 'sightseeing', duration: 3, weather_dependent: true, cost_estimate: 20 },
      { id: 'default2', name: 'Local Museum Visit', description: 'Discover local history and culture', category: 'cultural', duration: 2, weather_dependent: false, cost_estimate: 15 },
      { id: 'default3', name: 'Shopping District', description: 'Browse local shops and markets', category: 'shopping', duration: 2, weather_dependent: false, cost_estimate: 50 },
      { id: 'default4', name: 'Local Cuisine Experience', description: 'Try authentic local dishes', category: 'food', duration: 2, weather_dependent: false, cost_estimate: 40 }
    ];

    let destinationActivities = allActivities[destName] ||
      allActivities[city] ||
      Object.keys(allActivities).find(key =>
        destName.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(destName.toLowerCase())
      )
      ? allActivities[Object.keys(allActivities).find(key =>
        destName.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(destName.toLowerCase())
      )!]
      : null;

    if (!destinationActivities) {
      destinationActivities = this.generateDynamicActivities(destName, city, country, continent, isCapital, isCoastal, isMountainous);
    }

    let suitableActivities = destinationActivities;
    if (weather.condition === 'Rain' || weather.condition === 'Storm') {
      suitableActivities = destinationActivities.filter(activity => !activity.weather_dependent);
    }

    if (suitableActivities.length < 3) {
      suitableActivities = [...suitableActivities, ...defaultActivities].slice(0, 4);
    }

    return this.shuffleActivities(suitableActivities).slice(0, Math.min(4, suitableActivities.length));
  }

  private static generateDynamicActivities(name: string, city: string, country: string, continent: string, isCapital: boolean, isCoastal: boolean, isMountainous: boolean): Activity[] {
    const activities: Activity[] = [];
    let idCounter = 1000;
    const displayName = name && !name.match(/^\d+$/) ? name : (city && !city.match(/^\d+$/) ? city : 'the city');

    if (isCapital) {
      activities.push({ id: `dynamic_${idCounter++}`, name: 'Government District & Historical Sites', description: `Explore ${displayName}'s historic center and government buildings`, category: 'cultural', duration: 3, weather_dependent: false, cost_estimate: 15 });
      activities.push({ id: `dynamic_${idCounter++}`, name: 'National Museum', description: `Visit the national museum to learn about ${country || displayName}'s history`, category: 'cultural', duration: 3, weather_dependent: false, cost_estimate: 20 });
    }

    if (isCoastal) {
      activities.push({ id: `dynamic_${idCounter++}`, name: 'Beach & Waterfront', description: `Enjoy ${displayName}'s beautiful beaches and waterfront area`, category: 'outdoor', duration: 4, weather_dependent: true, cost_estimate: 10 });
      activities.push({ id: `dynamic_${idCounter++}`, name: 'Seafood & Local Cuisine', description: `Taste fresh seafood and local specialties in ${displayName}`, category: 'food', duration: 2, weather_dependent: false, cost_estimate: 45 });
    }

    if (isMountainous) {
      activities.push({ id: `dynamic_${idCounter++}`, name: 'Scenic Viewpoints', description: `Take in panoramic views from ${displayName}'s scenic overlooks`, category: 'outdoor', duration: 3, weather_dependent: true, cost_estimate: 5 });
    }

    if (continent === 'Europe') {
      activities.push({ id: `dynamic_${idCounter++}`, name: 'Historic Old Town', description: `Walk through ${displayName}'s charming historic district`, category: 'sightseeing', duration: 2, weather_dependent: true, cost_estimate: 0 });
      activities.push({ id: `dynamic_${idCounter++}`, name: 'Local Markets & Cafés', description: `Experience ${displayName}'s café culture and local markets`, category: 'food', duration: 2, weather_dependent: false, cost_estimate: 35 });
    } else if (continent === 'Asia') {
      activities.push({ id: `dynamic_${idCounter++}`, name: 'Temple & Shrine Visit', description: `Explore ${displayName}'s historic temples and religious sites`, category: 'cultural', duration: 2, weather_dependent: false, cost_estimate: 5 });
      activities.push({ id: `dynamic_${idCounter++}`, name: 'Street Food Tour', description: `Discover ${displayName}'s vibrant street food scene`, category: 'food', duration: 3, weather_dependent: false, cost_estimate: 30 });
    } else if (continent === 'Americas') {
      activities.push({ id: `dynamic_${idCounter++}`, name: 'City Center Exploration', description: `Discover ${displayName}'s downtown area and main attractions`, category: 'sightseeing', duration: 3, weather_dependent: true, cost_estimate: 10 });
    }

    activities.push({ id: `dynamic_${idCounter++}`, name: 'City Walking Tour', description: `Explore ${displayName}'s main attractions on a guided walking tour`, category: 'sightseeing', duration: 3, weather_dependent: true, cost_estimate: 25 });
    activities.push({ id: `dynamic_${idCounter++}`, name: 'Local Shopping & Markets', description: `Browse ${displayName}'s shops and local markets for souvenirs`, category: 'shopping', duration: 2, weather_dependent: false, cost_estimate: 50 });
    activities.push({ id: `dynamic_${idCounter++}`, name: 'Authentic Dining Experience', description: `Enjoy traditional cuisine at a local restaurant in ${displayName}`, category: 'food', duration: 2, weather_dependent: false, cost_estimate: 40 });
    activities.push({ id: `dynamic_${idCounter++}`, name: 'Cultural Center or Museum', description: `Learn about ${displayName}'s culture and heritage`, category: 'cultural', duration: 2, weather_dependent: false, cost_estimate: 18 });

    return activities;
  }

  private static isLikelyCapital(city: string): boolean {
    const capitals = ['paris','london','tokyo','berlin','rome','madrid','amsterdam','vienna','athens','lisbon','stockholm','copenhagen','oslo','washington','ottawa','canberra','wellington','pretoria','nairobi','cairo','new delhi','jakarta','bangkok','seoul','beijing','moscow','kiev','warsaw','prague','budapest'];
    const lowerCity = city.toLowerCase();
    return capitals.some(cap => lowerCity.includes(cap) || cap.includes(lowerCity));
  }

  private static isLikelyCoastal(address: string): boolean {
    const coastalKeywords = ['beach','coast','seaside','seashore','ocean','bay','harbor','harbour','port','marina','riviera','shore'];
    const lowerAddress = address.toLowerCase();
    return coastalKeywords.some(keyword => lowerAddress.includes(keyword));
  }

  private static isLikelyMountainous(address: string): boolean {
    const mountainKeywords = ['mountain','alps','himalaya','hill','peak','valley','plateau','highland','ridge','summit'];
    const lowerAddress = address.toLowerCase();
    return mountainKeywords.some(keyword => lowerAddress.includes(keyword));
  }

  private static detectContinent(address: string, country: string): string {
    const lowerAddress = address.toLowerCase();
    const lowerCountry = country.toLowerCase();
    const europe = ['france','germany','italy','spain','uk','united kingdom','netherlands','belgium','portugal','greece','austria','switzerland','poland','sweden','norway','denmark','finland','ireland','czech','hungary','romania','croatia'];
    const asia = ['japan','china','india','thailand','singapore','malaysia','indonesia','philippines','vietnam','south korea','taiwan','hong kong','bangladesh','sri lanka'];
    const americas = ['usa','united states','canada','mexico','brazil','argentina','chile','colombia','peru','venezuela','costa rica'];
    const africa = ['south africa','egypt','kenya','morocco','tanzania','ghana'];
    const oceania = ['australia','new zealand','fiji'];

    if (europe.some(c => lowerCountry.includes(c) || lowerAddress.includes(c))) return 'Europe';
    if (asia.some(c => lowerCountry.includes(c) || lowerAddress.includes(c))) return 'Asia';
    if (americas.some(c => lowerCountry.includes(c) || lowerAddress.includes(c))) return 'Americas';
    if (africa.some(c => lowerCountry.includes(c) || lowerAddress.includes(c))) return 'Africa';
    if (oceania.some(c => lowerCountry.includes(c) || lowerAddress.includes(c))) return 'Oceania';
    return 'Unknown';
  }

  private static shuffleActivities(activities: Activity[]): Activity[] {
    const shuffled = [...activities];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static generateDayPlan(day: number, date: string, weather: WeatherData, destination: string | Destination, _currency: string, exchangeRate: number = 1, activitiesInput?: Activity[]): DayPlan {
    const activities = (activitiesInput && activitiesInput.length > 0) ? activitiesInput : this.generateActivities(weather, destination);
    const destName = typeof destination === 'string' ? destination : destination.name;
    // Convert then apply a global affordability scale
    const scale = 0.6; // reduce costs by 40%
    const convertedActivities = activities.map(a => ({
      ...a,
      cost_estimate: Math.round(a.cost_estimate * exchangeRate * scale * 100) / 100
    }));
    const totalCost = convertedActivities.reduce((sum, a) => sum + a.cost_estimate, 0);

    return {
      day,
      date,
      weather,
      activities: convertedActivities,
      total_cost: Math.round(totalCost * 100) / 100,
      notes: `Day ${day} in ${destName} - ${weather.description}`
    };
  }

  static async generateItinerary(destination: string | Destination, startDate: string, days: number, weatherForecasts: WeatherData[], currency: string, placesProvider?: 'nominatim' | 'google', budget?: number): Promise<DayPlan[]> {
    const dayPlans: DayPlan[] = [];
    const start = new Date(startDate);
    const currencyRate = await CurrencyService.getExchangeRate('USD', currency);
    const exchangeRate = currencyRate.rate;

    // Fetch attractions from Places API if we have full destination details
    let attractionActivities: Activity[] = [];
    if (typeof destination !== 'string') {
      try {
        const places = await PlacesService.getAttractions(destination, placesProvider, Math.max(12, days * 4));
        // Map places to Activity objects with simple heuristics
        let idCounter = 10000;
        attractionActivities = places.map(p => ({
          id: `poi_${idCounter++}`,
          name: p.name,
          description: p.description,
          category: (p.category as Activity['category']) || 'sightseeing',
          duration: 2,
          weather_dependent: p.category === 'outdoor' || p.category === 'sightseeing',
          cost_estimate: 8 // base cost lower for attractions
        }));
      } catch (e) {
        // Fallback handled by existing heuristic generation below
      }
    }

    // Distribute attractions across days (approximately 3-4 per day)
    const perDay = Math.max(3, Math.min(4, Math.ceil((attractionActivities.length || 12) / days)));
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const weather = weatherForecasts[i] || weatherForecasts[0];
      const sliceStart = i * perDay;
      const sliceEnd = sliceStart + perDay;
      const todaysAttractions = attractionActivities.slice(sliceStart, sliceEnd);
      const dayPlan = this.generateDayPlan(
        i + 1,
        currentDate.toISOString().split('T')[0],
        weather,
        destination,
        currency,
        exchangeRate,
        todaysAttractions
      );
      dayPlans.push(dayPlan);
    }
    return dayPlans;
  }
}

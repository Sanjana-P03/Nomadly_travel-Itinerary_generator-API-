// src/services/placesService.ts
import { PlacesSuggestion, Destination } from '../types';

// Places API configuration
const PLACES_API_PROVIDER = import.meta.env.VITE_PLACES_API_PROVIDER || 'nominatim'; // 'nominatim' or 'google'
const PLACES_API_KEY = import.meta.env.VITE_PLACES_API_KEY || '';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const GOOGLE_PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';
const USE_PLACES_API = import.meta.env.VITE_USE_PLACES_API !== 'false'; // Default to true

interface PlaceSearchCache {
  query: string;
  results: PlacesSuggestion[];
  timestamp: number;
}

interface PlaceDetailsCache {
  placeId: string;
  details: Destination;
  timestamp: number;
}

let searchCache: Map<string, PlaceSearchCache> = new Map();
let detailsCache: Map<string, PlaceDetailsCache> = new Map();
const CACHE_DURATION = 30 * 60 * 1000; 
const nominatimIdToSuggestion: Map<string, PlacesSuggestion> = new Map();

function makeStructured(display_name: string) {
  const parts = display_name.split(',').map(p => p.trim());
  return {
    main_text: parts[0] ?? display_name,
    secondary_text: parts.slice(1).join(', ') ?? ''
  };
}

const getMockSuggestions = (query: string): PlacesSuggestion[] => {
  const mockPlaces: Record<string, PlacesSuggestion[]> = {
    'paris': [
      {
        place_id: 'paris_france',
        description: 'Paris, France',
        structured_formatting: {
          main_text: 'Paris',
          secondary_text: 'France'
        }
      }
    ],
    'tokyo': [
      {
        place_id: 'tokyo_japan',
        description: 'Tokyo, Japan',
        structured_formatting: {
          main_text: 'Tokyo',
          secondary_text: 'Japan'
        }
      }
    ],
    'new york': [
      {
        place_id: 'new_york_usa',
        description: 'New York, USA',
        structured_formatting: {
          main_text: 'New York',
          secondary_text: 'USA'
        }
      }
    ],
    'london': [
      {
        place_id: 'london_uk',
        description: 'London, UK',
        structured_formatting: {
          main_text: 'London',
          secondary_text: 'UK'
        }
      }
    ]
  };

  const lowerQuery = query.toLowerCase();
  for (const [key, places] of Object.entries(mockPlaces)) {
    if (lowerQuery.includes(key)) {
      return places;
    }
  }

  // Generic mock based on query
  return [{
    place_id: `${query.toLowerCase().replace(/\s+/g, '_')}_mock`,
    description: query,
    structured_formatting: {
      main_text: query,
      secondary_text: 'Location'
    }
  }];
};

const getMockPlaceDetails = (placeId: string): Destination => {
  const mockPlaces: Record<string, Destination> = {
    'paris_france': {
      place_id: 'paris_france',
      name: 'Paris',
      formatted_address: 'Paris, France',
      lat: 48.8566,
      lng: 2.3522
    },
    'tokyo_japan': {
      place_id: 'tokyo_japan',
      name: 'Tokyo',
      formatted_address: 'Tokyo, Japan',
      lat: 35.6762,
      lng: 139.6503
    },
    'new_york_usa': {
      place_id: 'new_york_usa',
      name: 'New York',
      formatted_address: 'New York, USA',
      lat: 40.7128,
      lng: -74.0060
    },
    'london_uk': {
      place_id: 'london_uk',
      name: 'London',
      formatted_address: 'London, UK',
      lat: 51.5074,
      lng: -0.1278
    }
  };

  return mockPlaces[placeId] || {
    place_id: placeId,
    name: placeId.replace(/_/g, ' ').split(' ')[0],
    formatted_address: placeId.replace(/_/g, ', '),
    lat: 48.8566,
    lng: 2.3522
  };
};

export class PlacesService {
  /**
   * Get the configured provider
   */
  static getProvider(): string {
    return PLACES_API_PROVIDER;
  }

  /**
   * Check if Google Places API is available
   */
  static isGoogleAvailable(): boolean {
    return PLACES_API_KEY.length > 0;
  }

  /**
   * Search places using Nominatim (OpenStreetMap) API
   */
  private static async searchNominatim(query: string): Promise<PlacesSuggestion[]> {
    try {
      const response = await fetch(
        `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6`,
        {
          headers: {
            'User-Agent': 'TravelPlanner/1.0' // Nominatim requires User-Agent
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Nominatim API returned ${response.status}`);
      }

      const data = await response.json();
      const results: PlacesSuggestion[] = (data || []).map((item: any) => ({
        place_id: String(item.place_id),
        description: item.display_name,
        structured_formatting: makeStructured(item.display_name),
        lat: item.lat ? parseFloat(item.lat) : undefined,
        lng: item.lon ? parseFloat(item.lon) : undefined,
        provider: 'nominatim'
      }));
      // Cache id->suggestion for quick details resolution
      results.forEach(s => {
        if (s.lat !== undefined && s.lng !== undefined) {
          nominatimIdToSuggestion.set(s.place_id, s);
        }
      });
      return results;
    } catch (error) {
      console.warn('Nominatim API error:', error);
      throw error;
    }
  }

  /**
   * Search places using Google Places API
   */
  private static async searchGooglePlaces(query: string): Promise<PlacesSuggestion[]> {
    if (!PLACES_API_KEY) {
      throw new Error('Google Places API key is required');
    }

    try {
      const response = await fetch(
        `${GOOGLE_PLACES_BASE}/autocomplete/json?input=${encodeURIComponent(query)}&key=${PLACES_API_KEY}&types=(cities)`
      );

      if (!response.ok) {
        throw new Error(`Google Places API returned ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error_message) {
        throw new Error(data.error_message);
      }

      return (data.predictions || []).map((item: any) => ({
        place_id: item.place_id,
        description: item.description,
        structured_formatting: {
          main_text: item.structured_formatting?.main_text || item.description.split(',')[0],
          secondary_text: item.structured_formatting?.secondary_text || item.description.split(',').slice(1).join(',')
        },
      }));
    } catch (error) {
      console.warn('Google Places API error:', error);
      throw error;
    }
  }

  /**
   * Autocomplete (search places while typing)
   * @param query - Search query string
   * @param provider - Optional provider override ('nominatim' | 'google'), uses configured provider if not specified
   */
  static async searchPlaces(query: string, provider?: string): Promise<PlacesSuggestion[]> {
    if (query.length < 2) return [];

    // Use provided provider or fall back to configured provider
    const activeProvider = provider || PLACES_API_PROVIDER;

    // Check cache first (provider-specific cache key)
    const cacheKey = `${activeProvider}_${query.toLowerCase().trim()}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.results;
    }

    // If API is disabled, use mock data
    if (!USE_PLACES_API) {
      const mockResults = getMockSuggestions(query);
      searchCache.set(cacheKey, {
        query: cacheKey,
        results: mockResults,
        timestamp: Date.now()
      });
      return mockResults;
    }

    try {
      let results: PlacesSuggestion[];

      // Use specified or configured provider
      if (activeProvider === 'google' && PLACES_API_KEY) {
        results = await this.searchGooglePlaces(query);
      } else {
        results = await this.searchNominatim(query);
      }

      // Update cache
      searchCache.set(cacheKey, {
        query: cacheKey,
        results,
        timestamp: Date.now()
      });

      return results;
    } catch (error) {
      console.warn('Places API error, using fallback:', error);
      // Return mock data as fallback
      const mockResults = getMockSuggestions(query);
      return mockResults;
    }
  }

  /**
   * Get place details using Nominatim
   */
  private static async getPlaceDetailsNominatim(placeId: string): Promise<Destination> {
    try {
      const response = await fetch(
        `${NOMINATIM_BASE}/lookup?place_ids=${encodeURIComponent(placeId)}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'TravelPlanner/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Nominatim API returned ${response.status}`);
      }

      const data = await response.json();
      const item = (data && data[0]) ? data[0] : null;

      if (item) {
        // Better name extraction from Nominatim
        // Try to get name from addressdetails first, fallback to display_name parsing
        let name = '';
        if (item.address) {
          // Prioritize: name > city > town > village > municipality > county
          name = item.address.name || 
                 item.address.city || 
                 item.address.town || 
                 item.address.village || 
                 item.address.municipality || 
                 item.address.county || 
                 '';
        }
        
        // Fallback to parsing display_name if address details didn't provide a good name
        if (!name || name.match(/^\d+$/)) {
          // Parse display_name - take the first meaningful part (not just numbers)
          const parts = item.display_name.split(',').map((p: string) => p.trim());
          name = parts.find((part: string) => part && !part.match(/^\d+$/)) || parts[0] || item.display_name;
        }

        return {
          place_id: String(item.place_id),
          name: name,
          formatted_address: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        };
      }

      throw new Error('Place not found in Nominatim response');
    } catch (error) {
      console.warn('Nominatim details error:', error);
      throw error;
    }
  }

  /**
   * Get place details using Google Places API
   */
  private static async getPlaceDetailsGoogle(placeId: string): Promise<Destination> {
    if (!PLACES_API_KEY) {
      throw new Error('Google Places API key is required');
    }

    try {
      const response = await fetch(
        `${GOOGLE_PLACES_BASE}/details/json?place_id=${encodeURIComponent(placeId)}&key=${PLACES_API_KEY}&fields=place_id,name,formatted_address,geometry`
      );

      if (!response.ok) {
        throw new Error(`Google Places API returned ${response.status}`);
      }

      const data = await response.json();

      if (data.error_message) {
        throw new Error(data.error_message);
      }

      const result = data.result;
      if (result) {
        return {
          place_id: result.place_id,
          name: result.name,
          formatted_address: result.formatted_address,
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        };
      }

      throw new Error('Place not found in Google Places response');
    } catch (error) {
      console.warn('Google Places details error:', error);
      throw error;
    }
  }

  /**
   * Get details (lat/lng, name, full address) for a selected place
   * @param placeId - Place ID from the search results
   * @param provider - Optional provider override ('nominatim' | 'google'), uses configured provider if not specified
   */
  static async getPlaceDetails(placeId: string, provider?: string): Promise<Destination> {
    // Use provided provider or fall back to configured provider
    const activeProvider = provider || PLACES_API_PROVIDER;

    // Fast-path for Nominatim: reuse lat/lng from cached search suggestion
    if ((activeProvider === 'nominatim' || !PLACES_API_KEY) && nominatimIdToSuggestion.has(placeId)) {
      const s = nominatimIdToSuggestion.get(placeId)!;
      if (typeof s.lat === 'number' && typeof s.lng === 'number') {
        const dest: Destination = {
          place_id: placeId,
          name: s.structured_formatting.main_text,
          formatted_address: s.description,
          lat: s.lat,
          lng: s.lng
        };
        return dest;
      }
    }

    // Check cache first (provider-specific cache key for Google, generic for Nominatim)
    const cacheKey = activeProvider === 'google' ? `google_${placeId}` : placeId;
    const cached = detailsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.details;
    }

    // If API is disabled, use mock data
    if (!USE_PLACES_API) {
      const mockDetails = getMockPlaceDetails(placeId);
      detailsCache.set(cacheKey, {
        placeId: cacheKey,
        details: mockDetails,
        timestamp: Date.now()
      });
      return mockDetails;
    }

    try {
      let destination: Destination;

      // Use specified or configured provider
      if (activeProvider === 'google' && PLACES_API_KEY) {
        destination = await this.getPlaceDetailsGoogle(placeId);
      } else {
        destination = await this.getPlaceDetailsNominatim(placeId);
      }

      // Update cache
      detailsCache.set(cacheKey, {
        placeId: cacheKey,
        details: destination,
        timestamp: Date.now()
      });

      return destination;
    } catch (error) {
      console.warn('Place details error, using fallback:', error);
      // Return mock data as fallback
      const mockDetails = getMockPlaceDetails(placeId);
      return mockDetails;
    }
  }

  /**
   * Clears the places cache (useful for testing or forcing refresh)
   */
  static clearCache(): void {
    searchCache.clear();
    detailsCache.clear();
  }

  /**
   * Fetch top attractions/places of interest for a destination using the configured provider
   * This powers itinerary generation from real POIs rather than static heuristics.
   */
  static async getAttractions(
    destination: Destination,
    provider?: 'nominatim' | 'google',
    limit: number = 40
  ): Promise<Array<{ name: string; description: string; category: string }>> {
    const activeProvider = provider || (PLACES_API_PROVIDER as 'nominatim' | 'google');

    try {
      if (activeProvider === 'google' && PLACES_API_KEY) {
        return await this.fetchGoogleAttractions(destination, limit);
      }
      return await this.fetchOSMAttractions(destination, limit);
    } catch (error) {
      console.warn('Attractions fetch failed, falling back to minimal set:', error);
      // Minimal fallback using destination name
      return [
        { name: `${destination.name} City Center`, description: `Explore ${destination.name}'s main sights`, category: 'sightseeing' },
        { name: 'Local Museum', description: 'Discover regional history and culture', category: 'cultural' },
        { name: 'Popular Park', description: 'Relax in a central green space', category: 'outdoor' },
        { name: 'Food Street', description: 'Taste local specialties', category: 'food' }
      ];
    }
  }

  // --- Provider-specific implementations ---

  private static async fetchOSMAttractions(
    destination: Destination,
    limit: number
  ): Promise<Array<{ name: string; description: string; category: string }>> {
    // Use Overpass API to query tourism-related POIs around the destination
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    const radiusMeters = 10000; // 10km
    const categories = 'attraction|museum|gallery|viewpoint|theme_park|zoo|aquarium|artwork|castle|monument|memorial|ruins|park|garden';
    const query = `
      [out:json][timeout:25];
      (
        node["tourism"~"${categories}"](around:${radiusMeters},${destination.lat},${destination.lng});
        way["tourism"~"${categories}"](around:${radiusMeters},${destination.lat},${destination.lng});
        relation["tourism"~"${categories}"](around:${radiusMeters},${destination.lat},${destination.lng});
      );
      out center ${limit};
    `;

    const response = await fetch(overpassUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams({ data: query })
    });

    if (!response.ok) {
      throw new Error(`Overpass API returned ${response.status}`);
    }

    const data = await response.json();
    const elements = Array.isArray(data?.elements) ? data.elements : [];

    const pois = elements
      .map((el: any) => {
        const name: string = el.tags?.name || '';
        const tourism: string = el.tags?.tourism || '';
        if (!name) return null;
        return {
          name,
          description: el.tags?.description || el.tags?.['name:en'] || `${tourism} in ${destination.name}`,
          category: this.mapOsmTourismToCategory(tourism)
        };
      })
      .filter(Boolean) as Array<{ name: string; description: string; category: string }>;

    // Deduplicate by name and limit
    const seen = new Set<string>();
    const unique = [] as Array<{ name: string; description: string; category: string }>;
    for (const p of pois) {
      const key = p.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(p);
      }
      if (unique.length >= limit) break;
    }
    return unique;
  }

  private static mapOsmTourismToCategory(tourism: string): string {
    const t = (tourism || '').toLowerCase();
    if (['museum', 'gallery', 'artwork', 'castle', 'monument', 'memorial', 'ruins'].some(k => t.includes(k))) return 'cultural';
    if (['viewpoint', 'park', 'garden'].some(k => t.includes(k))) return 'outdoor';
    if (['theme_park', 'zoo', 'aquarium'].some(k => t.includes(k))) return 'sightseeing';
    return 'sightseeing';
  }

  private static async fetchGoogleAttractions(
    destination: Destination,
    limit: number
  ): Promise<Array<{ name: string; description: string; category: string }>> {
    // Prefer Nearby Search for tourist_attraction type, then enrich via Text Search for museums, parks, etc.
    const nearbyUrl = `${GOOGLE_PLACES_BASE}/nearbysearch/json?location=${destination.lat},${destination.lng}&radius=10000&type=tourist_attraction&key=${PLACES_API_KEY}`;
    const results: Array<{ name: string; description: string; category: string }> = [];

    const fetchJson = async (url: string) => {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Google Places API returned ${r.status}`);
      const j = await r.json();
      if (j.error_message) throw new Error(j.error_message);
      return j;
    };

    const nearby = await fetchJson(nearbyUrl);
    for (const item of nearby.results || []) {
      if (item.name) {
        results.push({
          name: item.name,
          description: item.vicinity || item.formatted_address || `Attraction in ${destination.name}`,
          category: 'sightseeing'
        });
      }
      if (results.length >= limit) break;
    }

    const textQueries = [
      `museums in ${destination.name}`,
      `parks in ${destination.name}`,
      `landmarks in ${destination.name}`
    ];

    for (const q of textQueries) {
      if (results.length >= limit) break;
      const textUrl = `${GOOGLE_PLACES_BASE}/textsearch/json?query=${encodeURIComponent(q)}&location=${destination.lat},${destination.lng}&radius=10000&key=${PLACES_API_KEY}`;
      const text = await fetchJson(textUrl);
      for (const item of text.results || []) {
        if (item.name) {
          results.push({
            name: item.name,
            description: item.formatted_address || `Place in ${destination.name}`,
            category: (item.types || []).some((t: string) => t.includes('museum') || t.includes('art_gallery')) ? 'cultural' : 'sightseeing'
          });
        }
        if (results.length >= limit) break;
      }
    }

    // Deduplicate by name
    const unique: Array<{ name: string; description: string; category: string }> = [];
    const seen = new Set<string>();
    for (const r of results) {
      const k = r.name.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        unique.push(r);
      }
      if (unique.length >= limit) break;
    }
    return unique;
  }
}

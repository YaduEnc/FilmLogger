export interface Cinema {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  displayName: string;
}

/**
 * Search for cinemas in a city using OpenStreetMap
 */
export async function searchCinemasByCity(city: string): Promise<Cinema[]> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=cinema+${encodeURIComponent(city)}&format=json&limit=20&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'CineLunatic/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch cinemas');
    }

    const data = await response.json();
    
    return data
      .filter((item: any) => item.class === 'amenity' && (item.type === 'cinema' || item.type === 'theatre'))
      .map((item: any, index: number) => ({
        id: item.place_id?.toString() || `cinema-${index}`,
        name: item.name || 'Unknown Cinema',
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        address: item.address?.road || item.display_name?.split(',')[0] || '',
        displayName: item.display_name || item.name || 'Unknown'
      }));
  } catch (error) {
    console.error('Error searching cinemas:', error);
    return [];
  }
}

/**
 * Search for cinemas near coordinates using OpenStreetMap
 * Note: OpenStreetMap doesn't support radius search well, so we get city first then filter
 */
export async function searchCinemasNearLocation(lat: number, lng: number, radiusKm: number = 10): Promise<Cinema[]> {
  try {
    // First, reverse geocode to get city name
    const reverseResponse = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'CineLunatic/1.0'
        }
      }
    );

    if (!reverseResponse.ok) {
      throw new Error('Failed to reverse geocode');
    }

    const reverseData = await reverseResponse.json();
    const city = reverseData.address?.city || reverseData.address?.town || reverseData.address?.county || '';

    if (!city) {
      // Fallback: search with coordinates area
      return searchCinemasByCity(`${lat},${lng}`);
    }

    // Search cinemas in the city
    const cinemas = await searchCinemasByCity(city);

    // Filter by distance
    const filtered = cinemas.filter(cinema => {
      const distance = calculateDistance(lat, lng, cinema.lat, cinema.lng);
      return distance <= radiusKm;
    });

    return filtered;
  } catch (error) {
    console.error('Error searching cinemas near location:', error);
    return [];
  }
}

/**
 * Calculate distance between two coordinates in kilometers (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

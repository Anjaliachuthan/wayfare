import { Place } from '../data/mock';

/**
 * Search places using OpenStreetMap (Photon API)
 */
export async function searchOpenStreetMap(query: string): Promise<Place[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  try {
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=6`, {
      headers: {
        'User-Agent': 'WayfareTripApp/1.0',
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!data.features || !Array.isArray(data.features)) return [];

    return data.features.map((f: any, idx: number) => {
      const props = f.properties || {};
      const [lng, lat] = f.geometry.coordinates;
      const title = props.name || props.street || props.city || trimmed;
      const subtitleParts = [props.street, props.city, props.state, props.country].filter(Boolean);
      const subtitle = subtitleParts.length > 0 ? subtitleParts.join(', ') : 'Location';

      return {
        id: `osm-${props.osm_id || idx}-${Date.now()}`,
        title,
        subtitle,
        icon: 'location-outline',
        lat,
        lng,
      };
    });
  } catch (err) {
    return [];
  }
}

/**
 * Reverse geocode GPS coordinates to a friendly human-readable street address using OpenStreetMap Nominatim
 */
export async function reverseGeocodeOSM(latitude: number, longitude: number): Promise<{ title: string; subtitle: string }> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'WayfareTripApp/1.0',
        'Accept-Language': 'en',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const mainName =
        data.name ||
        addr.road ||
        addr.pedestrian ||
        addr.suburb ||
        addr.neighbourhood ||
        addr.quarter ||
        addr.city_district ||
        addr.village ||
        addr.town ||
        addr.city ||
        'Current Location';

      const details = [
        addr.road,
        addr.suburb || addr.neighbourhood,
        addr.city || addr.town || addr.village,
        addr.state,
      ]
        .filter((part) => Boolean(part) && part !== mainName)
        .slice(0, 3)
        .join(', ');

      return {
        title: mainName,
        subtitle: details || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      };
    }
  } catch (err) {}

  return {
    title: 'Current Location',
    subtitle: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
  };
}

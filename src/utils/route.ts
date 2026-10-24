import { Place } from '../data/mock';

export type Coord = { latitude: number; longitude: number };
export type Mode = 'Drive' | 'Ride' | 'Walk';

export type TurnStep = {
  id: string;
  icon: 'arrow-up' | 'arrow-forward' | 'arrow-back' | 'navigate';
  title: string;
  note: string;
  distance: string;
};

export type CalculatedTrip = {
  coordinates: Coord[];
  distanceKm: string;
  durationMinutes: number;
  durationLabel: string;
  arriveTime: string;
  steps: TurnStep[];
};

const toRad = (d: number) => (d * Math.PI) / 180;

export function haversineDistanceKm(a: Coord, b: Coord): number {
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Fallback curved route if offline or OSRM request fails
export function buildFallbackRoute(from: Place, to: Place, points = 16): Coord[] {
  const out: Coord[] = [];
  const dLat = to.lat - from.lat;
  const dLng = to.lng - from.lng;
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const bend = Math.sin(t * Math.PI) * 0.12;
    out.push({
      latitude: from.lat + dLat * t - dLng * bend,
      longitude: from.lng + dLng * t + dLat * bend,
    });
  }
  return out;
}

export function formatTimeAndArrival(minutes: number) {
  const arrive = new Date(Date.now() + minutes * 60000);
  const hh = String(arrive.getHours()).padStart(2, '0');
  const mm = String(arrive.getMinutes()).padStart(2, '0');
  const label = minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;
  return { durationLabel: label, arriveTime: `${hh}:${mm}` };
}

/**
 * Real road routing using OpenStreetMap OSRM API with real speed calculation for Drive / Ride / Walk
 */
export async function fetchOSRMRoute(from: Place, to: Place, mode: Mode): Promise<CalculatedTrip> {
  // OSRM driving profile provides full road network geometry
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WayfareTripApp/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`OSRM error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.routes || !data.routes.length) {
      throw new Error('No route found');
    }

    const primaryRoute = data.routes[0];
    const coordinates: Coord[] = (primaryRoute.geometry.coordinates as [number, number][]).map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    }));

    const rawDistanceKm = primaryRoute.distance / 1000;
    const distKmStr = rawDistanceKm.toFixed(1);

    // Calculate realistic mode-specific durations:
    // Drive (Car): standard car road duration with signals and traffic bottlenecks
    // Ride (Motorcycle / Two-wheeler): faster in city/suburban traffic due to lane filtering and agility (~15-25% faster than car)
    // Walk: pedestrian speed ~4.8 km/h
    const baseDriveMin = Math.max(1, Math.round(primaryRoute.duration / 60));

    let durationMin: number;
    if (mode === 'Walk') {
      durationMin = Math.max(1, Math.round((rawDistanceKm / 4.8) * 60));
    } else if (mode === 'Ride') {
      // Two-wheelers cut through traffic delays; takes ~80% of car time
      durationMin = Math.max(1, Math.round(baseDriveMin * 0.8));
    } else {
      // Drive (Car)
      durationMin = baseDriveMin;
    }

    const { durationLabel, arriveTime } = formatTimeAndArrival(durationMin);

    const steps: TurnStep[] = [];
    const legs = primaryRoute.legs || [];
    if (legs[0] && Array.isArray(legs[0].steps)) {
      legs[0].steps.forEach((st: any, idx: number) => {
        const stepDistMeters = Math.round(st.distance || 0);
        const distStr = stepDistMeters >= 1000 ? `${(stepDistMeters / 1000).toFixed(1)} km` : `${stepDistMeters} m`;
        const modifier = st.maneuver?.modifier || '';
        const instruction = st.maneuver?.type === 'depart'
          ? `Head onto ${st.name || 'the road'}`
          : st.name
          ? `Continue on ${st.name}`
          : 'Continue straight';

        let icon: TurnStep['icon'] = 'arrow-up';
        if (modifier.includes('right')) icon = 'arrow-forward';
        else if (modifier.includes('left')) icon = 'arrow-back';

        steps.push({
          id: `step-${idx}`,
          icon,
          title: st.name ? `Turn onto ${st.name}` : instruction,
          note: modifier ? `Turn ${modifier}` : 'Follow road',
          distance: distStr,
        });
      });
    }

    return {
      coordinates,
      distanceKm: distKmStr,
      durationMinutes: durationMin,
      durationLabel,
      arriveTime,
      steps: steps.length > 0 ? steps.slice(0, 5) : [
        { id: '1', icon: 'arrow-up', title: `Head towards ${to.title}`, note: 'Follow navigation signs', distance: `${distKmStr} km` },
      ],
    };
  } catch (err) {
    // If network fails, gracefully provide calculated fallback
    const directKm = haversineDistanceKm({ latitude: from.lat, longitude: from.lng }, { latitude: to.lat, longitude: to.lng }) * 1.25;
    const speed = mode === 'Walk' ? 4.8 : mode === 'Ride' ? 22 : 35;
    const minutes = Math.max(1, Math.round((directKm / speed) * 60));
    const { durationLabel, arriveTime } = formatTimeAndArrival(minutes);

    return {
      coordinates: buildFallbackRoute(from, to),
      distanceKm: directKm.toFixed(1),
      durationMinutes: minutes,
      durationLabel,
      arriveTime,
      steps: [
        { id: '1', icon: 'arrow-up', title: `Head towards ${to.title}`, note: 'Follow route guidance', distance: `${directKm.toFixed(1)} km` },
      ],
    };
  }
}

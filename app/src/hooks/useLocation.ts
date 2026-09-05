import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface LocationState {
  coords: { latitude: number; longitude: number } | null;
  error: string | null;
  loading: boolean;
}

export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    coords: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState({ coords: null, error: 'Location permission denied', loading: false });
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setState({ coords: current.coords, error: null, loading: false });

      // High accuracy, update every 20m — precise enough to detect building changes
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 20 },
        loc => setState(prev => ({ ...prev, coords: loc.coords })),
      );
    })();

    return () => { subscription?.remove(); };
  }, []);

  return state;
}

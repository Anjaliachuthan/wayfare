import React, { createContext, useContext, useMemo, useState } from 'react';
import { Place } from '../data/mock';

type TripCtx = {
  pickup: Place | null;
  dropoff: Place | null;
  setPickup: (p: Place | null) => void;
  setDropoff: (p: Place | null) => void;
  swap: () => void;
  reset: () => void;
};

const Ctx = createContext<TripCtx | null>(null);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [pickup, setPickup] = useState<Place | null>(null);
  const [dropoff, setDropoff] = useState<Place | null>(null);

  const value = useMemo<TripCtx>(
    () => ({
      pickup,
      dropoff,
      setPickup,
      setDropoff,
      swap: () => {
        setPickup(dropoff);
        setDropoff(pickup);
      },
      reset: () => {
        setPickup(null);
        setDropoff(null);
      },
    }),
    [pickup, dropoff]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTrip = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useTrip must be used inside TripProvider');
  return c;
};

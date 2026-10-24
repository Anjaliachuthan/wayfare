import { Ionicons } from '@expo/vector-icons';
import React from 'react';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type Place = {
  id: string;
  title: string;
  subtitle: string;
  icon: IconName;
  lat: number;
  lng: number;
};

export const PLACES: Place[] = [
  { id: 'home', title: 'Home', subtitle: 'Villa 12, Street 840, Zone 61 · West Bay', icon: 'home-outline', lat: 25.3236, lng: 51.531 },
  { id: 'marina', title: 'Marina Office Tower', subtitle: 'Level 14, Al Farfan Rd · Lusail Marina', icon: 'business-outline', lat: 25.418, lng: 51.507 },
  { id: 'corniche', title: 'Corniche Ferry Terminal', subtitle: 'Gate 3, Corniche Promenade', icon: 'time-outline', lat: 25.296, lng: 51.52 },
  { id: 'msheireb', title: 'Msheireb Metro Station', subtitle: 'Al Kinana St · Msheireb Downtown', icon: 'time-outline', lat: 25.287, lng: 51.523 },
  { id: 'airport', title: 'Hamad International Airport', subtitle: 'Departures, Terminal 1', icon: 'airplane-outline', lat: 25.2731, lng: 51.6081 },
];

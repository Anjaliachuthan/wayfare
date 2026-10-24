import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import SetLocationsScreen from '../screens/SetLocationsScreen';
import TripReadyScreen from '../screens/TripReadyScreen';
import RouteViewScreen from '../screens/RouteViewScreen';
import MapPickerScreen from '../screens/MapPickerScreen';

export type RootStackParamList = {
  Login: undefined;
  SetLocations: undefined;
  TripReady: undefined;
  RouteView: undefined;
  MapPicker: { field: 'pickup' | 'dropoff' };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {user ? (
          <>
            <Stack.Screen name="SetLocations" component={SetLocationsScreen} />
            <Stack.Screen name="TripReady" component={TripReadyScreen} />
            <Stack.Screen name="RouteView" component={RouteViewScreen} />
            <Stack.Screen name="MapPicker" component={MapPickerScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

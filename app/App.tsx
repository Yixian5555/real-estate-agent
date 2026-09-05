import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import type { PropertyFilters } from './src/types';

const DEFAULT_FILTERS: PropertyFilters = { radiusMetres: 500 };
const Tab = createBottomTabNavigator();

export default function App() {
  const [filters, setFilters] = useState<PropertyFilters>(DEFAULT_FILTERS);
  const [preferences, setPreferences] = useState('');
  const [ready, setReady] = useState(false);

  // Restore saved preferences on launch
  useEffect(() => {
    (async () => {
      try {
        const [savedFilters, savedPrefs] = await Promise.all([
          AsyncStorage.getItem('filters'),
          AsyncStorage.getItem('preferences'),
        ]);
        if (savedFilters) setFilters(JSON.parse(savedFilters) as PropertyFilters);
        if (savedPrefs) setPreferences(savedPrefs);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  async function handleFiltersChange(f: PropertyFilters) {
    setFilters(f);
    await AsyncStorage.setItem('filters', JSON.stringify(f)).catch(() => {});
  }

  async function handlePreferencesChange(p: string) {
    setPreferences(p);
    await AsyncStorage.setItem('preferences', p).catch(() => {});
  }

  if (!ready) return null;

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e5e7eb' },
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#9ca3af',
        }}
      >
        <Tab.Screen
          name="Scout"
          options={{
            tabBarLabel: 'Scout',
            tabBarIcon: () => <Text style={{ fontSize: 22 }}>📍</Text>,
          }}
        >
          {() => <HomeScreen filters={filters} preferences={preferences} />}
        </Tab.Screen>

        <Tab.Screen
          name="Filters"
          options={{
            tabBarLabel: 'Filters',
            tabBarIcon: () => <Text style={{ fontSize: 22 }}>⚙️</Text>,
          }}
        >
          {() => (
            <SettingsScreen
              filters={filters}
              preferences={preferences}
              onFiltersChange={handleFiltersChange}
              onPreferencesChange={handlePreferencesChange}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

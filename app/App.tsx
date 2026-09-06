import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
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

  const handleFiltersChange = useCallback(async (f: PropertyFilters) => {
    setFilters(f);
    await AsyncStorage.setItem('filters', JSON.stringify(f)).catch(() => {});
  }, []);

  const handlePreferencesChange = useCallback(async (p: string) => {
    setPreferences(p);
    await AsyncStorage.setItem('preferences', p).catch(() => {});
  }, []);

  // Stable screen components — defined outside render to prevent remounting on parent re-render
  const ScoutScreen = useCallback(
    () => <HomeScreen filters={filters} preferences={preferences} />,
    [filters, preferences],
  );

  const FiltersScreen = useCallback(
    () => (
      <SettingsScreen
        filters={filters}
        preferences={preferences}
        onFiltersChange={handleFiltersChange}
        onPreferencesChange={handlePreferencesChange}
      />
    ),
    [filters, preferences, handleFiltersChange, handlePreferencesChange],
  );

  // Show a spinner instead of blank white while AsyncStorage loads
  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e40af' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

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
          component={ScoutScreen}
          options={{
            tabBarLabel: 'Scout',
            tabBarIcon: () => <Text style={{ fontSize: 22 }}>📍</Text>,
          }}
        />
        <Tab.Screen
          name="Filters"
          component={FiltersScreen}
          options={{
            tabBarLabel: 'Filters',
            tabBarIcon: () => <Text style={{ fontSize: 22 }}>⚙️</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

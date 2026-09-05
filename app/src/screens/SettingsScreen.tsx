import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import type { PropertyFilters } from '../types';

const PROPERTY_TYPES = [
  { code: 'APT', label: 'Apartment' },
  { code: 'HSE', label: 'House' },
  { code: 'TWN', label: 'Townhouse' },
  { code: 'MUF', label: 'Multi-family' },
  { code: 'PAD', label: 'Pad / Mobile' },
  { code: 'LND', label: 'Land' },
];

const RADIUS_OPTIONS = [250, 500, 1000, 2000];

interface Props {
  filters: PropertyFilters;
  preferences: string;
  onFiltersChange: (f: PropertyFilters) => void;
  onPreferencesChange: (p: string) => void;
}

export function SettingsScreen({ filters, preferences, onFiltersChange, onPreferencesChange }: Props) {
  function toggleType(code: string) {
    const current = filters.propertyTypes ?? [];
    const updated = current.includes(code)
      ? current.filter(t => t !== code)
      : [...current, code];
    onFiltersChange({ ...filters, propertyTypes: updated.length ? updated : undefined });
  }

  function isTypeActive(code: string): boolean {
    return !filters.propertyTypes?.length || filters.propertyTypes.includes(code);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Filters</Text>

      {/* AI narration preferences */}
      <Text style={styles.sectionTitle}>What matters to you</Text>
      <Text style={styles.hint}>Claude uses this to personalise the narration style</Text>
      <TextInput
        style={styles.prefsInput}
        value={preferences}
        onChangeText={onPreferencesChange}
        placeholder="e.g. investment potential, low strata fees, character homes, under-valued condos..."
        multiline
        numberOfLines={3}
        placeholderTextColor="#9ca3af"
      />

      {/* Price */}
      <Text style={styles.sectionTitle}>Price Range</Text>
      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Min ($)</Text>
          <TextInput
            style={styles.numInput}
            value={filters.minPrice?.toString() ?? ''}
            onChangeText={v => onFiltersChange({ ...filters, minPrice: v ? Number(v) : undefined })}
            keyboardType="numeric"
            placeholder="No min"
            placeholderTextColor="#9ca3af"
          />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Max ($)</Text>
          <TextInput
            style={styles.numInput}
            value={filters.maxPrice?.toString() ?? ''}
            onChangeText={v => onFiltersChange({ ...filters, maxPrice: v ? Number(v) : undefined })}
            keyboardType="numeric"
            placeholder="No max"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Bedrooms */}
      <Text style={styles.sectionTitle}>Bedrooms</Text>
      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Min beds</Text>
          <TextInput
            style={styles.numInput}
            value={filters.minBeds?.toString() ?? ''}
            onChangeText={v => onFiltersChange({ ...filters, minBeds: v ? Number(v) : undefined })}
            keyboardType="numeric"
            placeholder="Any"
            placeholderTextColor="#9ca3af"
          />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Max beds</Text>
          <TextInput
            style={styles.numInput}
            value={filters.maxBeds?.toString() ?? ''}
            onChangeText={v => onFiltersChange({ ...filters, maxBeds: v ? Number(v) : undefined })}
            keyboardType="numeric"
            placeholder="Any"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Radius */}
      <Text style={styles.sectionTitle}>Search Radius</Text>
      <View style={styles.chipRow}>
        {RADIUS_OPTIONS.map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.chip, filters.radiusMetres === r && styles.chipActive]}
            onPress={() => onFiltersChange({ ...filters, radiusMetres: r })}
          >
            <Text style={[styles.chipText, filters.radiusMetres === r && styles.chipTextActive]}>
              {r >= 1000 ? `${r / 1000}km` : `${r}m`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Property types */}
      <Text style={styles.sectionTitle}>Property Types</Text>
      <Text style={styles.hint}>Leave all unselected to show every type</Text>
      <View style={styles.chipRow}>
        {PROPERTY_TYPES.map(({ code, label }) => (
          <TouchableOpacity
            key={code}
            style={[styles.chip, isTypeActive(code) && styles.chipActive]}
            onPress={() => toggleType(code)}
          >
            <Text style={[styles.chipText, isTypeActive(code) && styles.chipTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 20, paddingTop: 60 },
  pageTitle: { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 28, marginBottom: 4 },
  hint: { fontSize: 13, color: '#9ca3af', marginBottom: 10 },
  prefsInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
    minHeight: 90,
    color: '#111827',
  },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  label: { fontSize: 13, color: '#6b7280', marginBottom: 6 },
  numInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#111827',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
});

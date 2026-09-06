import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as Speech from 'expo-speech';
import { useLocation } from '../hooks/useLocation';
import { useNearbyProperties } from '../hooks/useNearbyProperties';
import { PropertyCard } from '../components/PropertyCard';
import { formatPrice } from '../utils/format';
import type { PropertyFilters } from '../types';

interface Props {
  filters: PropertyFilters;
  preferences: string;
}

export function HomeScreen({ filters, preferences }: Props) {
  const location = useLocation();
  const { data, loading, error, search } = useNearbyProperties();
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Auto-speak whenever narration changes
  useEffect(() => {
    if (data?.narration) speak(data.narration);
  }, [data?.narration]);

  function speak(text: string) {
    Speech.stop();
    setIsSpeaking(true);
    Speech.speak(text, {
      language: 'en-CA',
      rate: 0.95,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }

  function stopSpeaking() {
    Speech.stop();
    setIsSpeaking(false);
  }

  function handleScan() {
    if (!location.coords) return;
    search(location.coords.latitude, location.coords.longitude, filters, preferences);
  }

  const canScan = !!location.coords && !loading;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>Real Estate Scout</Text>
        <Text style={styles.neighborhood}>
          {data?.neighborhood ?? (location.loading ? 'Getting location...' : 'Vancouver, BC')}
        </Text>
        {data?.marketStats && (
          <Text style={styles.marketLine}>
            {data.marketStats.count.toLocaleString()} listings · median {formatPrice(data.marketStats.medianPrice)} · {data.marketStats.medianDOM}d avg
          </Text>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Narration card */}
        {data?.narration ? (
          <View style={styles.narrationCard}>
            <Text style={styles.narrationText}>{data.narration}</Text>
            <TouchableOpacity
              style={styles.speakBtn}
              onPress={isSpeaking ? stopSpeaking : () => speak(data.narration)}
            >
              <Text style={styles.speakBtnText}>
                {isSpeaking ? '⏹  Stop' : '🔊  Replay'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Scan button */}
        <TouchableOpacity
          style={[styles.scanBtn, !canScan && styles.scanBtnDisabled]}
          onPress={handleScan}
          disabled={!canScan}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.scanBtnText}>
              {location.coords ? '📍  Scan Nearby' : 'Waiting for GPS...'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Errors */}
        {(error || location.error) ? (
          <Text style={styles.error}>{error ?? location.error}</Text>
        ) : null}

        {/* Active listings */}
        {data?.properties && data.properties.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>For Sale Nearby</Text>
            {data.properties.map((p, i) => (
              <PropertyCard key={`active-${p.url}-${i}`} property={p} />
            ))}
          </>
        ) : data && !loading ? (
          <Text style={styles.empty}>
            No active listings within range.{'\n'}Try increasing your search radius in Filters.
          </Text>
        ) : null}

        {/* Recently sold — reference only */}
        {data?.soldProperties && data.soldProperties.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>Recently Sold Nearby</Text>
            <Text style={styles.sectionHint}>For reference — sold in the last 6 months</Text>
            {data.soldProperties.map((p, i) => (
              <PropertyCard key={`sold-${p.url}-${i}`} property={p} sold />
            ))}
          </>
        ) : null}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { backgroundColor: '#1e40af', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  appName: { fontSize: 13, color: '#93c5fd', fontWeight: '500', letterSpacing: 1, textTransform: 'uppercase' },
  neighborhood: { fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 4 },
  marketLine: { fontSize: 13, color: '#bfdbfe', marginTop: 6 },
  scroll: { flex: 1 },
  narrationCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  narrationText: { fontSize: 15, color: '#1e3a8a', lineHeight: 24 },
  speakBtn: { marginTop: 12, alignSelf: 'flex-start' },
  speakBtnText: { fontSize: 14, color: '#2563eb', fontWeight: '600' },
  scanBtn: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  scanBtnDisabled: { backgroundColor: '#93c5fd' },
  scanBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  error: { color: '#dc2626', textAlign: 'center', marginHorizontal: 16, marginBottom: 8 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 15, lineHeight: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#6b7280', letterSpacing: 0.8, textTransform: 'uppercase', marginHorizontal: 16, marginTop: 20, marginBottom: 4 },
  sectionHint: { fontSize: 12, color: '#9ca3af', marginHorizontal: 16, marginBottom: 4 },
  bottomPad: { height: 40 },
});

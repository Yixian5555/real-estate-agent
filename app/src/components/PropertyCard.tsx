import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import type { Property } from '../types';

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  return `$${(price / 1_000).toFixed(0)}k`;
}

function formatDistance(metres?: number): string {
  if (metres === undefined) return '';
  return metres < 1000 ? `${Math.round(metres)}m away` : `${(metres / 1000).toFixed(1)}km away`;
}

export function PropertyCard({ property: p }: { property: Property }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => Linking.openURL(p.url)}
      activeOpacity={0.85}
    >
      {p.images[0] ? (
        <Image source={{ uri: p.images[0] }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.address} numberOfLines={1}>{p.streetAddress}</Text>
          {p.distanceMetres !== undefined && (
            <Text style={styles.distance}>{formatDistance(p.distanceMetres)}</Text>
          )}
        </View>
        <Text style={styles.price}>{formatPrice(p.listingPrice)}</Text>
        <Text style={styles.details}>
          {p.bedroomCount}bd · {p.bathroomCount}ba · {p.houseSize.toLocaleString()} sqft · {p.type}
        </Text>
        {p.areaName ? <Text style={styles.area}>{p.areaName}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  image: { width: '100%', height: 160 },
  imagePlaceholder: { backgroundColor: '#e5e7eb' },
  body: { padding: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  address: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  distance: { fontSize: 12, color: '#6b7280' },
  price: { fontSize: 20, fontWeight: '700', color: '#1d4ed8', marginTop: 4 },
  details: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  area: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
});

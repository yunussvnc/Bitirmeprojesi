import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/src/store/useAuthStore';
import { getMyVenue, Place } from '@/src/services/mekanService';
import PlaceDetailScreen from '@/src/components/domain/place/PlaceDetailScreen';

export default function VenueDashboardScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [venue, setVenue] = useState<Place | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchVenue() {
      try {
        const data = await getMyVenue();
        setVenue(data);
      } catch (err) {
        console.error("Mekan bilgisi alınamadı", err);
      } finally {
        setLoading(false);
      }
    }
    fetchVenue();
  }, []);

  // Re-fetch place data every time this tab gains focus
  useFocusEffect(
    useCallback(() => {
      setRefreshKey((prev) => prev + 1);
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!venue?.id) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  // Render the exact same Place Detail Screen that users see!
  return <PlaceDetailScreen key={refreshKey} providedId={String(venue.id)} isVenueDashboard />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
});

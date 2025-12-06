/**
 * Oneri Screen - Öneri Ekranı (RAG Interface)
 * TODO: Ulaş tarafından tasarlanacak
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button } from 'react-native';
import { OneriRequest, OneriResponse } from '../../types';
import { mekanService } from '../../services/mekanService';
import * as Location from 'expo-location';

const OneriScreen: React.FC = () => {
    const [kullaniciMetni, setKullaniciMetni] = useState('');
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [oneriResponse, setOneriResponse] = useState<OneriResponse | null>(null);
    const [loading, setLoading] = useState(false);

    // Konum izni al
    React.useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const locationData = await Location.getCurrentPositionAsync({});
                setLocation({
                    latitude: locationData.coords.latitude,
                    longitude: locationData.coords.longitude,
                });
            }
        })();
    }, []);

    const handleOneriAl = async () => {
        if (!location || !kullaniciMetni.trim()) {
            return;
        }

        setLoading(true);
        try {
            const request: OneriRequest = {
                kullanici_metni: kullaniciMetni,
                enlem: location.latitude,
                boylam: location.longitude,
            };

            const response = await mekanService.getOneriler(request);
            setOneriResponse(response);
        } catch (error) {
            console.error('Öneri alınırken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    // TODO: UI/UX tasarımı Ulaş tarafından yapılacak (RAG arayüzü)

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mekan Önerisi Al</Text>
            <TextInput
                style={styles.input}
                placeholder="Ne aradığınızı doğal dilde yazın... (örn: 'Sakin bir kafe arıyorum')"
                value={kullaniciMetni}
                onChangeText={setKullaniciMetni}
                multiline
            />
            <Button title="Öneri Al" onPress={handleOneriAl} disabled={loading} />
            {/* Öneri sonuçları gösterilecek */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        minHeight: 100,
    },
});

export default OneriScreen;


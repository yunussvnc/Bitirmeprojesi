/**
 * Mekan List Screen - Mekan Listesi Ekranı
 * TODO: Ulaş tarafından tasarlanacak
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Mekan } from '../../types';
import { mekanService } from '../../services/mekanService';

const MekanListScreen: React.FC = () => {
    const [mekanlar, setMekanlar] = useState<Mekan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMekanlar();
    }, []);

    const loadMekanlar = async () => {
        try {
            const data = await mekanService.getMekanlar();
            setMekanlar(data);
        } catch (error) {
            console.error('Mekanlar yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    // TODO: UI/UX tasarımı Ulaş tarafından yapılacak

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mekanlar</Text>
            {/* Liste eklenecek */}
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
});

export default MekanListScreen;


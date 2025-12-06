/**
 * Mekan Detail Screen - Mekan Detay Ekranı
 * TODO: Ulaş tarafından tasarlanacak
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { Mekan } from '../../types';
import { mekanService } from '../../services/mekanService';

type MekanDetailScreenRouteProp = RouteProp<RootStackParamList, 'MekanDetail'>;

interface Props {
    route: MekanDetailScreenRouteProp;
}

const MekanDetailScreen: React.FC<Props> = ({ route }) => {
    const { mekanId } = route.params;
    const [mekan, setMekan] = useState<Mekan | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMekan();
    }, [mekanId]);

    const loadMekan = async () => {
        try {
            const data = await mekanService.getMekanById(mekanId);
            setMekan(data);
        } catch (error) {
            console.error('Mekan yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    // TODO: UI/UX tasarımı Ulaş tarafından yapılacak

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Yükleniyor...</Text>
            </View>
        );
    }

    if (!mekan) {
        return (
            <View style={styles.container}>
                <Text>Mekan bulunamadı</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{mekan.ad}</Text>
            {/* Detay içeriği eklenecek */}
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

export default MekanDetailScreen;


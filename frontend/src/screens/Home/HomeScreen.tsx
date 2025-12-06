/**
 * Home Screen - Ana Ekran
 * TODO: Ulaş tarafından tasarlanacak
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HomeScreen: React.FC = () => {
    // TODO: UI/UX tasarımı Ulaş tarafından yapılacak

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Ana Sayfa</Text>
            {/* İçerik eklenecek */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});

export default HomeScreen;


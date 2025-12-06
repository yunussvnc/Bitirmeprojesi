/**
 * Login Screen - Giriş Ekranı
 * TODO: Ulaş tarafından tasarlanacak
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const LoginScreen: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();

    // TODO: UI/UX tasarımı Ulaş tarafından yapılacak

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Giriş Yap</Text>
            {/* Form elemanları eklenecek */}
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

export default LoginScreen;


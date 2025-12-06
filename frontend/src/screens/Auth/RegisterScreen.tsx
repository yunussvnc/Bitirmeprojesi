/**
 * Register Screen - Kayıt Ekranı
 * TODO: Ulaş tarafından tasarlanacak
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const RegisterScreen: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { register } = useAuth();

    // TODO: UI/UX tasarımı Ulaş tarafından yapılacak

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Kayıt Ol</Text>
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

export default RegisterScreen;


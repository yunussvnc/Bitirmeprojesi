/**
 * Ana Uygulama Bileşeni
 * Yapay Zeka Destekli Mekan Öneri Platformu - Mobile App
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';

const App: React.FC = () => {
    return (
        <AuthProvider>
            <NavigationContainer>
                <StatusBar barStyle="dark-content" />
                <AppNavigator />
            </NavigationContainer>
        </AuthProvider>
    );
};

export default App;


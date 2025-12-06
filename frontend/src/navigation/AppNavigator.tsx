/**
 * Ana Navigasyon Yapılandırması
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';

// Auth Screens (yorum satırı - sonra eklenecek)
// import LoginScreen from '../screens/Auth/LoginScreen';
// import RegisterScreen from '../screens/Auth/RegisterScreen';

// Main Screens (yorum satırı - sonra eklenecek)
// import HomeScreen from '../screens/Home/HomeScreen';
// import MekanListScreen from '../screens/Mekanlar/MekanListScreen';
// import MekanDetailScreen from '../screens/Mekanlar/MekanDetailScreen';
// import OneriScreen from '../screens/Oneriler/OneriScreen';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        // Loading screen eklenebilir
        return null;
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
                // Auth Stack
                <Stack.Screen name="Auth">
                    {() => (
                        <Stack.Navigator>
                            {/* <Stack.Screen name="Login" component={LoginScreen} /> */}
                            {/* <Stack.Screen name="Register" component={RegisterScreen} /> */}
                        </Stack.Navigator>
                    )}
                </Stack.Screen>
            ) : (
                // Main Stack
                <Stack.Screen name="Main">
                    {() => (
                        <Stack.Navigator>
                            {/* <Stack.Screen name="Home" component={HomeScreen} /> */}
                            {/* <Stack.Screen name="Mekanlar" component={MekanListScreen} /> */}
                            {/* <Stack.Screen name="MekanDetail" component={MekanDetailScreen} /> */}
                            {/* <Stack.Screen name="Oneriler" component={OneriScreen} /> */}
                        </Stack.Navigator>
                    )}
                </Stack.Screen>
            )}
        </Stack.Navigator>
    );
};

export default AppNavigator;


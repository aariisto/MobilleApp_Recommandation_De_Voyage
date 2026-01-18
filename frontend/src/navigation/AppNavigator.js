import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../theme/ThemeProvider';

import LoadingScreen from '../screens/LoadingScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import DetailsScreen from '../screens/DetailsScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ExploreScreen from '../screens/ExploreScreen'; // Ajout de l'importation de l'écran ExploreScreen
import PersonalInfoScreen from '../screens/Profile/PersonalInfoScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BottomTabs() {
  const { colors, isDark } = useAppTheme();

  return (
    <Tab.Navigator 
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Accueil') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Explorer') iconName = focused ? 'compass' : 'compass-outline';
          else if (route.name === 'Favoris') iconName = focused ? 'heart' : 'heart-outline';
          else if (route.name === 'Profil') iconName = focused ? 'person' : 'person-outline';
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      {/* Ajout de ExploreScreen dans l'onglet Explore */}
      <Tab.Screen name="Explorer" component={ExploreScreen} /> 
      <Tab.Screen name="Favoris" component={FavoritesScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { colors, isDark } = useAppTheme();

  // Créer un thème personnalisé basé sur le thème actuel
  const customTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
        },
      };

  return (
    <NavigationContainer theme={customTheme}>
      <Stack.Navigator 
        initialRouteName="Loading"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Loading" component={LoadingScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={BottomTabs} />
        <Stack.Screen name="Details" component={DetailsScreen} />
        <Stack.Screen name="Preferences" component={PreferencesScreen} />
        <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
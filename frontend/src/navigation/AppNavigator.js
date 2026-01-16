import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import LoadingScreen from '../screens/LoadingScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';

import { UserProvider } from '../store/UserContext';
import HomeScreen from '../screens/HomeScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import DetailsScreen from '../screens/DetailsScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import ProfileScreen from '../screens/ProfileScreen';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BottomTabs() {
  return (
    <Tab.Navigator 
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { height: 60, paddingBottom: 10 },
        tabBarActiveTintColor: '#007AFF',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Accueil') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Explorer') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'Favoris') iconName = focused ? 'heart' : 'heart-outline';
          else if (route.name === 'Profil') iconName = focused ? 'person' : 'person-outline';
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Explorer" component={HomeScreen} />
      <Tab.Screen name="Favoris" component={FavoritesScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
  <UserProvider>
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Loading" // <--- ON COMMENCE ICI MAINTENANT
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Loading" component={LoadingScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={BottomTabs} />
        <Stack.Screen name="Details" component={DetailsScreen} />
        <Stack.Screen name="Preferences" component={PreferencesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  </UserProvider>
  );
}
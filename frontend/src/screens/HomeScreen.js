import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native'; 
import Ionicons from 'react-native-vector-icons/Ionicons';

// Algorithmes et Repositories
import { rankCitiesWithPenalty } from '../backend/algorithms/rankUtils';
import { generateUserQueryFromUserId } from '../backend/algorithms/userQuery';
import UserRepository from '../backend/repositories/UserRepository';
import UserCategoryRepository from '../backend/repositories/UserCategoryRepository';
import ThemeFilterService from '../backend/services/ThemeFilterService';
import PlaceLikedRepository from '../backend/repositories/PlaceLikedRepository';
import CityActivityService from '../backend/services/CityActivityService';
import CityRepository from '../backend/repositories/CityRepository';

import cityImages from '../data/cityImages';

const HomeScreen = ({ navigation }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [allRecommendations, setAllRecommendations] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [likedCityIds, setLikedCityIds] = useState(new Set());
  const [suggestedActivities, setSuggestedActivities] = useState([]);

  const categories = ['Nature', 'Histoire', 'Gastronomie', 'Shopping', 'Divertissement'];

  useEffect(() => {
    loadUserProfile();
    loadRecommendations();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserLikesAndActivities();
    }, [])
  );

  // 👇 FONCTION MODIFIÉE POUR RÉCUPÉRER LE NOM DE LA VILLE
  const loadUserLikesAndActivities = async () => {
    try {
      const likesIds = await PlaceLikedRepository.getAllPlacesLiked();
      const idsSet = new Set(likesIds);
      setLikedCityIds(idsSet);

      if (likesIds.length > 0) {
        // Récupère les activités groupées par ID de ville
        const activitiesMap = await CityActivityService.getRecommendationsFromLikedPlaces();
        
        const enrichedList = [];

        // Pour chaque ville, on récupère son nom et on l'ajoute aux activités
        for (const [cityId, places] of Object.entries(activitiesMap)) {
            const city = await CityRepository.getCityById(cityId);
            if (city) {
                // On ajoute le nom de la ville à chaque activité
                const placesWithCityName = places.map(p => ({ 
                    ...p, 
                    cityName: city.name 
                }));
                enrichedList.push(...placesWithCityName);
            }
        }

        // On mélange la liste pour varier les plaisirs (ne pas avoir 2 fois la même ville à la suite)
        const shuffledList = enrichedList.sort(() => Math.random() - 0.5);
        
        setSuggestedActivities(shuffledList);
      } else {
        setSuggestedActivities([]);
      }
    } catch (error) {
      console.error("Erreur chargement likes/activités:", error);
    }
  };

  const toggleLike = async (city) => {
    try {
      if (likedCityIds.has(city.id)) {
        await PlaceLikedRepository.removePlaceLikedByCityId(city.id);
        
        const newSet = new Set(likedCityIds);
        newSet.delete(city.id);
        setLikedCityIds(newSet);
        
        if (newSet.size === 0) setSuggestedActivities([]);
        else loadUserLikesAndActivities();

      } else {
        await PlaceLikedRepository.addPlaceLiked(city.id);
        
        const newSet = new Set(likedCityIds);
        newSet.add(city.id);
        setLikedCityIds(newSet);
        
        loadUserLikesAndActivities();
      }
    } catch (error) {
      console.error("Erreur toggle like:", error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await UserRepository.getProfile(['firstName', 'lastName']);
      setUserProfile(profile);
    } catch (error) {
      console.error("Erreur chargement profil:", error);
    }
  };

  const loadRecommendations = async () => {
    if (selectedCategory) return; 
    setLoading(true);
    try {
      const profile = await UserRepository.getProfile();
      if (profile && profile.id) {
        const userLikes = await UserCategoryRepository.getUserLikes(profile.id);
        const likedCategories = userLikes.map(l => l.category_name);

        if (likedCategories.length > 0) {
           const query = await generateUserQueryFromUserId(profile.id, likedCategories);
           const rankedCities = await rankCitiesWithPenalty(query, profile.id, 20);
           setAllRecommendations(rankedCities);
           setRecommendations(rankedCities);
        } else {
           setRecommendations([]);
           setAllRecommendations([]);
        }
      }
    } catch (error) {
      console.error("Erreur chargement recommandations:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCategoryPress = async (category) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
      setRecommendations(allRecommendations);
    } else {
      setSelectedCategory(category);
      setLoading(true);
      try {
        const cityIds = allRecommendations.map(c => c.id);
        const filteredResults = await ThemeFilterService.filterCitiesByTheme(cityIds, category);
        const filteredCityIds = new Set(filteredResults.map(r => r.cityId));
        const filteredRecs = allRecommendations.filter(c => filteredCityIds.has(c.id));
        setRecommendations(filteredRecs);
      } catch (error) {
        console.error("Erreur filtrage:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const goToDetails = (city) => {
    const maxScore = recommendations[0]?.score || 1;
    navigation.navigate('Details', { city, maxScore });
  };

  const handleActivityPress = async (place) => {
    if (!place.city_id) return;

    try {
        const recommendedCity = allRecommendations.find(c => c.id === place.city_id);
        
        if (recommendedCity) {
            goToDetails(recommendedCity);
            return;
        }

        const parentCity = await CityRepository.getCityById(place.city_id);
        
        if (parentCity) {
            const cityWithSafeScore = { ...parentCity, score: 1 };
            goToDetails(cityWithSafeScore);
        } else {
            Alert.alert("Oups", "Ville introuvable.");
        }
    } catch (error) {
        console.error("Erreur navigation:", error);
    }
  };

  const getThemeIcon = (theme) => {
    switch (theme) {
      case 'Nature': return 'leaf';
      case 'Histoire': return 'library'; 
      case 'Gastronomie': return 'restaurant';
      case 'Shopping': return 'cart';
      case 'Divertissement': return 'ticket'; 
      default: return 'location';
    }
  };

  const getThemeColors = (theme) => {
    switch (theme) {
      case 'Nature': return { bg: '#E8F5E9', text: '#2E7D32', border: '#C8E6C9' };
      case 'Histoire': return { bg: '#FFF3E0', text: '#EF6C00', border: '#FFE0B2' };
      case 'Gastronomie': return { bg: '#FCE4EC', text: '#C2185B', border: '#F8BBD0' };
      case 'Shopping': return { bg: '#F3E5F5', text: '#7B1FA2', border: '#E1BEE7' };
      case 'Divertissement': return { bg: '#E3F2FD', text: '#1565C0', border: '#BBDEFB' };
      default: return { bg: '#F5F5F5', text: '#616161', border: '#E0E0E0' };
    }
  };

  const renderHorizontalItem = ({ item }) => {
    const localImage = cityImages[item.name];
    const imageSource = localImage 
        ? localImage 
        : { uri: `http://10.0.2.2:5001/api/travel/photos/image/search?q=${encodeURIComponent(item.name)}&size=regular` };

    const isLiked = likedCityIds.has(item.id);

    return (
      <TouchableOpacity style={styles.cardHorizontal} onPress={() => goToDetails(item)}>
        <Image 
          source={imageSource} 
          style={styles.cardImage} 
          defaultSource={{ uri: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1' }}
        />
        
        <TouchableOpacity 
            style={styles.heartButton} 
            onPress={() => toggleLike(item)}
            activeOpacity={0.7}
        >
            <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={22} 
                color={isLiked ? "#FF3B30" : "white"} 
            />
        </TouchableOpacity>
        
        <View style={styles.textOverlay}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>
            Score: {Math.round(item.score * 100)}% 
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderActivityItem = (place, index) => {
    const colors = getThemeColors(place.theme);
    const iconName = getThemeIcon(place.theme);

    return (
      <TouchableOpacity 
        key={index} 
        style={styles.cardVertical}
        onPress={() => handleActivityPress(place)}
        activeOpacity={0.7}
      >
          <View style={[styles.iconContainer, { backgroundColor: colors.bg }]}>
             <Ionicons name={iconName} size={32} color={colors.text} />
          </View>

          <View style={styles.cardInfo}>
              <Text style={styles.verticalTitle} numberOfLines={1}>{place.name}</Text>
              
              {/* 👇 AFFICHAGE DU NOM DE LA VILLE ICI */}
              <Text style={styles.verticalSubtitle} numberOfLines={1}>
                 {place.cityName || 'Destination'}
              </Text>
              
              {place.theme && (
                <View style={[styles.tag, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                    <Text style={[styles.tagText, { color: colors.text }]}>{place.theme}</Text>
                </View>
              )}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Image source={{uri: 'https://randomuser.me/api/portraits/women/44.jpg'}} style={styles.avatar} />
        <Text style={styles.greeting}>
          Bonjour {userProfile?.firstName || 'Voyageur'}
        </Text>
        <TouchableOpacity><Ionicons name="notifications-outline" size={24} color="black" /></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, marginTop: 15 }}>
          {categories.map((cat, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipSelected]}
              onPress={() => handleCategoryPress(cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextSelected]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Recommandations pour vous</Text>
        
        {loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={{marginVertical: 20}} />
        ) : recommendations.length > 0 ? (
            <FlatList 
              horizontal 
              data={recommendations} 
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderHorizontalItem} 
              extraData={likedCityIds}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            />
        ) : (
            <View style={{paddingHorizontal: 20}}>
                <Text style={{color: 'gray', fontStyle: 'italic'}}>Répondez au quiz pour obtenir des recommandations !</Text>
            </View>
        )}

        <Text style={styles.sectionTitle}>Activité qui pourrait vous plaire</Text>
        
        {likedCityIds.size > 0 && suggestedActivities.length > 0 ? (
          <View style={{ marginBottom: 20 }}>
            {suggestedActivities.slice(0, 5).map((place, index) => renderActivityItem(place, index))}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
              <Text style={{ color: 'gray', fontStyle: 'italic', lineHeight: 20 }}>
                Ajoutez des villes en favoris ❤️ pour voir des activités proposées ici !
              </Text>
          </View>
        )}
        
        <View style={{height: 60}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10, paddingTop: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  greeting: { fontSize: 18, fontWeight: 'bold', flex: 1, marginLeft: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', margin: 20, marginBottom: 15, marginTop: 25 },
  
  cardHorizontal: { width: 220, height: 280, marginRight: 15, borderRadius: 20, overflow: 'hidden', backgroundColor: 'black' },
  cardImage: { width: '100%', height: '100%', opacity: 0.8 },
  
  heartButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.3)', 
    borderRadius: 20,
    padding: 6,
    zIndex: 10
  },

  textOverlay: { position: 'absolute', bottom: 15, left: 15 },
  cardTitle: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  cardSubtitle: { color: 'white', fontSize: 12 },
  categoryChip: { backgroundColor: '#DDEEFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginRight: 10 },
  categoryChipSelected: { backgroundColor: '#007AFF' },
  categoryText: { color: '#333' },
  categoryTextSelected: { color: 'white', fontWeight: 'bold' },
  
  cardVertical: { flexDirection: 'row', backgroundColor: 'white', marginHorizontal: 20, borderRadius: 20, marginBottom: 15, padding: 10, alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  
  iconContainer: { 
      width: 80, 
      height: 80, 
      borderRadius: 15, 
      justifyContent: 'center', 
      alignItems: 'center' 
  },

  cardInfo: { marginLeft: 15, flex: 1 },
  verticalTitle: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  verticalSubtitle: { color: 'gray', marginBottom: 5, fontSize: 12 },
  
  tag: { 
      alignSelf: 'flex-start', 
      paddingHorizontal: 10, 
      paddingVertical: 4, 
      borderRadius: 8, 
      borderWidth: 1,
      marginTop: 5
  },
  tagText: { fontSize: 11, fontWeight: 'bold' }
});

export default HomeScreen;
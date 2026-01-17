import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native'; // <--- IMPORT IMPORTANT
import Ionicons from 'react-native-vector-icons/Ionicons';

// Algorithmes et Repositories
import { rankCitiesWithPenalty } from '../backend/algorithms/rankUtils';
import { generateUserQueryFromUserId } from '../backend/algorithms/userQuery';
import UserRepository from '../backend/repositories/UserRepository';
import UserCategoryRepository from '../backend/repositories/UserCategoryRepository';
import ThemeFilterService from '../backend/services/ThemeFilterService';
import PlaceLikedRepository from '../backend/repositories/PlaceLikedRepository';

import cityImages from '../data/cityImages';

const HomeScreen = ({ navigation }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [allRecommendations, setAllRecommendations] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // State pour les IDs likés
  const [likedCityIds, setLikedCityIds] = useState(new Set());

  const categories = ['Nature', 'Histoire', 'Gastronomie', 'Shopping', 'Divertissement'];

  useEffect(() => {
    loadUserProfile();
    loadRecommendations();
    // On retire loadUserLikes() d'ici, car on va le mettre dans useFocusEffect
  }, []);

  // --- SYNCHRONISATION DES LIKES ---
  // Se déclenche à chaque fois qu'on revient sur cet écran (depuis Favoris par exemple)
  useFocusEffect(
    useCallback(() => {
      loadUserLikes();
    }, [])
  );

  const loadUserLikes = async () => {
    try {
      const likes = await PlaceLikedRepository.getAllPlacesLiked();
      // On recrée un Set frais
      const ids = new Set(likes.map(like => like.id_places));
      setLikedCityIds(ids);
    } catch (error) {
      console.error("Erreur chargement likes:", error);
    }
  };

  const toggleLike = async (city) => {
    try {
      if (likedCityIds.has(city.id)) {
        // Suppression
        await PlaceLikedRepository.removePlaceLikedByPlaceId(city.id);
        // Mise à jour locale immédiate
        setLikedCityIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(city.id);
          return newSet;
        });
      } else {
        // Ajout
        await PlaceLikedRepository.addPlaceLiked(city.id);
        // Mise à jour locale immédiate
        setLikedCityIds(prev => {
          const newSet = new Set(prev);
          newSet.add(city.id);
          return newSet;
        });
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

  const renderHorizontalItem = ({ item }) => {
    const localImage = cityImages[item.name];
    const imageSource = localImage 
        ? localImage 
        : { uri: `http://10.0.2.2:5001/api/travel/photos/image/search?q=${encodeURIComponent(item.name)}&size=regular` };

    // Vérification en direct
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
              
              // --- TRES IMPORTANT : extraData oblige la liste à se rafraichir quand likedCityIds change ---
              extraData={likedCityIds}
              
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            />
        ) : (
            <View style={{paddingHorizontal: 20}}>
                <Text style={{color: 'gray', fontStyle: 'italic'}}>Répondez au quiz pour obtenir des recommandations !</Text>
            </View>
        )}

        <Text style={styles.sectionTitle}>Recommandé pour vous</Text>
        <TouchableOpacity style={styles.cardVertical}>
            <Image source={{uri: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963'}} style={styles.verticalImage}/>
            <View style={styles.cardInfo}>
                <Text style={styles.verticalTitle}>Cinque Terre, Italie</Text>
                <Text style={styles.verticalSubtitle}>Côte pittoresque</Text>
                <View style={styles.tag}><Text style={styles.tagText}>Romantique</Text></View>
            </View>
        </TouchableOpacity>
        
        <View style={{height: 80}} />
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
  cardVertical: { flexDirection: 'row', backgroundColor: 'white', marginHorizontal: 20, borderRadius: 20, marginBottom: 15, padding: 10, alignItems: 'center' },
  verticalImage: { width: 80, height: 80, borderRadius: 15 },
  cardInfo: { marginLeft: 15, flex: 1 },
  verticalTitle: { fontWeight: 'bold', fontSize: 16 },
  verticalSubtitle: { color: 'gray', marginBottom: 5 },
  tag: { backgroundColor: '#FFE4C4', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tagText: { color: '#D2691E', fontSize: 10, fontWeight: 'bold' }
});

export default HomeScreen;
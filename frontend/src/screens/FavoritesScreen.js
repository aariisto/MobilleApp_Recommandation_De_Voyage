import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native'; 
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../theme/ThemeProvider';

// Import des Repositories
import PlaceLikedRepository from '../backend/repositories/PlaceLikedRepository';
import CityRepository from '../backend/repositories/CityRepository';
import cityImages from '../data/cityImages';

const FavoritesScreen = ({ navigation }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Recharge la liste à chaque fois qu'on arrive sur l'onglet
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    setLoading(true);
    try {
      // 1. Récupérer les likes (C'est maintenant un tableau direct d'IDs : [1, 5, 12])
      const likedIds = await PlaceLikedRepository.getAllPlacesLiked();
      
      if (likedIds.length > 0) {
        // 2. Plus besoin de .map(l => l.id_places), on a déjà les IDs !
        const citiesPromises = likedIds.map(id => CityRepository.getCityById(id));
        const cities = await Promise.all(citiesPromises);
        
        // On filtre les nulls au cas où une ville n'existe plus
        setFavorites(cities.filter(c => c !== null));
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error("Erreur chargement favoris:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlike = async (cityId) => {
    try {
      // CORRECTION : On utilise la même fonction que dans HomeScreen
      await PlaceLikedRepository.removePlaceLikedByCityId(cityId);
      
      // Mise à jour visuelle immédiate
      setFavorites(prevFavorites => prevFavorites.filter(item => item.id !== cityId));
    } catch (error) {
      console.error("Impossible de retirer le favori", error);
      Alert.alert("Erreur", "Impossible de mettre à jour les favoris pour le moment.");
    }
  };

  const goToDetails = (city) => {
      // On donne un score par défaut de 1 (100%) car c'est un favori
      const cityWithScore = { ...city, score: 1 }; 
      
      navigation.navigate('Details', { 
          city: cityWithScore, 
          maxScore: 1 
      });
  };

  const renderFavoriteCard = ({ item }) => {
    const localImage = cityImages[item.name];
    const imageSource = localImage 
        ? localImage 
        : { uri: `http://10.0.2.2:5001/api/travel/photos/image/search?q=${encodeURIComponent(item.name)}&size=regular` };

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => goToDetails(item)}
        activeOpacity={0.9}
      >
        <Image 
            source={imageSource} 
            style={styles.cardImage}
            defaultSource={{ uri: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1' }}
        />
        <View style={styles.darkOverlay} />

        <TouchableOpacity 
            style={styles.heartButton} 
            onPress={() => handleUnlike(item.id)}
            activeOpacity={0.7}
        >
            <Ionicons name="heart" size={24} color="#FF3B30" /> 
        </TouchableOpacity>

        <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={14} color="#ddd" style={{marginRight: 4}}/>
                <Text style={styles.cardSubtitle}>{item.country || 'Destination'}</Text>
            </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.headerRow}>
        <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.navigate('Accueil')}
        >
            <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        
        <View>
            <Text style={styles.headerTitle}>Mes Favoris</Text>
            <Text style={styles.headerSubtitle}>
                {favorites.length} {favorites.length > 1 ? 'lieux enregistrés' : 'lieu enregistré'}
            </Text>
        </View>
      </View>

      {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#004aad" />
          </View>
      ) : favorites.length > 0 ? (
          <FlatList
            data={favorites}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderFavoriteCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
      ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
                <Ionicons name="heart-outline" size={50} color="#ccc" />
            </View>
            <Text style={styles.emptyText}>Votre liste est vide</Text>
            <Text style={styles.emptySubText}>
                Explorez le monde et cliquez sur le cœur pour sauvegarder vos coups de cœur ici.
            </Text>
          </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  
  headerRow: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      paddingHorizontal: 20, 
      paddingTop: 10, 
      paddingBottom: 15 
  },
  backButton: {
      marginRight: 15,
      padding: 8,
      borderRadius: 12,
      backgroundColor: '#E9ECEF'
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  headerSubtitle: { fontSize: 13, color: 'gray' },
  
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  
  card: { 
      height: 200, 
      width: '100%',
      marginBottom: 20, 
      borderRadius: 20, 
      overflow: 'hidden',
      backgroundColor: 'black',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 6
  },
  cardImage: { width: '100%', height: '100%' },
  
  darkOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0, top: 0,
    backgroundColor: 'rgba(0,0,0,0.25)'
  },

  heartButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'white',
    borderRadius: 20,
    width: 40, 
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3
  },

  textContainer: { 
      position: 'absolute', 
      bottom: 20, 
      left: 20 
  },
  cardTitle: { 
      color: 'white', 
      fontWeight: 'bold', 
      fontSize: 22,
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: {width: -1, height: 1},
      textShadowRadius: 10
  },
  locationContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  cardSubtitle: { 
      color: '#eee', 
      fontSize: 14, 
      fontWeight: '600' 
  },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: -50 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E9ECEF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  emptySubText: { fontSize: 14, color: 'gray', marginTop: 10, textAlign: 'center', width: '70%', lineHeight: 20 }
});

export default FavoritesScreen;
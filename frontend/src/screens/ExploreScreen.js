import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import CityRepository from '../backend/repositories/CityRepository';
import cityImages from '../data/cityImages';
import { getClimate, getClimateIcon, getClimateColor, getClimateLabel } from '../data/climateData';

const ExploreScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedClimate, setSelectedClimate] = useState(null); // null = tous, 'froid', 'tempéré', 'chaud'

  useFocusEffect(
    useCallback(() => {
      loadRandomCities();
    }, [selectedDate, selectedClimate]) // Recharger quand la date ou le climat change
  );

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const toggleClimateFilter = (climate) => {
    // Si on clique sur le filtre déjà actif, on le désactive
    setSelectedClimate(selectedClimate === climate ? null : climate);
  };

  const loadRandomCities = async () => {
    setLoading(true);
    try {
      // Récupérer toutes les villes
      const allCities = await CityRepository.getAllCities();
      
      // Filtrer par climat si un filtre est actif
      let filteredCities = allCities;
      if (selectedClimate) {
        filteredCities = allCities.filter(city => {
          const climate = getClimate(city.name, selectedDate);
          return climate === selectedClimate;
        });
      }
      
      // Mélanger aléatoirement et prendre 10
      const shuffled = filteredCities.sort(() => 0.5 - Math.random());
      const randomCities = shuffled.slice(0, 10);
      
      setCities(randomCities);
    } catch (error) {
      console.error("Erreur chargement villes aléatoires:", error);
    } finally {
      setLoading(false);
    }
  };

  const goToDetails = (city) => {
    // Score neutre pour une ville explorée aléatoirement
    const cityWithScore = { ...city, score: 0.5 };
    navigation.navigate('Details', { city: cityWithScore, maxScore: 1 });
  };

  const renderCityCard = ({ item }) => {
    const localImage = cityImages[item.name];
    const imageSource = localImage 
      ? localImage 
      : { uri: `http://10.0.2.2:5001/api/travel/photos/image/search?q=${encodeURIComponent(item.name)}&size=regular` };

    // Utiliser la date sélectionnée pour déterminer le climat
    const climate = getClimate(item.name, selectedDate);
    const climateIcon = getClimateIcon(climate);
    const climateColor = getClimateColor(climate);
    const climateLabel = getClimateLabel(climate);

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
        
        {/* Badge climat avec saison */}
        <View style={[styles.climateBadge, { backgroundColor: climateColor }]}>
          <Ionicons name={climateIcon} size={14} color="#fff" />
          <Text style={styles.climateText}>{climateLabel}</Text>
        </View>
        
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#004aad" />
          <Text style={[styles.loadingText, { color: theme.text }]}>Chargement des destinations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Explorer</Text>
        <TouchableOpacity onPress={loadRandomCities}>
          <Ionicons name="refresh-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.subtitle, { color: theme.text }]}>Découvrez de nouvelles destinations</Text>
      <Text style={[styles.subtitle, { color: theme.text }]}>Date d'arrivée :</Text>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        {/* Sélecteur de date */}
        <TouchableOpacity style={[styles.dateButton, { backgroundColor: theme.card }]} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={18} color={theme.primary} />
          <Text style={[styles.dateText, { color: theme.primary }]}>
            {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </TouchableOpacity>

        {/* Filtres de climat */}
        <View style={styles.climateFilters}>
          <TouchableOpacity 
            style={[
              styles.climateFilterButton, 
              { backgroundColor: theme.card, borderColor: theme.border },
              selectedClimate === 'froid' && { backgroundColor: '#4A90E2', borderColor: '#4A90E2' }
            ]}
            onPress={() => toggleClimateFilter('froid')}
          >
            <Ionicons name="snow-outline" size={16} color={selectedClimate === 'froid' ? '#fff' : '#4A90E2'} />
            <Text style={[
              styles.climateFilterText, 
              { color: theme.text },
              selectedClimate === 'froid' && styles.climateFilterTextActive
            ]}>
              Froid
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.climateFilterButton, 
              { backgroundColor: theme.card, borderColor: theme.border },
              selectedClimate === 'tempéré' && { backgroundColor: '#FFA726', borderColor: '#FFA726' }
            ]}
            onPress={() => toggleClimateFilter('tempéré')}
          >
            <Ionicons name="partly-sunny-outline" size={16} color={selectedClimate === 'tempéré' ? '#fff' : '#FFA726'} />
            <Text style={[
              styles.climateFilterText, 
              { color: theme.text },
              selectedClimate === 'tempéré' && styles.climateFilterTextActive
            ]}>
              Tempéré
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.climateFilterButton, 
              { backgroundColor: theme.card, borderColor: theme.border },
              selectedClimate === 'chaud' && { backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' }
            ]}
            onPress={() => toggleClimateFilter('chaud')}
          >
            <Ionicons name="sunny-outline" size={16} color={selectedClimate === 'chaud' ? '#fff' : '#FF6B6B'} />
            <Text style={[
              styles.climateFilterText, 
              { color: theme.text },
              selectedClimate === 'chaud' && styles.climateFilterTextActive
            ]}>
              Chaud
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      <FlatList
        data={cities}
        renderItem={renderCityCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 10,
    gap: 8,
  },
  dateText: {
    color: '#004aad',
    fontSize: 14,
    fontWeight: '600',
  },
  climateFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  climateFilterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 5,
  },
  climateFilterActive: {
    backgroundColor: '#004aad',
    borderColor: '#004aad',
  },
  climateFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  climateFilterTextActive: {
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 15,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  textContainer: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#ddd',
  },
  climateBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 4,
  },
  climateText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default ExploreScreen;
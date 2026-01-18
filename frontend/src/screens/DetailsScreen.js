import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Animated, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import cityImages from '../data/cityImages';
import flightPricesData from '../data/flightPrices.json'; 

// Imports Backend
import CityRepository from '../backend/repositories/CityRepository';
import ThemeFilterService from '../backend/services/ThemeFilterService';
import CityActivityService from '../backend/services/CityActivityService';
import PlaceLikedRepository from '../backend/repositories/PlaceLikedRepository';

const { height } = Dimensions.get('window');

const DetailsScreen = ({ route, navigation }) => {
  const { city, maxScore = 1 } = route.params;
  
  const stars = maxScore > 0 ? (city.score / maxScore) * 5 : 0;
  const fullStars = Math.floor(stars);
  const hasHalfStar = (stars % 1) > 0;
  
  const [description, setDescription] = useState('');
  const [loadingDesc, setLoadingDesc] = useState(true);
  const [cityThemes, setCityThemes] = useState([]);
  const [loadingThemes, setLoadingThemes] = useState(true);
  const [activities, setActivities] = useState({});
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [showActivities, setShowActivities] = useState(false);
  const [cityCoordinates, setCityCoordinates] = useState(null);

  // etat pour le like
  const [isLiked, setIsLiked] = useState(false);

  // States pour la recherche de vol
  const [showFlightSearch, setShowFlightSearch] = useState(false);
  const [originCity, setOriginCity] = useState('Paris');
  const [flightDate, setFlightDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [flightPrice, setFlightPrice] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(height)).current;

  // Animation Panel Vol
  useEffect(() => {
    if (showFlightSearch) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showFlightSearch]);

  // Vérification si la ville est likée
  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const likedIds = await PlaceLikedRepository.getAllPlacesLiked();
        // Si l'ID de la ville actuelle est dans la liste, le cœur sera rouge
        if (likedIds.includes(city.id)) {
            setIsLiked(true);
        }
      } catch (error) {
        console.error("Erreur vérification like:", error);
      }
    };
    checkLikeStatus();
  }, [city.id]);

  //  Fonction afin d'ajouter ou de retirer le like
  const toggleLike = async () => {
    try {
        if (isLiked) {
            // Suppression de l'endroit liké
            await PlaceLikedRepository.removePlaceLikedByCityId(city.id);
            setIsLiked(false);
        } else {
            // Ajout de l'endroit liké
            await PlaceLikedRepository.addPlaceLiked(city.id);
            setIsLiked(true);
        }
    } catch (error) {
        console.error("Erreur toggle like details:", error);
    }
  };

  const fetchPrice = async () => {
    if (!originCity) return alert("Veuillez entrer une ville de départ");
    setLoadingPrice(true);
    setFlightPrice(null);
    setTimeout(() => {
        try {
            const originClean = originCity.trim().toUpperCase();
            const destClean = city.name.trim().toUpperCase();
            const searchKey = `${originClean}_${destClean}`;
            const keyParisFallback = `PARIS_${destClean}`;
            
            let foundData = flightPricesData[searchKey];
            if (!foundData && originClean === 'PARIS') {
                foundData = flightPricesData[keyParisFallback];
            }

            if (foundData && foundData.price) {
                setFlightPrice({
                    amount: foundData.price.amount,
                    currency: foundData.price.currency
                });
            } else {
                const mockPrice = Math.floor(Math.random() * (500 - 100 + 1) + 100);
                setFlightPrice({
                    amount: mockPrice.toString(),
                    currency: 'EUR'
                });
            }
        } catch (error) {
            console.error("Erreur calcul prix:", error);
            alert("Erreur lors du calcul du prix.");
        } finally {
            setLoadingPrice(false);
        }
    }, 500);
  };

  useEffect(() => {
    const fetchDescription = async () => {
      try {
        const desc = await CityRepository.getDescriptionById(city.id);
        setDescription(desc || "Aucune description disponible pour cette ville.");
      } catch (error) {
        console.error("Erreur chargement description:", error);
        setDescription("Impossible de charger la description.");
      } finally {
        setLoadingDesc(false);
      }
    };

    const fetchThemes = async () => {
      try {
        const themes = await ThemeFilterService.getCityThemes(city.id);
        setCityThemes(themes);
      } catch (error) {
        console.error("Erreur chargement thèmes:", error);
        setCityThemes([]);
      } finally {
        setLoadingThemes(false);
      }
    };

    const fetchActivities = async () => {
        setLoadingActivities(true);
        try {
            const acts = await CityActivityService.getCityActivities(city.id);
            setActivities(acts);
        } catch (error) {
            console.error("Erreur chargement activités:", error);
        } finally {
            setLoadingActivities(false);
        }
    };

    const fetchCityCoordinates = async () => {
        try {
            let cityData = await CityRepository.getCityById(city.id);
            if (!cityData) {
                const searchResults = await CityRepository.searchCitiesByName(city.name);
                if (searchResults && searchResults.length > 0) {
                    cityData = searchResults.find(c => c.name.toLowerCase() === city.name.toLowerCase()) || searchResults[0];
                }
            }
            if (cityData) {
                const lat = cityData.lat !== undefined ? cityData.lat : cityData.latitude;
                const lon = cityData.lon !== undefined ? cityData.lon : cityData.longitude;
                if (lat !== undefined && lon !== undefined) {
                    setCityCoordinates({
                        latitude: parseFloat(lat),
                        longitude: parseFloat(lon)
                    });
                }
            }
        } catch (error) {
            console.error("Erreur chargement coordonnées:", error);
        }
    };

    if (city && city.id) {
        fetchDescription();
        fetchThemes();
        fetchActivities();
        fetchCityCoordinates();
    }
  }, [city]);

  const localImage = cityImages[city.name];
  const imageSource = localImage 
      ? localImage 
      : { uri: `http://10.0.2.2:5001/api/travel/photos/image/search?q=${encodeURIComponent(city.name)}&size=regular` };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Image en tête */}
        <View>
            <Image 
                source={imageSource} 
                style={styles.imageHeader} 
                defaultSource={{ uri: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1' }}
            />
            <SafeAreaView style={styles.headerIcons} edges={['top']}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <Ionicons name="arrow-back" size={20} color="black" />
                </TouchableOpacity>
                
                <View style={{flexDirection:'row'}}>
                    
                    <TouchableOpacity style={styles.iconBtn} onPress={toggleLike}>
                         <Ionicons 
                            name={isLiked ? "heart" : "heart-outline"} 
                            size={20} 
                            color={isLiked ? "#FF3B30" : "black"} 
                         />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>

        <View style={styles.content}>
            <Text style={styles.title}>{city.name}</Text>
            <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color="#007AFF" />
                <Text style={styles.locationText}>Destination recommandée</Text>
            </View>
            <View style={styles.ratingRow}>
                {[...Array(fullStars)].map((_, i) => <Ionicons key={i} name="star" size={16} color="#FFD700" />)}
                {hasHalfStar && <Ionicons name="star-half" size={16} color="#FFD700" />}
                <Text style={styles.ratingText}>
                     {city.score ? `${Math.round(city.score * 100)}% Match` : 'Populaire'}
                </Text>
            </View>

            <View style={styles.features}>
                {loadingThemes ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                ) : cityThemes.length > 0 ? (
                    cityThemes.map((themeObj, index) => {
                        const themeConfig = {
                            'Nature': { icon: 'leaf', label: 'Nature' },
                            'Histoire': { icon: 'book', label: 'Histoire' },
                            'Gastronomie': { icon: 'restaurant', label: 'Gastronomie' },
                            'Shopping': { icon: 'cart', label: 'Shopping' },
                            'Divertissement': { icon: 'game-controller', label: 'Divertissement' }
                        };
                        const config = themeConfig[themeObj.theme] || { icon: 'star', label: themeObj.theme };
                        
                        return (
                            <View key={index} style={styles.featureItem}>
                                <Ionicons name={config.icon} size={24} color="#007AFF"/>
                                <Text style={styles.featureText}>{config.label}</Text>
                            </View>
                        );
                    })
                ) : (
                    <>
                        <View style={styles.featureItem}><Ionicons name="time-outline" size={24} color="#007AFF"/><Text style={styles.featureText}>Culture</Text></View>
                        <View style={styles.featureItem}><Ionicons name="restaurant-outline" size={24} color="#007AFF"/><Text style={styles.featureText}>Cuisine</Text></View>
                    </>
                )}
            </View>

            <Text style={styles.sectionHeader}>Description</Text>
            {loadingDesc ? (
                <ActivityIndicator size="small" color="#007AFF" />
            ) : (
                <Text style={styles.descText}>
                    {description}
                </Text>
            )}

            <TouchableOpacity style={styles.accordionHeader} onPress={() => setShowActivities(!showActivities)}>
                <View style={styles.accordionTitleContainer}>
                    <Ionicons name="compass" size={22} color="#007AFF" />
                    <Text style={styles.accordionTitle}>Centres d'intérêt</Text>
                </View>
                <View style={[styles.chevronContainer, showActivities && styles.chevronRotated]}>
                    <Ionicons name="chevron-down" size={20} color="#007AFF" />
                </View>
            </TouchableOpacity>
            
            {showActivities && (
                <View style={styles.activitiesContainer}>
                    {loadingActivities ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text style={styles.loadingText}>Chargement des activités...</Text>
                        </View>
                    ) : (
                        Object.entries(activities).map(([theme, items]) => {
                            if (items.length === 0) return null;
                            
                            const themeConfig = {
                                'Nature': { color: '#06B6D4', icon: 'leaf', bgColor: '#CFFAFE' },
                                'Histoire': { color: '#3B82F6', icon: 'book', bgColor: '#DBEAFE' },
                                'Gastronomie': { color: '#0EA5E9', icon: 'restaurant', bgColor: '#E0F2FE' },
                                'Shopping': { color: '#2563EB', icon: 'cart', bgColor: '#DBEAFE' },
                                'Divertissement': { color: '#1D4ED8', icon: 'game-controller', bgColor: '#BFDBFE' }
                            };
                            const config = themeConfig[theme] || { color: '#3B82F6', icon: 'star', bgColor: '#DBEAFE' };
                            
                            return (
                                <View key={theme} style={[styles.activityCard, { borderLeftColor: config.color }]}>
                                    <View style={styles.activityCardHeader}>
                                        <View style={[styles.themeIconContainer, { backgroundColor: config.bgColor }]}>
                                            <Ionicons name={config.icon} size={20} color={config.color} />
                                        </View>
                                        <Text style={[styles.activityThemeTitle, { color: config.color }]}>{theme}</Text>
                                        <View style={styles.themeBadge}>
                                            <Text style={styles.themeBadgeText}>{items.length}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.activityList}>
                                        {items.map((item, idx) => (
                                            <View key={idx} style={styles.activityItem}>
                                                <View style={styles.activityDot} />
                                                <Text style={styles.activityName} numberOfLines={2}>{item.name}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            );
                        })
                    )}
                    {!loadingActivities && Object.values(activities).every(arr => arr.length === 0) && (
                        <View style={styles.emptyStateContainer}>
                            <Ionicons name="search-outline" size={48} color="#ccc" />
                            <Text style={styles.emptyStateText}>Aucun centre d'intérêt trouvé</Text>
                            <Text style={styles.emptyStateSubtext}>Essayez une autre ville</Text>
                        </View>
                    )}
                </View>
            )}

             <View style={styles.accordionHeader}>
                <View style={styles.accordionTitleContainer}>
                    <Ionicons name="location" size={22} color="#007AFF" />
                    <Text style={styles.accordionTitle}>Localisation</Text>
                </View>
            </View>
            
            <View style={styles.activitiesContainer}>
                <View style={styles.locationSection}>
                    <View style={styles.mapContainer}>
                    {cityCoordinates ? (
                        <WebView
                            style={styles.mapView}
                            source={{
                                html: `
                                    <!DOCTYPE html>
                                    <html>
                                    <head>
                                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                                        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                                        <style>
                                            body { margin: 0; padding: 0; }
                                            #map { height: 100vh; width: 100%; }
                                        </style>
                                    </head>
                                    <body>
                                        <div id="map"></div>
                                        <script>
                                            var map = L.map('map').setView([${cityCoordinates.latitude}, ${cityCoordinates.longitude}], 13);
                                            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                                                attribution: '© OpenStreetMap contributors'
                                            }).addTo(map);
                                            var marker = L.marker([${cityCoordinates.latitude}, ${cityCoordinates.longitude}]).addTo(map);
                                            marker.bindPopup('<b>${city.name}</b><br>Destination').openPopup();
                                        </script>
                                    </body>
                                    </html>
                                `
                            }}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                        />
                    ) : (
                        <View style={styles.mapPlaceholder}>
                            <ActivityIndicator size="large" color="#3B82F6" />
                            <Text style={styles.mapPlaceholderText}>Chargement de la carte...</Text>
                        </View>
                    )}
                    </View>
                    <View style={styles.coordinatesContainer}>
                        <Text style={styles.coordinatesText}>
                            {cityCoordinates ? `${cityCoordinates.latitude.toFixed(4)}°, ${cityCoordinates.longitude.toFixed(4)}°` : 'Coordonnées non disponibles'}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
            <Text style={styles.price}>Explorer</Text>
            <Text style={styles.perNight}>dès maintenant</Text>
        </View>
        <TouchableOpacity style={styles.bookBtn} onPress={() => setShowFlightSearch(true)}>
            <Text style={styles.bookText}>Voir les vols</Text>
        </TouchableOpacity>
      </View>

      {showFlightSearch && (
        <TouchableOpacity 
            style={styles.overlay} 
            activeOpacity={1} 
            onPress={() => setShowFlightSearch(false)}
        />
      )}
      
      <Animated.View style={[styles.flightPanel, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>Recherche de Vol</Text>
                <TouchableOpacity onPress={() => setShowFlightSearch(false)}>
                    <Ionicons name="close-circle" size={28} color="#ccc" />
                </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Ville de départ</Text>
                <TextInput 
                    style={[styles.input, styles.inputDisabled]} 
                    placeholder="Ex: Paris, Lyon..." 
                    value={originCity}
                    editable={false}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Date de départ</Text>
                <TouchableOpacity 
                    style={[styles.input, styles.datePickerButton]} 
                    onPress={() => setShowDatePicker(true)}
                >
                    <Ionicons name="calendar-outline" size={20} color="#007AFF" style={{marginRight: 10}} />
                    <Text style={styles.dateText}>{flightDate.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={flightDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        minimumDate={new Date()}
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(Platform.OS === 'ios');
                            if (selectedDate) {
                                setFlightDate(selectedDate);
                            }
                        }}
                    />
                )}
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Ville d'arrivée</Text>
                <View style={[styles.input, {backgroundColor: '#f0f0f0', justifyContent:'center'}]}>
                    <Text style={{color:'#555'}}>{city.name}</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.searchBtn} onPress={fetchPrice} disabled={loadingPrice}>
                {loadingPrice ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.searchBtnText}>Calculer le prix du vol</Text>
                )}
            </TouchableOpacity>

            {flightPrice && (
                <View style={styles.resultContainer}>
                    <Text style={styles.resultLabel}>Meilleur prix trouvé :</Text>
                    <Text style={styles.resultPrice}>
                        {flightPrice.amount} {flightPrice.currency}
                    </Text>
                    <Text style={styles.resultInfo}>Vol direct (estimé)</Text>
                </View>
            )}
      </Animated.View>

    </View>
  );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 10
    },
    flightPanel: {
        position: 'absolute',
        left: 0, right: 0, bottom: 0,
        height: height * 0.8,
        backgroundColor: 'white',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 20,
        zIndex: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    panelTitle: { fontSize: 20, fontWeight: 'bold' },
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 14, color: 'gray', marginBottom: 5 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16 },
    inputDisabled: { backgroundColor: '#f5f5f5', color: '#999' },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    dateText: {
        fontSize: 16,
        color: '#333',
        flex: 1
    },
    searchBtn: { backgroundColor: '#007AFF', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 10 },
    searchBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    resultContainer: { marginTop: 20, padding: 15, backgroundColor: '#F0F9FF', borderRadius: 12, alignItems: 'center' },
    resultLabel: { color: '#007AFF', fontSize: 14 },
    resultPrice: { fontSize: 32, fontWeight: 'bold', color: '#007AFF', marginVertical: 5 },
    resultInfo: { color: 'gray', fontSize: 12 },

    imageHeader: { width: '100%', height: 300 },
    headerIcons: { position: 'absolute', width:'100%', flexDirection: 'row', justifyContent:'space-between', paddingHorizontal: 20 },
    iconBtn: { backgroundColor: 'white', padding: 8, borderRadius: 20 },
    content: { padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    locationText: { color: 'gray', marginLeft: 5 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    ratingText: { color: 'gray', marginLeft: 5, fontSize: 12 },
    features: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 },
    featureItem: { width: '23%', backgroundColor: '#F0F4F8', paddingVertical: 15, borderRadius: 15, alignItems: 'center', marginHorizontal: 3, marginBottom: 10 },
    featureText: { fontSize: 10, marginTop: 5, fontWeight: '600', color: '#007AFF' },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    descText: { color: 'gray', lineHeight: 22, marginBottom: 20 },
    accordionHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingVertical: 18, 
        paddingHorizontal: 15,
        marginTop: 10,
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    accordionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    accordionTitle: { 
        fontWeight: '700', 
        fontSize: 17,
        color: '#1a1a1a',
        marginLeft: 10
    },
    chevronContainer: {
        padding: 4,
        borderRadius: 20,
        backgroundColor: '#DBEAFE'
    },
    chevronRotated: {
        transform: [{ rotate: '180deg' }]
    },
    activitiesContainer: { 
        paddingTop: 15,
        paddingBottom: 10
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 30
    },
    loadingText: {
        marginTop: 10,
        color: '#999',
        fontSize: 14
    },
    activityCard: { 
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3
    },
    activityCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    themeIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
    },
    activityThemeTitle: { 
        fontSize: 18, 
        fontWeight: '700',
        flex: 1
    },
    themeBadge: {
        backgroundColor: '#F0F0F0',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        minWidth: 28,
        alignItems: 'center'
    },
    themeBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666'
    },
    activityList: {
        marginTop: 4
    },
    activityItem: { 
        flexDirection: 'row', 
        alignItems: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 4
    },
    activityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#3B82F6',
        marginTop: 6,
        marginRight: 10
    },
    activityName: { 
        color: '#1F2937', 
        fontSize: 15,
        lineHeight: 20,
        flex: 1,
        fontWeight: '600'
    },
    emptyStateContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#999',
        marginTop: 12
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#bbb',
        marginTop: 4
    },
    locationSection: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#3B82F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15
    },
    locationTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginLeft: 10
    },
    mapContainer: {
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#3B82F6',
        overflow: 'hidden'
    },
    mapView: {
        width: '100%',
        height: 250
    },
    customMarker: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    mapPlaceholder: {
        width: '100%',
        height: 250,
        borderRadius: 12,
        backgroundColor: '#F0F9FF',
        justifyContent: 'center',
        alignItems: 'center'
    },
    mapPlaceholderText: {
        marginTop: 10,
        color: '#666',
        fontSize: 14
    },
    coordinatesContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        alignItems: 'center'
    },
    coordinatesText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500'
    },
    mapImage: { width: '100%', height: 150, borderRadius: 15, marginTop: 10 },
    footer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'white', padding: 20, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#eee', paddingBottom: 30 },
    bookBtn: { backgroundColor: '#007AFF', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, justifyContent: 'center' },
    bookText: { color: 'white', fontWeight: 'bold' },
    price: { fontSize: 22, fontWeight: 'bold' },
    perNight: { color: 'gray' }
});

export default DetailsScreen;
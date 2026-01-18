import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Animated, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../theme/ThemeProvider';
import cityImages from '../data/cityImages';
import flightPricesData from '../data/flightPrices.json'; // Import des données locales
import CityRepository from '../backend/repositories/CityRepository';
import ThemeFilterService from '../backend/services/ThemeFilterService';
import CityActivityService from '../backend/services/CityActivityService';

const { height } = Dimensions.get('window');

function DetailsScreen({ route, navigation }) {
    const { colors, isDark } = useAppTheme();
    const { city, maxScore = 1 } = route.params;

    // Calcul des étoiles dynamiques
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

    // States pour la recherche de vol
    const [showFlightSearch, setShowFlightSearch] = useState(false);
    const [originCity, setOriginCity] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [flightDate, setFlightDate] = useState(null);
    const [flightPrice, setFlightPrice] = useState(null);
    const [loadingPrice, setLoadingPrice] = useState(false);

    // Animation pour le panel
    const slideAnim = useRef(new Animated.Value(height)).current;

    // Ouvrir/Fermer le panel
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

    // Gestionnaire pour le DatePicker
    const onChangeDate = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setFlightDate(selectedDate);
        }
    };

    const fetchPrice = async () => {
        if (!originCity) return alert("Veuillez entrer une ville de départ");

        setLoadingPrice(true);
        setFlightPrice(null);

        // Simulation d'un délai réseau pour l'UX
        setTimeout(() => {
            try {
                // Création de la clé de recherche (ex: PARIS_LONDRES)
                // On nettoie les entrées (majusucles, sans espaces inutiles)
                const originClean = originCity.trim().toUpperCase();
                const destClean = city.name.trim().toUpperCase();
                const searchKey = `${originClean}_${destClean}`;
                const keyParisFallback = `PARIS_${destClean}`;

                // Recherche dans le fichier JSON local
                // 1. Cherche EXACTEMENT VilleDepart_VilleArrivee
                // 2. Si non trouvé et que l'utilisateur a tapé "Paris", cherche PARIS_VilleArrivee
                let foundData = flightPricesData[searchKey];

                // Fallback: Si l'utilisateur met "Paris" ou "PARIS" mais que la casse diffère légèrement ou s'il y a un alias
                if (!foundData && originClean === 'PARIS') {
                    foundData = flightPricesData[keyParisFallback];
                }

                if (foundData && foundData.price) {
                    // Succès : On utilise directement les données du fichier JSON
                    setFlightPrice({
                        amount: foundData.price.amount,
                        currency: foundData.price.currency
                    });
                } else {
                    // Si pas trouvé dans le JSON, on génère un prix MOCK (pour ne jamais bloquer l'utilisateur)
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
        }, 500); // Petit délai de 500ms pour l'effet de chargement
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
                console.log(`Recuperation coordonnees pour: ${city.name} (ID: ${city.id})`);
                let cityData = await CityRepository.getCityById(city.id);

                // Si pas de résultat par ID, essayer par nom (cas de décalage ID entre JSON et DB)
                if (!cityData) {
                    console.log("ID non trouvé, tentative de recherche par nom...");
                    const searchResults = await CityRepository.searchCitiesByName(city.name);
                    if (searchResults && searchResults.length > 0) {
                        cityData = searchResults.find(c => c.name.toLowerCase() === city.name.toLowerCase()) || searchResults[0];
                    }
                }

                if (cityData) {
                    console.log("Données ville trouvées:", cityData);
                    // Gérer les noms de colonnes lat/lon ou latitude/longitude
                    const lat = cityData.lat !== undefined ? cityData.lat : cityData.latitude;
                    const lon = cityData.lon !== undefined ? cityData.lon : cityData.longitude;

                    if (lat !== undefined && lon !== undefined) {
                        setCityCoordinates({
                            latitude: parseFloat(lat),
                            longitude: parseFloat(lon)
                        });
                    } else {
                        console.log("Coordonnées manquantes dans les données:", cityData);
                    }
                } else {
                    console.log("Aucune donnée trouvée pour cette ville");
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

    // Gestion de l'image (Locale > Online > Fallback)
    const localImage = cityImages[city.name];
    const imageSource = localImage
        ? localImage
        : { uri: `http://10.0.2.2:5001/api/travel/photos/image/search?q=${encodeURIComponent(city.name)}&size=regular` };

    return (
        <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {/* Image en tête */}
                <View>
                    <Image
                        source={imageSource}
                        style={styles.imageHeader}
                        defaultSource={{ uri: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1' }} />
                    <SafeAreaView style={styles.headerIcons} edges={['top']}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={[
                                styles.iconBtn,
                                { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.35)' }
                            ]}
                        >
                            <Ionicons name="arrow-back" size={20} color={colors.text} />
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity
                                style={[
                                    styles.iconBtn,
                                    {
                                        marginRight: 10,
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.35)'
                                    }
                                ]}
                            >
                                <Ionicons name="share-outline" size={20} color={colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.iconBtn,
                                    { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.35)' }
                                ]}
                            >
                                <Ionicons name="heart-outline" size={20} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </View>

                <View style={[styles.content, { backgroundColor: colors.background }]}>
                    <Text style={[styles.title, { color: colors.text }]}>{city.name}</Text>
                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={16} color={colors.primary} />
                        <Text style={[styles.locationText, { color: colors.text }]}>Destination recommandée</Text>
                    </View>
                    <View style={styles.ratingRow}>
                        {[...Array(fullStars)].map((_, i) => <Ionicons key={i} name="star" size={16} color="#FFD700" />)}
                        {hasHalfStar && <Ionicons name="star-half" size={16} color="#FFD700" />}
                        <Text style={[styles.ratingText, { color: colors.text }]}>
                            {city.score ? `${Math.round(city.score * 100)}% Match` : 'Populaire'}
                        </Text>
                    </View>

                    {/* Thèmes de la ville */}
                    <View style={styles.features}>
                        {loadingThemes ? (
                            <ActivityIndicator size="small" color={colors.primary} />
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
                                    <View key={index} style={[styles.featureItem, { backgroundColor: colors.cardElevated }]}>
                                        <Ionicons name={config.icon} size={24} color={colors.primary} />
                                        <Text style={[styles.featureText, { color: colors.primary }]}>{config.label}</Text>
                                    </View>
                                );
                            })
                        ) : (
                            <>
                                <View style={[styles.featureItem, { backgroundColor: colors.cardElevated }]}><Ionicons name="time-outline" size={24} color={colors.primary} /><Text style={[styles.featureText, { color: colors.primary }]}>Culture</Text></View>
                                <View style={[styles.featureItem, { backgroundColor: colors.cardElevated }]}><Ionicons name="restaurant-outline" size={24} color={colors.primary} /><Text style={[styles.featureText, { color: colors.primary }]}>Cuisine</Text></View>
                                <View style={[styles.featureItem, { backgroundColor: colors.cardElevated }]}><Ionicons name="camera-outline" size={24} color={colors.primary} /><Text style={[styles.featureText, { color: colors.primary }]}>Vues</Text></View>
                                <View style={[styles.featureItem, { backgroundColor: colors.cardElevated }]}><Ionicons name="walk-outline" size={24} color={colors.primary} /><Text style={[styles.featureText, { color: colors.primary }]}>Balades</Text></View>
                            </>
                        )}
                    </View>

                    <Text style={[styles.sectionHeader, { color: colors.text }]}>Description</Text>
                    {loadingDesc ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <Text style={[styles.descText, { color: colors.mutedText }]}>
                            {description}
                        </Text>
                    )}


                    <TouchableOpacity style={[styles.accordionHeader, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setShowActivities(!showActivities)}>
                        <View style={styles.accordionTitleContainer}>
                            <Ionicons name="compass" size={22} color={colors.primary} />
                            <Text style={[styles.accordionTitle, { color: colors.text }]}>Centres d'intérêt</Text>
                        </View>
                        <View style={[styles.chevronContainer, { backgroundColor: colors.cardElevated }]}>
                            <Ionicons name="chevron-down" size={20} color={colors.primary} />
                        </View>
                    </TouchableOpacity>

                    {showActivities && (
                        <View style={[styles.activitiesContainer, { backgroundColor: colors.card }]}>
                            {loadingActivities ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                    <Text style={[styles.loadingText, { color: colors.mutedText }]}>Chargement des activités...</Text>
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
                                        <View key={theme} style={[styles.activityCard, { borderLeftColor: config.color, backgroundColor: colors.cardElevated }]}>
                                            <View style={styles.activityCardHeader}>
                                                <View style={[styles.themeIconContainer, { backgroundColor: config.bgColor }]}>
                                                    <Ionicons name={config.icon} size={20} color={config.color} />
                                                </View>
                                                <Text style={[styles.activityThemeTitle, { color: config.color }]}>{theme}</Text>
                                                <View style={[styles.themeBadge, { backgroundColor: colors.card }]}>
                                                    <Text style={[styles.themeBadgeText, { color: colors.text }]}>{items.length}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.activityList}>
                                                {items.map((item, idx) => (
                                                    <View key={idx} style={styles.activityItem}>
                                                        <View style={[styles.activityDot, { backgroundColor: config.color }]} />
                                                        <Text style={[styles.activityName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    );
                                })
                            )}
                            {!loadingActivities && Object.values(activities).every(arr => arr.length === 0) && (
                                <View style={styles.emptyStateContainer}>
                                    <Ionicons name="search-outline" size={48} color={colors.mutedText} />
                                    <Text style={[styles.emptyStateText, { color: colors.text }]}>Aucun centre d'intérêt trouvé</Text>
                                    <Text style={[styles.emptyStateSubtext, { color: colors.mutedText }]}>Essayez une autre ville</Text>
                                </View>
                            )}
                        </View>
                    )}

                    <View style={[styles.accordionHeader, { backgroundColor: colors.card }]}>
                        <View style={styles.accordionTitleContainer}>
                            <Ionicons name="location" size={22} color={colors.primary} />
                            <Text style={[styles.accordionTitle, { color: colors.text }]}>Localisation</Text>
                        </View>
                    </View>

                    <View style={[styles.activitiesContainer, { backgroundColor: colors.background }]}>
                        <View style={[
                            styles.locationSection,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                                borderRadius: 12,
                                overflow: 'hidden'
                            }
                        ]}>
                            <View style={[styles.mapContainer, { borderColor: colors.border }]}>
                                {cityCoordinates ? (
                                    <WebView
                                        style={[styles.mapView, { backgroundColor: colors.card }]}
                                        source={{
                                            html: `
                                    <!DOCTYPE html>
                                    <html>
                                    <head>
                                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                                        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                                        <style>
                                            body { margin: 0; padding: 0; background-color: transparent; }
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
                                        domStorageEnabled={true} />
                                ) : (
                                    <View style={[styles.mapPlaceholder, { backgroundColor: colors.card }]}>
                                        <ActivityIndicator size="large" color={colors.primary} />
                                        <Text style={[styles.mapPlaceholderText, { color: colors.mutedText }]}>Chargement de la carte...</Text>
                                    </View>
                                )}
                            </View>
                            <View style={[styles.coordinatesContainer, { borderTopColor: colors.border }]}>
                                <Text style={[styles.coordinatesText, { color: colors.mutedText }]}>
                                    {cityCoordinates ? `${cityCoordinates.latitude.toFixed(4)}°, ${cityCoordinates.longitude.toFixed(4)}°` : 'Coordonnées non disponibles'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Footer détails prix */}
            <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <View>
                    <Text style={[styles.price, { color: colors.text }]}>Explorer</Text>
                    <Text style={[styles.perNight, { color: colors.mutedText }]}>dès maintenant</Text>
                </View>
                <TouchableOpacity style={[styles.bookBtn, { backgroundColor: colors.primary }]} onPress={() => setShowFlightSearch(true)}>
                    <Text style={styles.bookText}>Voir les vols</Text>
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
                    <Text style={styles.dateText}>
                        {flightDate ? flightDate.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Choisir une date'}
                    </Text>
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={flightDate || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        minimumDate={new Date()}
                        onChange={onChangeDate}
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

            <Animated.View style={[styles.flightPanel, { backgroundColor: colors.background, transform: [{ translateY: slideAnim }] }]}>
                <View style={styles.panelHeader}>
                    <Text style={[styles.panelTitle, { color: colors.text }]}>Recherche de Vol</Text>
                    <TouchableOpacity onPress={() => setShowFlightSearch(false)}>
                        <Ionicons name="close-circle" size={28} color={colors.mutedText} />
                    </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.mutedText }]}>Ville de départ</Text>
                    <TextInput
                        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
                        placeholder="Ex: Paris, Lyon..."
                        placeholderTextColor={colors.mutedText}
                        value={originCity}
                        onChangeText={setOriginCity} />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.mutedText }]}>Date de départ</Text>
                    <TextInput
                        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.mutedText}
                        value={flightDate ? flightDate.toISOString().split('T')[0] : ''}
                        onChangeText={(text) => {
                            if (text) {
                                const date = new Date(text);
                                if (!isNaN(date.getTime())) {
                                    setFlightDate(date);
                                }
                            } else {
                                setFlightDate(null);
                            }
                        }} />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.mutedText }]}>Ville d'arrivée</Text>
                    <View style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, justifyContent: 'center' }]}>
                        <Text style={{ color: colors.text }}>{city.name}</Text>
                    </View>
                </View>

                <TouchableOpacity style={[styles.searchBtn, { backgroundColor: colors.primary }]} onPress={fetchPrice} disabled={loadingPrice}>
                    {loadingPrice ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.searchBtnText}>Calculer le prix du vol</Text>
                    )}
                </TouchableOpacity>

                {flightPrice && (
                    <View style={[styles.resultContainer, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
                        <Text style={[styles.resultLabel, { color: colors.primary }]}>Meilleur prix trouvé :</Text>
                        <Text style={[styles.resultPrice, { color: colors.primary }]}>
                            {flightPrice.amount} {flightPrice.currency}
                        </Text>
                        <Text style={[styles.resultInfo, { color: colors.mutedText }]}>Vol direct (estimé)</Text>
                    </View>
                )}
            </Animated.View>

        </View>
    );
}

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
        height: height * 0.8, // Augmenté à 80% de l'écran pour bien voir tous les champs
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
    resultContainer: { marginTop: 20, padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
    resultLabel: { fontSize: 14 },
    resultPrice: { fontSize: 32, fontWeight: 'bold', marginVertical: 5 },
    resultInfo: { fontSize: 12 },

    imageHeader: { width: '100%', height: 300 },
    headerIcons: { position: 'absolute', width:'100%', flexDirection: 'row', justifyContent:'space-between', paddingHorizontal: 20 },
    iconBtn: { padding: 10, borderRadius: 20 },
    content: { padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    locationText: { marginLeft: 5 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    ratingText: { marginLeft: 5, fontSize: 12 },
    features: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 },
    featureItem: { width: '23%', paddingVertical: 15, borderRadius: 15, alignItems: 'center', marginHorizontal: 3, marginBottom: 10 },
    featureText: { fontSize: 10, marginTop: 5, fontWeight: '600' },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    descText: { lineHeight: 22, marginBottom: 20 },
    accordionHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingVertical: 18, 
        paddingHorizontal: 15,
        marginTop: 10,
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
        marginLeft: 10
    },
    chevronContainer: {
        padding: 4,
        borderRadius: 20
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
        fontSize: 14
    },
    activityCard: { 
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
        fontWeight: '600'
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
        marginTop: 6,
        marginRight: 10
    },
    activityName: { 
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
        marginTop: 12
    },
    emptyStateSubtext: {
        fontSize: 14,
        marginTop: 4
    },
    locationSection: {
        borderRadius: 12,
        padding: 0,
        marginBottom: 16,
        overflow: 'hidden',
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
        marginLeft: 10
    },
    mapContainer: {
        borderRadius: 0,
        borderWidth: 0,
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
        justifyContent: 'center',
        alignItems: 'center'
    },
    mapPlaceholderText: {
        marginTop: 10,
        fontSize: 14
    },
    coordinatesContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        alignItems: 'center'
    },
    coordinatesText: {
        fontSize: 13,
        fontWeight: '500'
    },
    mapImage: { width: '100%', height: 150, borderRadius: 15, marginTop: 10 },
    footer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingBottom: 30 },
    bookBtn: { paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, justifyContent: 'center' },
    bookText: { color: 'white', fontWeight: 'bold' },
    price: { fontSize: 22, fontWeight: 'bold' },
    perNight: { }
});

export default DetailsScreen;
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import cityImages from '../data/cityImages';
import flightPricesData from '../data/flightPrices.json'; // Import des données locales
import CityRepository from '../backend/repositories/CityRepository';

const { height } = Dimensions.get('window');

const DetailsScreen = ({ route, navigation }) => {
  const { city } = route.params;
  const [description, setDescription] = useState('');
  const [loadingDesc, setLoadingDesc] = useState(true);

  // States pour la recherche de vol
  const [showFlightSearch, setShowFlightSearch] = useState(false);
  const [originCity, setOriginCity] = useState('');
  const [flightDate, setFlightDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [flightPrice, setFlightPrice] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  
  // Animation pour le panel
  const slideAnim = useRef(new Animated.Value(height)).current;

  // Ouvrir/Fermer le panel
  useEffect(() => {
    if (showFlightSearch) {
      Animated.timing(slideAnim, {
        toValue: 0, // Le panel remonte complétement à sa position (bottom: 0)
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height, // Le panel redescend hors écran
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showFlightSearch]);

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

    if (city && city.id) {
        fetchDescription();
    }
  }, [city]);

  // Gestion de l'image (Locale > Online > Fallback)
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
                    <TouchableOpacity style={[styles.iconBtn, {marginRight: 10}]}>
                         <Ionicons name="share-outline" size={20} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}>
                         <Ionicons name="heart-outline" size={20} color="black" />
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
                {[...Array(4)].map((_, i) => <Ionicons key={i} name="star" size={16} color="#FFD700" />)}
                <Ionicons name="star-half" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>
                     {city.score ? `${Math.round(city.score * 100)}% Match` : 'Populaire'}
                </Text>
            </View>

            <View style={styles.features}>
                <View style={styles.featureItem}><Ionicons name="time-outline" size={24} color="#007AFF"/><Text style={styles.featureText}>Culture</Text></View>
                <View style={styles.featureItem}><Ionicons name="restaurant-outline" size={24} color="#007AFF"/><Text style={styles.featureText}>Cuisine</Text></View>
                <View style={styles.featureItem}><Ionicons name="camera-outline" size={24} color="#007AFF"/><Text style={styles.featureText}>Vues</Text></View>
                <View style={styles.featureItem}><Ionicons name="walk-outline" size={24} color="#007AFF"/><Text style={styles.featureText}>Balades</Text></View>
            </View>

            <Text style={styles.sectionHeader}>Description</Text>
            {loadingDesc ? (
                <ActivityIndicator size="small" color="#007AFF" />
            ) : (
                <Text style={styles.descText}>
                    {description}
                </Text>
            )}
            
            <View style={styles.accordion}>
                <Text style={styles.accordionTitle}>Centres d'intérêt</Text>
                <Ionicons name="chevron-down" size={20} />
            </View>
             <View style={styles.accordion}>
                <Text style={styles.accordionTitle}>Localisation</Text>
                {/* Image carte statique pour l'exemple, pourrait être dynamique aussi */}
                <Image source={{uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b'}} style={styles.mapImage} />
            </View>
        </View>
      </ScrollView>

      {/* Footer détails prix */}
      <View style={styles.footer}>
        <View>
            <Text style={styles.price}>Explorer</Text>
            <Text style={styles.perNight}>dès maintenant</Text>
        </View>
        <TouchableOpacity style={styles.bookBtn} onPress={() => setShowFlightSearch(true)}>
            <Text style={styles.bookText}>Voir les vols</Text>
        </TouchableOpacity>
      </View>

      {/* Flight Search Panel Overlay */}
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
                    style={styles.input} 
                    placeholder="Ex: Paris, Lyon..." 
                    value={originCity}
                    onChangeText={setOriginCity}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Date de départ</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="YYYY-MM-DD" 
                    value={flightDate}
                    onChangeText={setFlightDate}
                />
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
    features: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
    featureItem: { width: '23%', backgroundColor: '#F0F4F8', paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
    featureText: { fontSize: 10, marginTop: 5, fontWeight: '600' },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    descText: { color: 'gray', lineHeight: 22, marginBottom: 20 },
    accordion: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderTopWidth: 1, borderColor: '#eee' },
    accordionTitle: { fontWeight: 'bold', fontSize: 16 },
    mapImage: { width: '100%', height: 150, borderRadius: 15, marginTop: 10 },
    footer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'white', padding: 20, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#eee', paddingBottom: 30 },
    bookBtn: { backgroundColor: '#007AFF', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, justifyContent: 'center' },
    bookText: { color: 'white', fontWeight: 'bold' },
    price: { fontSize: 22, fontWeight: 'bold' },
    perNight: { color: 'gray' }
});

export default DetailsScreen;
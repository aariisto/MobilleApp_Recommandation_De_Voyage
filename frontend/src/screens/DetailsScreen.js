import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const DetailsScreen = ({ navigation }) => {
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Image en tête */}
        <View>
            <Image source={{uri: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b91d'}} style={styles.imageHeader} />
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
            <Text style={styles.title}>Villa Luxueuse en Bord de Mer</Text>
            <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color="#007AFF" />
                <Text style={styles.locationText}>Santorin, Grèce</Text>
            </View>
            <View style={styles.ratingRow}>
                {[...Array(4)].map((_, i) => <Ionicons key={i} name="star" size={16} color="#FFD700" />)}
                <Ionicons name="star-half" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>4.8 (245 avis)</Text>
            </View>

            <View style={styles.features}>
                <View style={styles.featureItem}><Ionicons name="time-outline" size={24} color="#007AFF"/><Text style={styles.featureText}>7 Jours</Text></View>
                <View style={styles.featureItem}><Ionicons name="telescope-outline" size={24} color="#007AFF"/><Text style={styles.featureText}>Vue mer</Text></View>
                <View style={styles.featureItem}><Ionicons name="people-outline" size={24} color="#007AFF"/><Text style={styles.featureText}>2 Pers.</Text></View>
                <View style={styles.featureItem}><Ionicons name="calendar-outline" size={24} color="#007AFF"/><Text style={styles.featureText}>Annul. free</Text></View>
            </View>

            <Text style={styles.sectionHeader}>Description</Text>
            <Text style={styles.descText}>
                Évadez-vous dans cette magnifique villa en bord de mer, offrant une vue imprenable sur la mer Égée. Profitez d'un luxe inégalé avec une piscine privée...
            </Text>
            
            <View style={styles.accordion}>
                <Text style={styles.accordionTitle}>Équipements</Text>
                <Ionicons name="chevron-down" size={20} />
            </View>
             <View style={styles.accordion}>
                <Text style={styles.accordionTitle}>Localisation</Text>
                <Image source={{uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b'}} style={styles.mapImage} />
            </View>
        </View>
      </ScrollView>

      {/* Footer détails prix*/}
      <View style={styles.footer}>
        <View>
            <Text style={styles.price}>450€</Text>
            <Text style={styles.perNight}>/ nuit</Text>
        </View>
        <TouchableOpacity style={styles.bookBtn}>
            <Text style={styles.bookText}>Réserver maintenant</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
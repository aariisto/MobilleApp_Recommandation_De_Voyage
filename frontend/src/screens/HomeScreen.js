import React from 'react';
import { View, Text, ScrollView, Image, TextInput, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const HomeScreen = ({ navigation }) => {
  const categories = ['Aventure', 'Détente', 'Romantique', 'Famille'];
  
  // Fonction pour naviguer vers le détail
  const goToDetails = () => navigation.navigate('Details');

  // Fonction pour aller au questionnaire 
  const startQuiz = () => navigation.navigate('Preferences');

  const renderHorizontalItem = () => (
    <TouchableOpacity style={styles.cardHorizontal} onPress={goToDetails}>
      <Image source={{uri: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4'}} style={styles.cardImage} />
      <View style={styles.textOverlay}>
        <Text style={styles.cardTitle}>Bali, Indonésie</Text>
        <Text style={styles.cardSubtitle}>Paradis tropical</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={{uri: 'https://randomuser.me/api/portraits/women/44.jpg'}} style={styles.avatar} />
        <Text style={styles.greeting}>Bonjour, Alex!</Text>
        <TouchableOpacity><Ionicons name="notifications-outline" size={24} color="black" /></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Barre de recherche */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="gray" />
          <TextInput placeholder="Où voulez-vous aller ?" style={styles.input} />
        </View>

        {/* Bouton quiz  */}
        <View style={{ paddingHorizontal: 20, marginTop: 15 }}>
            <TouchableOpacity style={styles.quizButton} onPress={startQuiz}>
                <Text style={styles.quizButtonText}>✨ Trouver mon voyage idéal ✨</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
        </View>

        {/* Scroll Horizontal */}
        <Text style={styles.sectionTitle}>Destinations du moment</Text>
        <FlatList 
          horizontal 
          data={[1, 2, 3]} 
          renderItem={renderHorizontalItem} 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        />

        {/* Catégories de voyage */}
        <Text style={styles.sectionTitle}>Inspirations par thème</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {categories.map((cat, index) => (
            <View key={index} style={styles.categoryChip}>
              <Text style={styles.categoryText}>{cat}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Liste Verticale */}
        <Text style={styles.sectionTitle}>Recommandé pour vous</Text>
        <TouchableOpacity onPress={goToDetails} style={styles.cardVertical}>
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
  searchBar: { flexDirection: 'row', backgroundColor: '#E9ECEF', marginHorizontal: 20, padding: 12, borderRadius: 12, alignItems: 'center' },
  input: { marginLeft: 10, flex: 1 },
  
  // Styles du Bouton Quiz
  quizButton: { 
      backgroundColor: '#007AFF', 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: 15, 
      borderRadius: 15,
      shadowColor: "#007AFF",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 5
  },
  quizButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', margin: 20, marginBottom: 15, marginTop: 25 },
  cardHorizontal: { width: 220, height: 280, marginRight: 15, borderRadius: 20, overflow: 'hidden', backgroundColor: 'black' },
  cardImage: { width: '100%', height: '100%', opacity: 0.8 },
  textOverlay: { position: 'absolute', bottom: 15, left: 15 },
  cardTitle: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  cardSubtitle: { color: 'white', fontSize: 12 },
  categoryChip: { backgroundColor: '#DDEEFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginRight: 10 },
  categoryText: { color: '#333' },
  cardVertical: { flexDirection: 'row', backgroundColor: 'white', marginHorizontal: 20, borderRadius: 20, marginBottom: 15, padding: 10, alignItems: 'center' },
  verticalImage: { width: 80, height: 80, borderRadius: 15 },
  cardInfo: { marginLeft: 15, flex: 1 },
  verticalTitle: { fontWeight: 'bold', fontSize: 16 },
  verticalSubtitle: { color: 'gray', marginBottom: 5 },
  tag: { backgroundColor: '#FFE4C4', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tagText: { color: '#D2691E', fontSize: 10, fontWeight: 'bold' }
});

export default HomeScreen;
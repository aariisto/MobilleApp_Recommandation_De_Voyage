import React from 'react';
import { View, Text, ScrollView, Image, TextInput, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Constantes
const TRAVEL_CATEGORIES = ['Aventure', 'Détente', 'Romantique', 'Famille'];
const TRENDING_DESTINATIONS_COUNT = 3;

// Données mock pour les destinations tendance
const TRENDING_DESTINATIONS_DATA = [
  { id: '1', imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4', title: 'Bali, Indonésie', subtitle: 'Paradis tropical' },
  { id: '2', imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4', title: 'Bali, Indonésie', subtitle: 'Paradis tropical' },
  { id: '3', imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4', title: 'Bali, Indonésie', subtitle: 'Paradis tropical' }
];

// Données mock pour la recommandation
const RECOMMENDED_DESTINATION = {
  imageUrl: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963',
  title: 'Cinque Terre, Italie',
  subtitle: 'Côte pittoresque',
  tag: 'Romantique'
};

const USER_PROFILE = {
  avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
  name: 'Alex'
};

const HomeScreen = ({ navigation }) => {
  // Handlers de navigation
  const handleNavigateToDetails = () => navigation.navigate('Details');
  const handleStartQuiz = () => navigation.navigate('Preferences');

  // Rendu d'une destination tendance
  const renderTrendingDestination = ({ item }) => (
    <TrendingDestinationCard
      destination={item}
      onPress={handleNavigateToDetails}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <HomeHeader userProfile={USER_PROFILE} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <SearchBar />
        
        <QuizButton onPress={handleStartQuiz} />

        <SectionTitle title="Destinations du moment" />
        <FlatList 
          horizontal 
          data={TRENDING_DESTINATIONS_DATA}
          renderItem={renderTrendingDestination}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalListContent}
        />

        <SectionTitle title="Inspirations par thème" />
        <CategoriesScroll categories={TRAVEL_CATEGORIES} />

        <SectionTitle title="Recommandé pour vous" />
        <RecommendedCard
          destination={RECOMMENDED_DESTINATION}
          onPress={handleNavigateToDetails}
        />
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Composant Header avec avatar et notifications
const HomeHeader = ({ userProfile }) => (
  <View style={styles.header}>
    <Image source={{ uri: userProfile.avatarUrl }} style={styles.avatar} />
    <Text style={styles.greeting}>Bonjour, {userProfile.name}!</Text>
    <TouchableOpacity>
      <Ionicons name="notifications-outline" size={24} color="black" />
    </TouchableOpacity>
  </View>
);

// Composant Barre de recherche
const SearchBar = () => (
  <View style={styles.searchBar}>
    <Ionicons name="search" size={20} color="gray" />
    <TextInput 
      placeholder="Où voulez-vous aller ?" 
      style={styles.input}
      placeholderTextColor="gray"
    />
  </View>
);

// Composant Bouton Quiz
const QuizButton = ({ onPress }) => (
  <View style={styles.quizButtonContainer}>
    <TouchableOpacity style={styles.quizButton} onPress={onPress}>
      <Text style={styles.quizButtonText}>✨ Trouver mon voyage idéal ✨</Text>
      <Ionicons name="arrow-forward" size={20} color="white" />
    </TouchableOpacity>
  </View>
);

// Composant Titre de section
const SectionTitle = ({ title }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

// Composant Carte de destination tendance (horizontale)
const TrendingDestinationCard = ({ destination, onPress }) => (
  <TouchableOpacity style={styles.cardHorizontal} onPress={onPress}>
    <Image 
      source={{ uri: destination.imageUrl }} 
      style={styles.cardImage} 
    />
    <View style={styles.textOverlay}>
      <Text style={styles.cardTitle}>{destination.title}</Text>
      <Text style={styles.cardSubtitle}>{destination.subtitle}</Text>
    </View>
  </TouchableOpacity>
);

// Composant Scroll horizontal des catégories
const CategoriesScroll = ({ categories }) => (
  <ScrollView 
    horizontal 
    showsHorizontalScrollIndicator={false} 
    contentContainerStyle={styles.categoriesScrollContent}
  >
    {categories.map((category, index) => (
      <CategoryChip 
        key={`category-${index}`} 
        label={category} 
      />
    ))}
  </ScrollView>
);

// Composant Chip de catégorie
const CategoryChip = ({ label }) => (
  <View style={styles.categoryChip}>
    <Text style={styles.categoryText}>{label}</Text>
  </View>
);

// Composant Carte de recommandation (verticale)
const RecommendedCard = ({ destination, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.cardVertical}>
    <Image 
      source={{ uri: destination.imageUrl }} 
      style={styles.verticalImage}
    />
    <View style={styles.cardInfo}>
      <Text style={styles.verticalTitle}>{destination.title}</Text>
      <Text style={styles.verticalSubtitle}>{destination.subtitle}</Text>
      <DestinationTag label={destination.tag} />
    </View>
  </TouchableOpacity>
);

// Composant Tag de destination
const DestinationTag = ({ label }) => (
  <View style={styles.tag}>
    <Text style={styles.tagText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  
  // Header
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginBottom: 10, 
    paddingTop: 10 
  },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20 
  },
  greeting: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    flex: 1, 
    marginLeft: 10 
  },
  
  // Barre de recherche
  searchBar: { 
    flexDirection: 'row', 
    backgroundColor: '#E9ECEF', 
    marginHorizontal: 20, 
    padding: 12, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  input: { 
    marginLeft: 10, 
    flex: 1 
  },
  
  // Bouton Quiz
  quizButtonContainer: { 
    paddingHorizontal: 20, 
    marginTop: 15 
  },
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
  quizButtonText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 16 
  },

  // Sections
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    margin: 20, 
    marginBottom: 15, 
    marginTop: 25 
  },

  // Liste horizontale
  horizontalListContent: { 
    paddingHorizontal: 20 
  },

  // Carte horizontale (destinations tendance)
  cardHorizontal: { 
    width: 220, 
    height: 280, 
    marginRight: 15, 
    borderRadius: 20, 
    overflow: 'hidden', 
    backgroundColor: 'black' 
  },
  cardImage: { 
    width: '100%', 
    height: '100%', 
    opacity: 0.8 
  },
  textOverlay: { 
    position: 'absolute', 
    bottom: 15, 
    left: 15 
  },
  cardTitle: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 18 
  },
  cardSubtitle: { 
    color: 'white', 
    fontSize: 12 
  },

  // Catégories
  categoriesScrollContent: { 
    paddingHorizontal: 20 
  },
  categoryChip: { 
    backgroundColor: '#DDEEFF', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 20, 
    marginRight: 10 
  },
  categoryText: { 
    color: '#333' 
  },

  // Carte verticale (recommandations)
  cardVertical: { 
    flexDirection: 'row', 
    backgroundColor: 'white', 
    marginHorizontal: 20, 
    borderRadius: 20, 
    marginBottom: 15, 
    padding: 10, 
    alignItems: 'center' 
  },
  verticalImage: { 
    width: 80, 
    height: 80, 
    borderRadius: 15 
  },
  cardInfo: { 
    marginLeft: 15, 
    flex: 1 
  },
  verticalTitle: { 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  verticalSubtitle: { 
    color: 'gray', 
    marginBottom: 5 
  },
  tag: { 
    backgroundColor: '#FFE4C4', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  tagText: { 
    color: '#D2691E', 
    fontSize: 10, 
    fontWeight: 'bold' 
  },

  // Espaceur en bas
  bottomSpacer: { 
    height: 80 
  }
});

export default HomeScreen;
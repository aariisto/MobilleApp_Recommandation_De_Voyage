import React from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Constantes
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 20;
const CARD_SPACING = 20;
const CARD_WIDTH = (SCREEN_WIDTH - (HORIZONTAL_PADDING * 2) - CARD_SPACING) / 2;
const NUMBER_OF_COLUMNS = 2;

// Données mock des favoris
const FAVORITES_MOCK_DATA = [
  { 
    id: '1', 
    title: 'Plage de Seminyak', 
    subtitle: 'Destination', 
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80' 
  },
  { 
    id: '2', 
    title: 'The Ritz Carlton', 
    subtitle: 'Hébergement', 
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80' 
  },
  { 
    id: '3', 
    title: 'Musée du Louvre', 
    subtitle: 'Activité', 
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Louvre_Museum_Wikimedia_Commons.jpg/800px-Louvre_Museum_Wikimedia_Commons.jpg'
  },
  { 
    id: '4', 
    title: 'Villa Kérylos', 
    subtitle: 'Hébergement', 
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80' 
  },
];

const FavoritesScreen = ({ navigation }) => {
  // Handlers
  const handleGoBackPress = () => navigation.goBack();
  
  const handleCardPress = () => navigation.navigate('Details');

  // Rendu d'un item de la liste
  const renderFavoriteItem = ({ item }) => (
    <FavoriteCard 
      item={item} 
      onPress={handleCardPress}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <FavoritesHeader onGoBack={handleGoBackPress} />
      
      <FlatList
        data={FAVORITES_MOCK_DATA}
        renderItem={renderFavoriteItem}
        keyExtractor={item => item.id}
        numColumns={NUMBER_OF_COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// Composant Header
const FavoritesHeader = ({ onGoBack }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onGoBack}>
      <Ionicons name="arrow-back" size={24} color="black" />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>Mes Favoris</Text>
    <Ionicons name="options-outline" size={24} color="black" />
  </View>
);

// Composant Carte de favori
const FavoriteCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <FavoriteCardImage imageUrl={item.image} />
    <Text style={styles.title}>{item.title}</Text>
    <Text style={styles.subtitle}>{item.subtitle}</Text>
  </TouchableOpacity>
);

// Composant Image de la carte avec bouton favori
const FavoriteCardImage = ({ imageUrl }) => (
  <View style={styles.imageContainer}>
    <Image source={{ uri: imageUrl }} style={styles.image} />
    <View style={styles.favoriteBtn}>
      <Ionicons name="heart" size={16} color="white" />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  listContent: { 
    paddingHorizontal: 20 
  },
  row: { 
    justifyContent: 'space-between', 
    marginBottom: 20 
  },
  card: { 
    width: CARD_WIDTH 
  },
  imageContainer: { 
    height: CARD_WIDTH, 
    borderRadius: 20, 
    overflow: 'hidden', 
    marginBottom: 10,
    backgroundColor: '#E1E1E1'
  },
  image: { 
    width: '100%', 
    height: '100%' 
  },
  favoriteBtn: { 
    position: 'absolute', 
    top: 10, 
    right: 10, 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    borderRadius: 15, 
    width: 28, 
    height: 28, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  title: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  subtitle: { 
    fontSize: 13, 
    color: 'gray' 
  }
});

export default FavoritesScreen;
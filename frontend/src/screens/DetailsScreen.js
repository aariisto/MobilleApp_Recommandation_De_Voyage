import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Constantes pour éviter la duplication
const VILLA_IMAGE_URL = 'https://images.unsplash.com/photo-1580587771525-78b9dba3b91d';
const MAP_IMAGE_URL = 'https://images.unsplash.com/photo-1524661135-423995f22d0b';
const MAXIMUM_RATING_STARS = 4;
const AVERAGE_RATING = 4.8;
const TOTAL_REVIEWS = 245;
const PRICE_PER_NIGHT = '450€';

const DetailsScreen = ({ navigation }) => {
  const handleGoBack = () => navigation.goBack();
  const handleSharePress = () => {
    // TODO: Implémenter la logique de partage
  };
  const handleFavoritePress = () => {
    // TODO: Implémenter la logique de favori
  };
  const handleBookingPress = () => {
    // TODO: Implémenter la logique de réservation
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollViewContent} 
        showsVerticalScrollIndicator={false}
      >
        <VillaHeader 
          imageUrl={VILLA_IMAGE_URL}
          onGoBack={handleGoBack}
          onShare={handleSharePress}
          onFavorite={handleFavoritePress}
        />

        <VillaContent 
          rating={AVERAGE_RATING}
          totalReviews={TOTAL_REVIEWS}
          mapImageUrl={MAP_IMAGE_URL}
        />
      </ScrollView>

      <BookingFooter 
        pricePerNight={PRICE_PER_NIGHT}
        onBookingPress={handleBookingPress}
      />
    </View>
  );
};

// Composant Header avec image et boutons d'action
const VillaHeader = ({ imageUrl, onGoBack, onShare, onFavorite }) => (
  <View>
    <Image source={{ uri: imageUrl }} style={styles.headerImage} />
    <SafeAreaView style={styles.headerActionsContainer} edges={['top']}>
      <TouchableOpacity onPress={onGoBack} style={styles.actionButton}>
        <Ionicons name="arrow-back" size={20} color="black" />
      </TouchableOpacity>
      <View style={styles.rightActionsContainer}>
        <TouchableOpacity onPress={onShare} style={[styles.actionButton, styles.shareButton]}>
          <Ionicons name="share-outline" size={20} color="black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onFavorite} style={styles.actionButton}>
          <Ionicons name="heart-outline" size={20} color="black" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  </View>
);

// Composant principal du contenu
const VillaContent = ({ rating, totalReviews, mapImageUrl }) => (
  <View style={styles.contentContainer}>
    <VillaTitle />
    <LocationInfo />
    <RatingStars rating={rating} totalReviews={totalReviews} />
    <VillaFeatures />
    <DescriptionSection />
    <EquipmentsAccordion />
    <LocationAccordion mapImageUrl={mapImageUrl} />
  </View>
);

// Titre de la villa
const VillaTitle = () => (
  <Text style={styles.villaTitle}>Villa Luxueuse en Bord de Mer</Text>
);

// Informations de localisation
const LocationInfo = () => (
  <View style={styles.locationContainer}>
    <Ionicons name="location-outline" size={16} color="#007AFF" />
    <Text style={styles.locationText}>Santorin, Grèce</Text>
  </View>
);

// Étoiles de notation
const RatingStars = ({ rating, totalReviews }) => (
  <View style={styles.ratingContainer}>
    {[...Array(MAXIMUM_RATING_STARS)].map((_, index) => (
      <Ionicons key={`star-${index}`} name="star" size={16} color="#FFD700" />
    ))}
    <Ionicons name="star-half" size={16} color="#FFD700" />
    <Text style={styles.ratingText}>
      {rating} ({totalReviews} avis)
    </Text>
  </View>
);

// Caractéristiques de la villa
const VillaFeatures = () => {
  const features = [
    { icon: 'time-outline', label: '7 Jours' },
    { icon: 'telescope-outline', label: 'Vue mer' },
    { icon: 'people-outline', label: '2 Pers.' },
    { icon: 'calendar-outline', label: 'Annul. free' }
  ];

  return (
    <View style={styles.featuresContainer}>
      {features.map((feature, index) => (
        <FeatureItem 
          key={`feature-${index}`}
          iconName={feature.icon}
          label={feature.label}
        />
      ))}
    </View>
  );
};

// Item de caractéristique individuelle
const FeatureItem = ({ iconName, label }) => (
  <View style={styles.featureItem}>
    <Ionicons name={iconName} size={24} color="#007AFF" />
    <Text style={styles.featureLabel}>{label}</Text>
  </View>
);

// Section description
const DescriptionSection = () => (
  <>
    <Text style={styles.sectionTitle}>Description</Text>
    <Text style={styles.descriptionText}>
      Évadez-vous dans cette magnifique villa en bord de mer, offrant une vue imprenable sur la mer Égée. 
      Profitez d'un luxe inégalé avec une piscine privée...
    </Text>
  </>
);

// Accordion pour les équipements
const EquipmentsAccordion = () => (
  <View style={styles.accordionContainer}>
    <Text style={styles.accordionTitle}>Équipements</Text>
    <Ionicons name="chevron-down" size={20} />
  </View>
);

// Accordion pour la localisation avec carte
const LocationAccordion = ({ mapImageUrl }) => (
  <View style={styles.accordionContainer}>
    <Text style={styles.accordionTitle}>Localisation</Text>
    <Image source={{ uri: mapImageUrl }} style={styles.mapImage} />
  </View>
);

// Footer avec prix et bouton de réservation
const BookingFooter = ({ pricePerNight, onBookingPress }) => (
  <View style={styles.footerContainer}>
    <PriceDisplay price={pricePerNight} />
    <TouchableOpacity onPress={onBookingPress} style={styles.bookingButton}>
      <Text style={styles.bookingButtonText}>Réserver maintenant</Text>
    </TouchableOpacity>
  </View>
);

// Affichage du prix
const PriceDisplay = ({ price }) => (
  <View>
    <Text style={styles.priceAmount}>{price}</Text>
    <Text style={styles.priceLabel}>/ nuit</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'white' 
  },
  scrollViewContent: { 
    paddingBottom: 100 
  },
  headerImage: { 
    width: '100%', 
    height: 300 
  },
  headerActionsContainer: { 
    position: 'absolute', 
    width: '100%', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20 
  },
  actionButton: { 
    backgroundColor: 'white', 
    padding: 8, 
    borderRadius: 20 
  },
  rightActionsContainer: { 
    flexDirection: 'row' 
  },
  shareButton: { 
    marginRight: 10 
  },
  contentContainer: { 
    padding: 20 
  },
  villaTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 5 
  },
  locationContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  locationText: { 
    color: 'gray', 
    marginLeft: 5 
  },
  ratingContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  ratingText: { 
    color: 'gray', 
    marginLeft: 5, 
    fontSize: 12 
  },
  featuresContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    marginBottom: 20 
  },
  featureItem: { 
    width: '23%', 
    backgroundColor: '#F0F4F8', 
    paddingVertical: 15, 
    borderRadius: 15, 
    alignItems: 'center' 
  },
  featureLabel: { 
    fontSize: 10, 
    marginTop: 5, 
    fontWeight: '600' 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 10 
  },
  descriptionText: { 
    color: 'gray', 
    lineHeight: 22, 
    marginBottom: 20 
  },
  accordionContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 15, 
    borderTopWidth: 1, 
    borderColor: '#eee' 
  },
  accordionTitle: { 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  mapImage: { 
    width: '100%', 
    height: 150, 
    borderRadius: 15, 
    marginTop: 10 
  },
  footerContainer: { 
    position: 'absolute', 
    bottom: 0, 
    width: '100%', 
    backgroundColor: 'white', 
    padding: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    borderTopWidth: 1, 
    borderColor: '#eee', 
    paddingBottom: 30 
  },
  bookingButton: { 
    backgroundColor: '#007AFF', 
    paddingHorizontal: 30, 
    paddingVertical: 15, 
    borderRadius: 30, 
    justifyContent: 'center' 
  },
  bookingButtonText: { 
    color: 'white', 
    fontWeight: 'bold' 
  },
  priceAmount: { 
    fontSize: 22, 
    fontWeight: 'bold' 
  },
  priceLabel: { 
    color: 'gray' 
  }
});

export default DetailsScreen;
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { rankCitiesWithPenalty } from "../backend/algorithms/rankUtils";
import { generateUserQueryFromUserId } from "../backend/algorithms/userQuery";
import UserRepository from "../backend/repositories/UserRepository";
import UserCategoryRepository from "../backend/repositories/UserCategoryRepository";
import ThemeFilterService from "../backend/services/ThemeFilterService";
import cityImages from "../data/cityImages";

const HomeScreen = ({ navigation }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [allRecommendations, setAllRecommendations] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  const categories = [
    "Nature",
    "Histoire",
    "Gastronomie",
    "Shopping",
    "Divertissement",
  ];

  // Charger le profil et les recommandations une seule fois au montage
  useEffect(() => {
    loadUserProfile();
    loadRecommendations();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await UserRepository.getProfile([
        "firstName",
        "lastName",
      ]);
      setUserProfile(profile);
    } catch (error) {
      console.error("Erreur chargement profil:", error);
    }
  };

  const loadRecommendations = async () => {
    if (selectedCategory) return; // Ne pas recharger si on est en train de filtrer

    setLoading(true);
    try {
      // 1. Récupérer le profil complet (avec ID)
      const profile = await UserRepository.getProfile();

      if (profile && profile.id) {
        // 2. Récupérer les likes ET les dislikes de la BD
        const userLikes = await UserCategoryRepository.getUserLikes(profile.id);
        const userDislikes = await UserCategoryRepository.getUserDislikes(
          profile.id,
        );
        const likedCategories = userLikes.map((l) => l.category_name);

        console.log(
          `📊 Profil chargé - Likes: ${userLikes.length}, Dislikes: ${userDislikes.length}`,
        );

        // Afficher les dislikes qui seront utilisés pour les pénalités
        if (userDislikes.length > 0) {
          console.log(
            "❌ Dislikes récupérés de la BD (pénalités à appliquer):",
          );
          userDislikes.forEach((d) => {
            console.log(
              `   - ${d.category_name}: ${d.points} points de pénalité`,
            );
          });
        }

        if (likedCategories.length > 0) {
           // 3. Générer la requête utilisateur
           const query = await generateUserQueryFromUserId(profile.id, likedCategories);
           
           // 4. Calculer le classement avec pénalités (utilise automatiquement les dislikes)
           console.log("🔄 Calcul des recommandations avec pénalités des dislikes...");
           // On récupère un peu plus de résultats (20) pour permettre le filtrage
           const rankedCities = await rankCitiesWithPenalty(query, profile.id, 20);
           console.log("✅ Recommandations calculées avec succès");
           setAllRecommendations(rankedCities);
           setRecommendations(rankedCities);
        } else {
          setRecommendations([]);
          setAllRecommendations([]);
        }
      }
    } catch (error) {
      console.error("Erreur chargement recommandations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Gestion du filtrage par catégorie
  const handleCategoryPress = async (category) => {
    if (selectedCategory === category) {
      // Désélectionner : on remet toutes les recommandations
      setSelectedCategory(null);
      setRecommendations(allRecommendations);
    } else {
      // Sélectionner : on filtre
      setSelectedCategory(category);
      setLoading(true);
      try {
        const cityIds = allRecommendations.map(c => c.id);
        // Utilisation du service de filtrage
        const filteredResults = await ThemeFilterService.filterCitiesByTheme(cityIds, category);
        const filteredCityIds = new Set(filteredResults.map(r => r.cityId));
        
        const filteredRecs = allRecommendations.filter(c => filteredCityIds.has(c.id));
        setRecommendations(filteredRecs);
      } catch (error) {
        console.error("Erreur filtrage:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Fonction pour naviguer vers le détail
  const goToDetails = (city) => {
    const maxScore = recommendations[0]?.score || 1;
    navigation.navigate("Details", { city, maxScore });
  };

  // Fonction pour aller au questionnaire
  const startQuiz = () => navigation.navigate("Preferences");

  const renderHorizontalItem = ({ item }) => {
    // Vérifier si une image locale existe
    const localImage = cityImages[item.name];

    // URL de l'image (Locale > API > Placeholder)
    const imageSource = localImage
      ? localImage
      : {
          uri: `http://10.0.2.2:5001/api/travel/photos/image/search?q=${encodeURIComponent(item.name)}&size=regular`,
        };

    return (
      <TouchableOpacity
        style={styles.cardHorizontal}
        onPress={() => goToDetails(item)}
      >
        <Image
          source={imageSource}
          style={styles.cardImage}
          defaultSource={{
            uri: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1",
          }} // Placeholder
        />
        <View style={styles.textOverlay}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>
            Score: {Math.round(item.score * 100)}%
            {item.penalty > 0 ? ` (Pénalité: -${item.penalty.toFixed(2)})` : ""}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: "https://randomuser.me/api/portraits/women/44.jpg" }}
          style={styles.avatar}
        />
        <Text style={styles.greeting}>
          Bonjour {userProfile?.firstName || "Voyageur"}
        </Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Catégories de voyage */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, marginTop: 15 }}
        >
          {categories.map((cat, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipSelected,
              ]}
              onPress={() => handleCategoryPress(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.categoryTextSelected,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Scroll Horizontal */}
        <Text style={styles.sectionTitle}>Recommandations pour vous</Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#007AFF"
            style={{ marginVertical: 20 }}
          />
        ) : recommendations.length > 0 ? (
          <FlatList
            horizontal
            data={recommendations}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderHorizontalItem}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          />
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{ color: "gray", fontStyle: "italic" }}>
              Répondez au quiz pour obtenir des recommandations personnalisées !
            </Text>
          </View>
        )}

        {/* Liste Verticale */}
        <Text style={styles.sectionTitle}>Recommandé pour vous</Text>
        <TouchableOpacity onPress={goToDetails} style={styles.cardVertical}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963",
            }}
            style={styles.verticalImage}
          />
          <View style={styles.cardInfo}>
            <Text style={styles.verticalTitle}>Cinque Terre, Italie</Text>
            <Text style={styles.verticalSubtitle}>Côte pittoresque</Text>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Romantique</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
    paddingTop: 10,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  greeting: { fontSize: 18, fontWeight: "bold", flex: 1, marginLeft: 10 },
  searchBar: {
    flexDirection: "row",
    backgroundColor: "#E9ECEF",
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  input: { marginLeft: 10, flex: 1 },

  // Styles du Bouton Quiz
  quizButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 15,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  quizButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    margin: 20,
    marginBottom: 15,
    marginTop: 25,
  },
  cardHorizontal: {
    width: 220,
    height: 280,
    marginRight: 15,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "black",
  },
  cardImage: { width: "100%", height: "100%", opacity: 0.8 },
  textOverlay: { position: "absolute", bottom: 15, left: 15 },
  cardTitle: { color: "white", fontWeight: "bold", fontSize: 18 },
  cardSubtitle: { color: "white", fontSize: 12 },
  categoryChip: {
    backgroundColor: "#DDEEFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  categoryChipSelected: { backgroundColor: "#007AFF" },
  categoryText: { color: "#333" },
  categoryTextSelected: { color: "white", fontWeight: "bold" },
  cardVertical: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 15,
    padding: 10,
    alignItems: "center",
  },
  verticalImage: { width: 80, height: 80, borderRadius: 15 },
  cardInfo: { marginLeft: 15, flex: 1 },
  verticalTitle: { fontWeight: "bold", fontSize: 16 },
  verticalSubtitle: { color: "gray", marginBottom: 5 },
  tag: {
    backgroundColor: "#FFE4C4",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: { color: "#D2691E", fontSize: 10, fontWeight: "bold" },
});

export default HomeScreen;

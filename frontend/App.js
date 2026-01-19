import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Imports de la nouvelle interface (Navigation)
import AppNavigator from "./src/navigation/AppNavigator";
import { perfMonitor } from "./src/utils/PerformanceMonitor";

// Vos imports Backend existants
import CityRepository from "./src/backend/repositories/CityRepository.js";
import UserRepository from "./src/backend/repositories/UserRepository.js";
import UserCategoryRepository from "./src/backend/repositories/UserCategoryRepository.js";
import CityActivityService from "./src/backend/services/CityActivityService.js";
import PlaceRepository from "./src/backend/repositories/PlaceRepository.js";
import {
  generateUserQuery,
  generateUserQueryWithWeights,
  generateUserQueryFromUserId,
} from "./src/backend/algorithms/userQuery.js";
import { rankCitiesWithPenalty } from "./src/backend/algorithms/rankUtils.js";
import PlaceLikedRepository from "./src/backend/repositories/PlaceLikedRepository.js";
import WelcomeScreen from "./src/screens/WelcomeScreen";

export default function App() {
  // --- VOTRE LOGIQUE BACKEND (Gardée intacte) ---
  useEffect(() => {
    // Tests désactivés - les préférences viennent maintenant du QCM
    // testPenaltySystem();
    // showUserDislikes();
    testNewAlgorithm(); // NOUVEAU TEST
  }, []);

  // TEST DU NOUVEL ALGORITHME (Logique Python Pure: embedding_likes - embedding_dislikes + pénalités)
  const testNewAlgorithm = async () => {
    try {
      await perfMonitor.startMonitoring("Algorithm Test");

      console.log("\n\n🧪 === TEST getCitiesEmbeddingsByCategories ===");
      await perfMonitor.checkpoint(
        "Starting getCitiesEmbeddingsByCategories test",
      );

      const testCategories = [
        "accommodation",
        "accommodation.hotel",
        "building",
        "building.accommodation",
        "building.catering",
        "building.commercial",
        "building.entertainment",
        "building.place_of_worship",
        "building.public_and_civil",
        "building.residential",
        "building.tourism",
        "catering",
        "catering.bar",
        "catering.restaurant",
        "catering.restaurant.brazilian",
        "commercial",
        "commercial.shopping_mall",
        "entertainment",
        "entertainment.culture",
        "entertainment.culture.theatre",
        "entertainment.museum",
        "entertainment.theme_park",
        "fee",
        "internet_access",
        "internet_access.for_customers",
        "internet_access.free",
        "no_fee",
        "no_fee.no",
        "religion",
        "religion.place_of_worship",
        "religion.place_of_worship.christianity",
        "tourism",
        "tourism.attraction",
        "tourism.sights.place_of_worship",
        "tourism.sights.place_of_worship.church",
        "wheelchair",
        "wheelchair.yes",
      ];

      const citiesEmbeddings =
        await CityRepository.getCitiesEmbeddingsByCategories(testCategories);
      await perfMonitor.checkpoint("getCitiesEmbeddingsByCategories completed");

      console.log(
        `\n✅ ${citiesEmbeddings.length} villes trouvées avec embeddings`,
      );

      if (citiesEmbeddings.length > 0) {
        console.log("\n📊 Aperçu des 5 premières villes:");
        citiesEmbeddings.slice(0, 5).forEach((city, index) => {
          console.log(`  ${index + 1}. ${city.name} (ID: ${city.id})`);
        });
      }
    } catch (error) {
      console.error("❌ Erreur test recommendations:", error.message);
      console.error(error);
      await perfMonitor.stopMonitoring("Algorithm Test - ERROR");
    }
  };

  const testGetProfile = async () => {
    try {
      const profile = await UserRepository.getProfile();
      console.log("👤 Profil récupéré:", JSON.stringify(profile, null, 2));
    } catch (error) {
      console.error("❌ Erreur:", error.message);
    }
  };

  const testCreateUser = async () => {
    try {
      console.log("\n\n👤 === TEST CRÉATION UTILISATEUR ===");

      // Vérifier s'il y a déjà des utilisateurs
      const count = await UserRepository.countProfiles();
      console.log(`📊 Nombre d'utilisateurs existants: ${count}`);

      if (count === 0) {
        // Créer un utilisateur de test
        console.log("\n📝 Création d'un utilisateur de test...");
        const userId = await UserRepository.createProfile({
          firstName: "ZZZ",
          lastName: "Lcx",
          email: "jean.lcx@gmail.com",
          dateOfBirth: "1995-05-15",
          country: "France",
          preferences: ["beach", "museum", "restaurant", "hotel"],
          strengths: ["beach", "museum"], // Double-clic sur ces catégories
          weaknesses: ["nightclub"], // Long press sur cette catégorie
        });

        console.log(`✅ Utilisateur créé avec l'ID: ${userId}`);

        // Vérifier s'il y a déjà des utilisateurs
        const count = await UserRepository.countProfiles();
        console.log(`📊 Nombre d'utilisateurs existants: ${count}`);
      }

      // Test de la fonction getProfile()
      console.log("\n📖 Test de getProfile()...");
      const profile = await UserRepository.getProfile();
      console.log("👤 Profil récupéré:", JSON.stringify(profile, null, 2));

      // Test de la fonction updateProfile()
      console.log("\n✏️ Test de updateProfile() - Changement du prénom...");
      console.log(`   Ancien prénom: ${profile.firstName}`);
      await UserRepository.updateProfile({ firstName: "habib" });

      // Vérifier la mise à jour
      const updatedProfile = await UserRepository.getProfile();
      console.log(`   Nouveau prénom: ${updatedProfile.firstName}`);
      console.log("✅ Mise à jour réussie!");
    } catch (error) {
      console.error("❌ Erreur test utilisateur:", error.message);
      console.error(error);
    }
  };

  const testGetAllCityEmbeddings = async () => {
    try {
      console.log("🚀 Chargement de la base de données depuis les assets...");
      console.log("📍 Récupération des embeddings des villes...");
      const embeddings = await CityRepository.getAllCityEmbeddings();

      console.log(`\n✅ ${embeddings.length} villes récupérées!`);

      if (embeddings.length > 0) {
        console.log("\n📊 Aperçu des 3 premières villes:");
        console.log(JSON.stringify(embeddings.slice(0, 3), null, 2));
      }

      console.log("\n📈 Statistiques:");
      console.log(`Total de villes: ${embeddings.length}`);
    } catch (error) {
      console.error("❌ Erreur:", error.message);
      console.error(error);
    }
  };

  const testGenerateEmbedding = async () => {
    try {
      console.log("\n\n🧪 === TEST GÉNÉRATION EMBEDDING LOCAL ===");
      const embedding = await generateEmbeddingLocal(
        "accommodation accommodation.hotel building...", // J'ai raccourci pour la lisibilité
      );
      console.log(
        `✅ Embedding généré avec succès! Dimension: ${embedding.length}`,
      );
    } catch (error) {
      console.error("❌ Erreur génération embedding:", error.message);
    }
  };
  // ----------------------------------------------

  const testRankCities = async () => {
    try {
      console.log("\n\n🧪 === TEST CLASSEMENT DES VILLES ===");

      const userText =
        "accommodation.hotel activity.sport_club building.tourism catering.restaurant.arab halal tourism.sights.archaeological_site vegan vegetarian beach catering no_fee.no internet_access.free wheelchair building catering.cafe.ice_cream catering.cafe.coffee_shop catering.bar catering.ice_cream catering.restaurant.pizza internet_access entertainment.museum accommodation.hotel catering.restaurant.sushi building.accommodation no_fee building.commercial catering.cafe.coffee commercial.shopping_mall wheelchair.yes internet_access.for_customers commercial building.tourism catering.restaurant.argentinian entertainment building.catering";
      const dislikesText = "";

      const top10 = await rankCitiesBySimilarity(userText, dislikesText);

      console.log(
        "\n✅ Top 10 des villes recommandées:",
        JSON.stringify(top10, null, 2),
      );
    } catch (error) {
      console.error("❌ Erreur classement villes:", error.message);
      console.error(error);
    }
  };

  return (
    <SafeAreaProvider>
      {/* On remplace la View simple par le Navigateur complet */}
      <AppNavigator />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

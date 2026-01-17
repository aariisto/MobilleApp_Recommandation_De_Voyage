import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Imports de la nouvelle interface (Navigation)
import AppNavigator from "./src/navigation/AppNavigator";

// Vos imports Backend existants
import CityRepository from "./src/backend/repositories/CityRepository.js";
import UserRepository from "./src/backend/repositories/UserRepository.js";
import UserCategoryRepository from "./src/backend/repositories/UserCategoryRepository.js";
import CityActivityService from "./src/backend/services/CityActivityService.js";
import {
  generateUserQuery,
  generateUserQueryWithWeights,
  generateUserQueryFromUserId,
} from "./src/backend/algorithms/userQuery.js";
import { rankCitiesWithPenalty } from "./src/backend/algorithms/rankUtils.js";

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
      console.log("\n\n🧪 === TEST CITY ACTIVITIES ===");
      console.log("🏙️ Récupération des activités pour la ville ID: 1");

      const activities = await CityActivityService.getCityActivities(1);

      console.log("\n✅ Activités récupérées:");
      console.log(JSON.stringify(activities, null, 2));

      // Afficher le nombre de places par thème
      Object.entries(activities).forEach(([theme, places]) => {
        console.log(`\n📍 ${theme}: ${places.length} places`);
        places.forEach((place, index) => {
          console.log(`  ${index + 1}. ${place.name}`);
        });
      });
    } catch (error) {
      console.error("❌ Erreur test activities:", error.message);
      console.error(error);
    }
  };

  const testGenerateUserEmbedding = async () => {
    try {
      console.log("\n\n🧪 === TEST GÉNÉRATION USER EMBEDDING ===");

      // Vérifier si un utilisateur existe, sinon en créer un
      const count = await UserRepository.countProfiles();
      if (count === 0) {
        console.log("📝 Création d'un utilisateur de test...");
        await UserRepository.createProfile({
          firstName: "Idir",
          lastName: "User",
          email: "test@example.com",
        });
        console.log("✅ Utilisateur créé");
      }

      const likedCategories = ["museum", "beach", "restaurant", "hotel"];
      const dislikedCategories = ["nightclub", "casino"];

      console.log("👍 Likes:", likedCategories);
      console.log("👎 Dislikes:", dislikedCategories);

      const embedding = await UserRepository.generateAndStoreUserEmbedding(
        likedCategories,
        dislikedCategories,
      );

      console.log(
        `✅ Embedding généré et stocké! Dimension: ${embedding.length}`,
      );

      // Récupérer l'embedding stocké en BD
      const profile = await UserRepository.getProfile(["userEmbedding"]);

      if (profile && profile.userEmbedding) {
        console.log("\n🏙️ === CLASSEMENT DES VILLES ===");
        console.log(
          `📊 Utilisation de l'embedding stocké (${profile.userEmbedding.length} dims)`,
        );

        // Classer les villes avec l'embedding de la BD
        const top10 = await rankCitiesBySimilarity(profile.userEmbedding);

        console.log("\n✅ Top 10 des villes recommandées:");
        top10.forEach((city, index) => {
          console.log(
            `  ${index + 1}. ${
              city.name
            } - Similarité: ${city.similarity.toFixed(4)}`,
          );
        });
      }
    } catch (error) {
      console.error("❌ Erreur:", error.message);
      console.error(error);
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

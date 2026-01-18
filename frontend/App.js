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
import PlaceRepository from "./src/backend/repositories/PlaceRepository.js";
import {
  generateUserQuery,
  generateUserQueryWithWeights,
  generateUserQueryFromUserId,
} from "./src/backend/algorithms/userQuery.js";
import { rankCitiesWithPenalty } from "./src/backend/algorithms/rankUtils.js";
import PlaceLikedRepository from "./src/backend/repositories/PlaceLikedRepository.js";

export default function App() {
  // --- VOTRE LOGIQUE BACKEND (Gardée intacte) ---
  useEffect(() => {
    // Tests désactivés - les préférences viennent maintenant du QCM
    // testPenaltySystem();
    // showUserDislikes();
    // testNewAlgorithm(); // NOUVEAU TEST
  }, []);

  // TEST DU NOUVEL ALGORITHME (Logique Python Pure: embedding_likes - embedding_dislikes + pénalités)
  const testNewAlgorithm = async () => {
    try {
      console.log("\n\n🧪 === PRÉPARATION DONNÉES TEST ===");

      // 1. Récupérer des places d'Istanbul (ID 11) pour le test
      // On suppose que l'ID 11 est Istanbul comme mentionné
      const istanbulPlaces = await PlaceRepository.getPlacesByCity(11);

      if (istanbulPlaces && istanbulPlaces.length > 0) {
        // On prend la première place trouvée
        const placeToLike = istanbulPlaces[0];
        console.log(
          `📍 Tentative d'ajout d'un like pour : ${placeToLike.name} (Ville ID: ${placeToLike.city_id}, Place ID: ${placeToLike.id})`,
        );

        // Vérifier si déjà liké pour éviter erreur de contrainte UNIQUE
        const existingLikeCount = await PlaceLikedRepository.countLikesForPlace(
          placeToLike.id,
        );

        if (existingLikeCount === 0) {
          await PlaceLikedRepository.addPlaceLiked(placeToLike.id);
          console.log("✅ Like ajouté avec succès !");
        } else {
          console.log(
            "ℹ️ Cette place est déjà likée (pas d'ajout nécessaire).",
          );
        }
      } else {
        console.log(
          "❌ Aucune place trouvée pour la ville ID 11. Impossible d'ajouter un like pour ce test.",
        );
      }

      console.log("\n\n🧪 === TEST GET ALL PLACES LIKED ===");

      const allLiked = await PlaceLikedRepository.getAllPlacesLiked();

      console.log(`\n✅ Total de places likées: ${allLiked.length}`);

      if (allLiked.length > 0) {
        console.log("\n📍 Liste des places likées:");
        allLiked.forEach((liked, index) => {
          console.log(
            `  ${index + 1}. Place ID: ${liked.id_places}, Created: ${liked.created_at}`,
          );
        });
      } else {
        console.log("⚠️ Aucune place likée trouvée dans la base de données.");
      }

      console.log("\n\n🧪 === TEST RECOMMENDATIONS FROM LIKED PLACES ===");

      const recommendations =
        await CityActivityService.getRecommendationsFromLikedPlaces();

      console.log("\n✅ Recommandations récupérées:");
      console.log(JSON.stringify(recommendations, null, 2));

      // Afficher les détails par ville
      Object.entries(recommendations).forEach(([cityId, places]) => {
        console.log(
          `\n🏙️ Ville ID ${cityId}: ${places.length} places recommandées`,
        );
        places.forEach((place, index) => {
          console.log(`  ${index + 1}. ${place.name} (Thème: ${place.theme})`);
        });
      });

      if (Object.keys(recommendations).length === 0) {
        console.log(
          "⚠️ Aucune recommandation trouvée. Vérifiez qu'il y a des places likées dans la base.",
        );
      }
    } catch (error) {
      console.error("❌ Erreur test recommendations:", error.message);
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

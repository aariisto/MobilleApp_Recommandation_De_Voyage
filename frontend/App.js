import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Imports de la nouvelle interface (Navigation)
import AppNavigator from "./src/navigation/AppNavigator";

// Vos imports Backend existants
import CityRepository from "./src/backend/repositories/CityRepository.js";
import UserRepository from "./src/backend/repositories/UserRepository.js";
import UserCategoryRepository from "./src/backend/repositories/UserCategoryRepository.js";
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
      console.log("\n" + "=".repeat(80));
      console.log("🧪 TEST generateUserQueryFromUserId");
      console.log("=".repeat(80));

      const userId = 1;

      // Récupérer les likes de la base de données
      console.log(
        `\n📊 Récupération des likes depuis la BD pour userId=${userId}...`
      );
      const userLikes = await UserCategoryRepository.getUserLikes(userId);

      console.log(`\n✅ ${userLikes.length} likes récupérés:`);
      userLikes.forEach((like, index) => {
        const bar = "█".repeat(like.points) + "░".repeat(5 - like.points);
        console.log(
          `   ${index + 1}. ${like.category_name} - ${like.points}/5 | ${bar}`
        );

      });
      // Récupérer les dislikes de la base de données
      console.log(
        `\n Récupération des dislikes depuis la BD pour userId=${userId}...`
      );
      const userDislikes = await UserCategoryRepository.getUserDislikes(userId);
      console.log(`${userDislikes.length} dislikes récupérés:`);
      userDislikes.forEach((dislike, index) => {
        const bar = "█".repeat(dislike.points) + "░".repeat(5 - dislike.points);
        console.log(
          `   ${index + 1}. ${dislike.category_name} - ${dislike.points}/5 | ${bar}`
        );
      });
    

      // Catégories de test
      const user_categories = [
        "building",
        "building.commercial",
        "building.entertainment",
        "building.historic",
        "building.place_of_worship",
        "building.public_and_civil",
        "building.tourism",
        "commercial",
        "commercial.shopping_mall",
        "education",
        "education.library",
        "entertainment",
        "entertainment.culture",
        "entertainment.culture.theatre",
        "entertainment.museum",
        "fee",
        "heritage",
        "internet_access",
        "leisure",
        "leisure.park",
        "no_fee",
        "no_fee.no",
        "religion",
        "religion.place_of_worship",
        "religion.place_of_worship.christianity",
        "tourism",
        "tourism.attraction",
        "tourism.sights",
        "tourism.sights.memorial",
        "tourism.sights.memorial.ship",
        "tourism.sights.place_of_worship",
        "wheelchair",
        "wheelchair.limited",
        "wheelchair.yes",
      ];

      console.log(
        `\n📝 Catégories de test: ${user_categories.length} catégories`
      );
      console.log(`   Exemples: ${user_categories.slice(0, 5).join(", ")}...`);

      // Test de generateUserQueryFromUserId
      console.log(
        `\n🔄 Appel de generateUserQueryFromUserId(${userId}, categories)...`
      );
      const query = await generateUserQueryFromUserId(userId, user_categories);

      console.log(`\n✅ Requête générée:`);
      console.log(`   "${query}"`);

      // Afficher l'embedding de Paris (id: 1)
      console.log(`\n🗼 Récupération de l'embedding de Paris (id: 1)...`);
      const paris = await CityRepository.getCityWithEmbedding(1);

      if (paris) {
        console.log(`\n📍 Ville: ${paris.name}`);
        console.log(`   Coordonnées: ${paris.lat}, ${paris.lon}`);
        console.log(`   Country ID: ${paris.country_id}`);
        console.log(
          `   Embedding dimensions: ${
            paris.embeddingVector ? paris.embeddingVector.length : "N/A"
          }`
        );

        if (paris.embeddingVector) {
          console.log(`   Premiers 10 valeurs de l'embedding:`);
          console.log(paris.embeddingVector);
        }
      } else {
        console.log(`   ⚠️ Paris non trouvé dans la base de données`);
      }

      // Ranking des villes avec pénalités
      console.log(`\n🏙️ Classement des villes avec pénalités...`);
      const topCities = await rankCitiesWithPenalty(query, userId, 10);

      console.log(`\n🏆 Top 10 villes recommandées:`);
      topCities.forEach((city, index) => {
        const penInfo =
          city.penalty > 0 ? ` ⚠️ -${city.penalty.toFixed(3)}` : "";
        const simBar = "█".repeat(Math.round(city.similarity * 20));
        console.log(
          `   ${index + 1}. ${city.name}\n` +
            `      Score: ${city.score.toFixed(
              4
            )} | Sim: ${city.similarity.toFixed(4)}${penInfo}\n` +
            `      ${simBar}`
        );
      });

      console.log("\n" + "=".repeat(80));
      console.log("✅ Test terminé avec succès!");
      console.log("=".repeat(80) + "\n");
    } catch (error) {
      console.error("❌ Erreur lors du test:", error);
      console.error(error.stack);
    }
  };

  // Afficher les préférences sauvegardées avec poids
  const showUserDislikes = async () => {
    try {
      const userId = 1;
      const profile = await UserCategoryRepository.getUserPreferencesProfile(
        userId
      );

      console.log("\n" + "=".repeat(80));
      console.log("📊 PRÉFÉRENCES DE L'UTILISATEUR");
      console.log("=".repeat(80));

      // LIKES
      console.log("\n✅ CATÉGORIES AIMÉES (LIKES):");
      if (profile.likes.length === 0) {
        console.log("   ⚠️ Aucune catégorie aimée");
      } else {
        console.log(`   Total: ${profile.likes.length} catégories\n`);
        profile.likes.forEach((like) => {
          const bar = "█".repeat(like.points) + "░".repeat(5 - like.points);
          console.log(`   • ${like.category_name} (${like.points}/5) | ${bar}`);
        });
        const avgLikes = (
          profile.likes.reduce((sum, l) => sum + l.points, 0) /
          profile.likes.length
        ).toFixed(2);
        console.log(`\n   📈 Poids moyen: ${avgLikes}/5`);
      }

      // DISLIKES
      console.log("\n❌ CATÉGORIES NON AIMÉES (DISLIKES):");
      if (profile.dislikes.length === 0) {
        console.log("   ⚠️ Aucune catégorie dislikée");
      } else {
        console.log(`   Total: ${profile.dislikes.length} catégories\n`);
        profile.dislikes.forEach((dislike) => {
          const bar =
            "█".repeat(dislike.points) + "░".repeat(5 - dislike.points);
          console.log(
            `   • ${dislike.category_name} (${dislike.points}/5) | ${bar}`
          );
        });
        const avgDislikes = (
          profile.dislikes.reduce((sum, d) => sum + d.points, 0) /
          profile.dislikes.length
        ).toFixed(2);
        console.log(`\n   📈 Poids moyen: ${avgDislikes}/5`);
      }

      console.log("\n" + "=".repeat(80) + "\n");
    } catch (error) {
      console.error("❌ Erreur affichage préférences:", error);
    }
  };

  // Test du système de pénalité avec les données du QCM
  const testPenaltySystem = async () => {
    console.log("\n🧪 TEST PÉNALITÉ (données QCM)\n");
    try {
      const userId = 1;

      // 1. Récupérer les préférences du QCM depuis la BDD
      const profile = await UserCategoryRepository.getUserPreferencesProfile(
        userId
      );

      if (profile.likes.length === 0 && profile.dislikes.length === 0) {
        console.log(
          "⚠️ Aucune préférence trouvée. Veuillez d'abord compléter le QCM!"
        );
        return;
      }

      console.log(
        `👍 Likes (${profile.likes.length}):`,
        profile.likes.map((l) => `${l.category_name}(${l.points})`).join(", ")
      );
      console.log(
        `👎 Dislikes (${profile.dislikes.length}):`,
        profile.dislikes
          .map((d) => `${d.category_name}(${d.points})`)
          .join(", ")
      );

      // 2. Générer l'embedding basé sur les likes du QCM
      const likesText = profile.likes.map((l) => l.category_name).join(" ");
      console.log("\n📝 Texte pour embedding:", likesText);

      const userEmbedding = await getUserEmbedding(likesText, "");

      // 3. Ranking avec pénalité
      const topCities = await rankCitiesWithPenalty(userEmbedding, userId, 5);

      console.log("\n🏙️ Top 5 villes (avec pénalités):");
      topCities.forEach((c, i) => {
        const penInfo = c.penalty > 0 ? ` ⚠️ pen: ${c.penalty.toFixed(3)}` : "";
        console.log(
          `  ${i + 1}. ${c.name} - Score: ${c.score.toFixed(
            3
          )} (sim: ${c.similarity.toFixed(3)}${penInfo})`
        );
      });
    } catch (e) {
      console.error("❌", e);
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
        dislikedCategories
      );

      console.log(
        `✅ Embedding généré et stocké! Dimension: ${embedding.length}`
      );

      // Récupérer l'embedding stocké en BD
      const profile = await UserRepository.getProfile(["userEmbedding"]);

      if (profile && profile.userEmbedding) {
        console.log("\n🏙️ === CLASSEMENT DES VILLES ===");
        console.log(
          `📊 Utilisation de l'embedding stocké (${profile.userEmbedding.length} dims)`
        );

        // Classer les villes avec l'embedding de la BD
        const top10 = await rankCitiesBySimilarity(profile.userEmbedding);

        console.log("\n✅ Top 10 des villes recommandées:");
        top10.forEach((city, index) => {
          console.log(
            `  ${index + 1}. ${
              city.name
            } - Similarité: ${city.similarity.toFixed(4)}`
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
        "accommodation accommodation.hotel building..." // J'ai raccourci pour la lisibilité
      );
      console.log(
        `✅ Embedding généré avec succès! Dimension: ${embedding.length}`
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
        JSON.stringify(top10, null, 2)
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

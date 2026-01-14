import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Imports de la nouvelle interface (Navigation)
import AppNavigator from "./src/navigation/AppNavigator";

// Vos imports Backend existants
import CityRepository from "./src/backend/repositories/CityRepository.js";
import UserRepository from "./src/backend/repositories/UserRepository.js";
import UserCategoryRepository from "./src/backend/repositories/UserCategoryRepository.js";
import { rankCitiesBySimilarity } from "./src/backend/algorithms/testeAlgo.js";
import { calculatePenaltyForCity, getCityCategoriesFromDb } from "./src/backend/algorithms/penaltyCalculate.js";
import { generateUserQuery, generateUserQueryWithWeights } from "./src/backend/algorithms/userQuery.js";

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
      console.log('\n' + '='.repeat(80));
      console.log('🧪 TEST ALGORITHME PYTHON PORTÉ EN JAVASCRIPT');
      console.log('📐 Logique: embedding_likes - embedding_dislikes + pénalités POST-ranking');
      console.log('='.repeat(80));

      const userId = 1;

      // 1. Récupérer les préférences depuis le QCM
      const profile = await UserCategoryRepository.getUserPreferencesProfile(userId);

      if (profile.likes.length === 0) {
        console.log('⚠️ Aucune préférence trouvée. Veuillez d\'abord compléter le QCM!');
        return;
      }

      console.log(`\n📊 Préférences chargées:`);
      console.log(`   👍 Likes: ${profile.likes.length} catégories`);
      console.log(`   👎 Dislikes: ${profile.dislikes.length} catégories`);

      // 2. Construire les catégories et poids pour LIKES
      const likedCategories = profile.likes.map(l => l.category_name);
      const likedWeights = {};
      profile.likes.forEach(like => {
        likedWeights[like.category_name] = like.points;
      });

      // 3. Construire les catégories et poids pour DISLIKES
      const dislikedCategories = profile.dislikes.map(d => d.category_name);
      const dislikedWeights = {};
      profile.dislikes.forEach(dislike => {
        dislikedWeights[dislike.category_name] = dislike.points;
      });

      console.log(`\n📝 Catégories aimées:`, likedCategories.slice(0, 5), `... (${likedCategories.length} total)`);
      console.log(`📝 Catégories détestées:`, dislikedCategories.slice(0, 5), `... (${dislikedCategories.length} total)`);

      // 4. Générer les requêtes en langage naturel avec poids
      console.log(`\n🔄 Génération des requêtes en langage naturel...`);
      
      const likesText = generateUserQueryWithWeights(likedCategories, likedWeights);
      console.log(`\n✅ Requête LIKES générée:`);
      console.log(`   "${likesText}"`);

      const dislikesText = dislikedCategories.length > 0 
        ? generateUserQueryWithWeights(dislikedCategories, dislikedWeights)
        : '';
      
      if (dislikesText) {
        console.log(`\n❌ Requête DISLIKES générée:`);
        console.log(`   "${dislikesText}"`);
      }

      // 5. Récupérer toutes les villes avec embeddings
      console.log(`\n🏙️ Chargement des villes avec embeddings...`);
      const cities = await CityRepository.getAllCityEmbeddings();
      console.log(`   ✓ ${cities.length} villes chargées`);

      // 6. Calcul de la similarité pour TOUTES les villes (UNIQUEMENT sur les likes)
      console.log(`\n🎯 Calcul de la similarité (teste_algo.py: rank_cities_by_similarity)...`);
      console.log(`   📐 Utilisation: UNIQUEMENT embedding_likes (pas de soustraction)`);
      const rankedCities = await rankCitiesBySimilarity(likesText, cities, "");
      console.log(`   ✓ ${rankedCities.length} villes avec similarité calculée`);

      // 7. Calculer les pénalités pour TOUTES les villes (penality_calculate.py)
      console.log(`\n⚖️  Calcul des pénalités pour TOUTES les villes...`);
      console.log(`   📐 Formule: Penalty = 0.05 × poids pour chaque catégorie détestée présente`);
      
      const citiesWithPenalties = [];
      for (const city of rankedCities) {
        // Calculer la pénalité pour cette ville
        const penalty = await calculatePenaltyForCity(city.id, dislikedWeights);
        const finalScore = city.similarity - penalty;
        
        citiesWithPenalties.push({
          ...city,
          penalty,
          finalScore
        });
      }
      console.log(`   ✓ Pénalités calculées pour ${citiesWithPenalties.length} villes`);

      // 8. TRI PAR SCORE FINAL (après application des pénalités)
      console.log(`\n🔄 Tri des villes par score final (similarité - pénalité)...`);
      citiesWithPenalties.sort((a, b) => b.finalScore - a.finalScore);
      
      // 9. Récupérer les détails des pénalités pour le Top 10 seulement
      console.log(`\n📋 Récupération des détails pour le Top 10...`);
      const top10 = [];
      for (const city of citiesWithPenalties.slice(0, 10)) {
        const cityCategories = await getCityCategoriesFromDb(city.id);
        const dislikedMatches = [];
        
        for (const [dislikedCat, weight] of Object.entries(dislikedWeights)) {
          if (cityCategories.includes(dislikedCat)) {
            dislikedMatches.push({
              category: dislikedCat,
              points: weight,
              penalty: weight * 0.05
            });
          }
        }
        
        top10.push({
          ...city,
          dislikedMatches
        });
      }

      // 10. Afficher le Top 10 avec détails complets
      console.log(`\n🏆 TOP 10 FINAL (Similarité sur likes PUIS tri par score final):`);
      console.log('='.repeat(80));
      
      top10.forEach((city, i) => {
        console.log(`\n${i + 1}. ${city.name} (ID: ${city.id})`);
        console.log(`   📊 Similarité: ${city.similarity.toFixed(4)}`);
        console.log(`   ⚖️  Pénalité totale: -${city.penalty.toFixed(4)}`);
        console.log(`   ✨ Score final: ${city.finalScore.toFixed(4)}`);
        
        if (city.dislikedMatches.length > 0) {
          console.log(`   ❌ Catégories détestées présentes (${city.dislikedMatches.length}):`);
          city.dislikedMatches.forEach(match => {
            console.log(`      • ${match.category} (${match.points} pts) → -${match.penalty.toFixed(2)}`);
          });
        } else {
          console.log(`   ✅ Aucune catégorie détestée`);
        }
      });

      console.log('\n' + '='.repeat(80));
      console.log('✅ Test terminé avec succès!');
      console.log('📝 Logique appliquée:');
      console.log('   1. user_query.py → Génération des requêtes naturelles (likes ET dislikes)');
      console.log('   2. teste_algo.py → Calcul similarité sur LIKES uniquement (TOUTES les villes)');
      console.log('   3. penality_calculate.py → Calcul pénalités (0.05 × poids) pour TOUTES les villes');
      console.log('   4. Score final = similarité - pénalité');
      console.log('   5. TRI par score final décroissant → Top 10');
      console.log('='.repeat(80) + '\n');

    } catch (error) {
      console.error('❌ Erreur lors du test du nouvel algorithme:', error);
      console.error(error.stack);
    }
  };

  // Afficher les préférences sauvegardées avec poids
  const showUserDislikes = async () => {
    try {
      const userId = 1;
      const profile = await UserCategoryRepository.getUserPreferencesProfile(userId);
      
      console.log('\n' + '='.repeat(80));
      console.log('📊 PRÉFÉRENCES DE L\'UTILISATEUR');
      console.log('='.repeat(80));
      
      // LIKES
      console.log('\n✅ CATÉGORIES AIMÉES (LIKES):');
      if (profile.likes.length === 0) {
        console.log('   ⚠️ Aucune catégorie aimée');
      } else {
        console.log(`   Total: ${profile.likes.length} catégories\n`);
        profile.likes.forEach(like => {
          const bar = '█'.repeat(like.points) + '░'.repeat(5 - like.points);
          console.log(`   • ${like.category_name} (${like.points}/5) | ${bar}`);
        });
        const avgLikes = (profile.likes.reduce((sum, l) => sum + l.points, 0) / profile.likes.length).toFixed(2);
        console.log(`\n   📈 Poids moyen: ${avgLikes}/5`);
      }
      
      // DISLIKES
      console.log('\n❌ CATÉGORIES NON AIMÉES (DISLIKES):');
      if (profile.dislikes.length === 0) {
        console.log('   ⚠️ Aucune catégorie dislikée');
      } else {
        console.log(`   Total: ${profile.dislikes.length} catégories\n`);
        profile.dislikes.forEach(dislike => {
          const bar = '█'.repeat(dislike.points) + '░'.repeat(5 - dislike.points);
          console.log(`   • ${dislike.category_name} (${dislike.points}/5) | ${bar}`);
        });
        const avgDislikes = (profile.dislikes.reduce((sum, d) => sum + d.points, 0) / profile.dislikes.length).toFixed(2);
        console.log(`\n   📈 Poids moyen: ${avgDislikes}/5`);
      }
      
      console.log('\n' + '='.repeat(80) + '\n');
    } catch (error) {
      console.error('❌ Erreur affichage préférences:', error);
    }
  };

  // Test du système de pénalité avec les données du QCM
  const testPenaltySystem = async () => {
    console.log('\n🧪 TEST PÉNALITÉ (données QCM)\n');
    try {
      const userId = 1;

      // 1. Récupérer les préférences du QCM depuis la BDD
      const profile = await UserCategoryRepository.getUserPreferencesProfile(userId);
      
      if (profile.likes.length === 0 && profile.dislikes.length === 0) {
        console.log('⚠️ Aucune préférence trouvée. Veuillez d\'abord compléter le QCM!');
        return;
      }

      console.log(`👍 Likes (${profile.likes.length}):`, profile.likes.map(l => `${l.category_name}(${l.points})`).join(', '));
      console.log(`👎 Dislikes (${profile.dislikes.length}):`, profile.dislikes.map(d => `${d.category_name}(${d.points})`).join(', '));

      // 2. Générer l'embedding basé sur les likes du QCM
      const likesText = profile.likes.map(l => l.category_name).join(' ');
      console.log('\n📝 Texte pour embedding:', likesText);
      
      const userEmbedding = await getUserEmbedding(likesText, '');
      
      // 3. Ranking avec pénalité
      const topCities = await rankCitiesWithPenalty(userEmbedding, userId, 5);
      
      console.log('\n🏙️ Top 5 villes (avec pénalités):');
      topCities.forEach((c, i) => {
        const penInfo = c.penalty > 0 ? ` ⚠️ pen: ${c.penalty.toFixed(3)}` : '';
        console.log(`  ${i+1}. ${c.name} - Score: ${c.score.toFixed(3)} (sim: ${c.similarity.toFixed(3)}${penInfo})`);
      });

    } catch (e) { console.error('❌', e); }
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

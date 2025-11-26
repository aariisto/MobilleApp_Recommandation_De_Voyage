import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Imports de la nouvelle interface (Navigation)
import AppNavigator from "./src/navigation/AppNavigator";

// Vos imports Backend existants
import CityRepository from "./src/backend/repositories/CityRepository.js";
import UserRepository from "./src/backend/repositories/UserRepository.js";
import { generateEmbeddingLocal } from "./src/backend/algorithms/vectorUtils.js";
import { rankCitiesBySimilarity } from "./src/backend/algorithms/rankUtils.js";

export default function App() {
  
  // --- VOTRE LOGIQUE BACKEND (Gardée intacte) ---
  useEffect(() => {
    // testGetAllCityEmbeddings();
    // testGenerateEmbedding();
    // testRankCities();
    testCreateUser();
  }, []);

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
          firstName: "Jean",
          lastName: "Lcx",
          email: "jean.lcx@gmail.com",
          dateOfBirth: "1995-05-15",
          country: "France",
          preferences: ["beach", "museum", "restaurant", "hotel"],
          strengths: ["beach", "museum"],  // Double-clic sur ces catégories
          weaknesses: ["nightclub"]  // Long press sur cette catégorie
        });
        
        console.log(`✅ Utilisateur créé avec l'ID: ${userId}`);
      }
      
      // Récupérer tous les utilisateurs
      console.log("\n📋 Récupération de tous les profils...");
      const profiles = await UserRepository.getAllProfiles();
      console.log(`✅ ${profiles.length} profil(s) trouvé(s):`);
      profiles.forEach(profile => {
        console.log(`  - ${profile.firstName} ${profile.lastName} (${profile.email})`);
        console.log(`    Préférences: ${profile.preferences.join(', ')}`);
        console.log(`    Points forts: ${profile.strengths.join(', ')}`);
        console.log(`    Points faibles: ${profile.weaknesses.join(', ')}`);
      });
      
      // Récupérer le dernier profil
      console.log("\n🔍 Récupération du profil le plus récent...");
      const latestProfile = await UserRepository.getLatestProfile();
      if (latestProfile) {
        console.log(`✅ Dernier profil: ${latestProfile.firstName} ${latestProfile.lastName}`);
        console.log(`   Email: ${latestProfile.email}`);
        console.log(`   Pays: ${latestProfile.country}`);
        console.log(`   Date de naissance: ${latestProfile.dateOfBirth}`);
      }
      
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
      console.log(`✅ Embedding généré avec succès! Dimension: ${embedding.length}`);
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
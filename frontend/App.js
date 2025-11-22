import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { useEffect } from "react";
import CityRepository from "./src/backend/repositories/CityRepository.js";
import { generateEmbeddingLocal } from "./src/backend/algorithms/vectorUtils.js";
import { rankCitiesBySimilarity } from "./src/backend/algorithms/rankUtils.js";

export default function App() {
  useEffect(() => {
    // testGetAllCityEmbeddings();
    // testGenerateEmbedding();
    testRankCities();
  }, []);

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

      // Statistiques
      console.log("\n📈 Statistiques:");
      console.log(`Total de villes: ${embeddings.length}`);
      if (embeddings.length > 0) {
        console.log(
          `Dimension de l'embedding: ${embeddings[0].embedding.length}`
        );
        console.log(`Première ville: ${embeddings[0].name}`);
        console.log(
          `Dernière ville: ${embeddings[embeddings.length - 1].name}`
        );
      }
    } catch (error) {
      console.error("❌ Erreur:", error.message);
      console.error(error);
    }
  };

  const testGenerateEmbedding = async () => {
    try {
      console.log("\n\n🧪 === TEST GÉNÉRATION EMBEDDING LOCAL ===");
      console.log("📝 Texte: 'plage restaurant soleil'");

      const embedding = await generateEmbeddingLocal(
        "accommodation accommodation.hotel building building.accommodation building.catering building.commercial building.historic building.residential building.tourism catering catering.bar catering.cafe catering.cafe.coffee catering.cafe.coffee_shop catering.restaurant catering.restaurant.burger catering.restaurant.chicken catering.restaurant.french catering.restaurant.pizza catering.restaurant.portuguese catering.restaurant.regional catering.restaurant.steak_house commercial commercial.convenience commercial.shopping_mall entertainment entertainment.museum entertainment.theme_park fee gluten_free heritage highway highway.tertiary internet_access internet_access.for_customers internet_access.free leisure leisure.park leisure.park.garden man_made man_made.bridge natural natural.forest no_fee no_fee.no tourism tourism.attraction tourism.attraction.artwork tourism.attraction.viewpoint tourism.sights tourism.sights.bridge tourism.sights.city_gate tourism.sights.memorial tourism.sights.memorial.pillory vegan vegan.only vegetarian wheelchair wheelchair.yes"
      );

      console.log(`✅ Embedding généré avec succès!`);
      console.log(`📊 Dimension: ${embedding.length}`);
      console.log(
        `🔢 Premiers 10 valeurs: ${embedding
          .slice(0, 10)
          .map((v) => v.toFixed(4))
          .join(", ")}`
      );
      console.log(embedding);
    } catch (error) {
      console.error("❌ Erreur génération embedding:", error.message);
      console.error(error);
    }
  };

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
    <View style={styles.container}>
      <Text>Vérifiez la console pour les résultats du test</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

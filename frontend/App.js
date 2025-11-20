import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { useEffect } from "react";
import CityRepository from "./src/backend/repositories/CityRepository.js";
import { generateEmbeddingLocal } from "./src/backend/algorithms/vectorUtils.js";

export default function App() {
  useEffect(() => {
    testGetAllCityEmbeddings();
    testGenerateEmbedding();
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
        "accommodation accommodation.hotel building building.accommodation building.catering building.commercial building.entertainment building.historic building.place_of_worship building.public_and_civil building.tourism building.transportation catering catering.bar catering.cafe catering.cafe.coffee catering.cafe.coffee_shop catering.restaurant catering.restaurant.fish catering.restaurant.french catering.restaurant.italian catering.restaurant.pizza catering.restaurant.seafood commercial commercial.food_and_drink commercial.food_and_drink.bakery commercial.shopping_mall commercial.smoking dogs dogs.yes entertainment entertainment.culture entertainment.culture.arts_centre entertainment.museum entertainment.theme_park fee heritage heritage.unesco internet_access internet_access.free leisure leisure.park man_made man_made.tower no_access no_fee no_fee.no religion religion.place_of_worship religion.place_of_worship.christianity religion.place_of_worship.islam tourism tourism.attraction tourism.sights tourism.sights.archaeological_site tourism.sights.castle tourism.sights.memorial tourism.sights.memorial.monument tourism.sights.place_of_worship tourism.sights.place_of_worship.cathedral tourism.sights.place_of_worship.church tourism.sights.tower vegan vegetarian wheelchair wheelchair.limited wheelchair.yes"
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

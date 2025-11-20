import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { useEffect } from "react";
import CityRepository from "./src/backend/repositories/CityRepository.js";

export default function App() {
  useEffect(() => {
    testGetAllCityEmbeddings();
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

import React, { useEffect } from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import UserRepository from '../backend/repositories/UserRepository';

const LoadingScreen = ({ navigation }) => {
  useEffect(() => {
    // Vérifier si un utilisateur existe dans la base de données
    const checkUser = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Délai pour voir le logo
        
        const userCount = await UserRepository.countProfiles();
        
        if (userCount > 0) {
          console.log("✅ Utilisateur existant détecté -> Direction Accueil");
          navigation.replace('Main'); 
        } else {
          console.log("🆕 Nouvel utilisateur -> Direction Inscription");
          navigation.replace('Register'); 
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'utilisateur:", error);
        navigation.replace('Register');
      }
    };

    checkUser();

    return () => {};
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Logo Statique (Fixe) */}
      <Image 
          source={require('../assets/logo.png')} 
          style={styles.logo} 
          resizeMode="contain" 
      />

      {/* Le Moulinet de chargement (Spinner) en Bleu AirAtlas */}
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size="large" color="#004aad" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200, 
    height: 200,
    marginBottom: 20, // Petit espace avant le spinner
  },
  spinnerContainer: {
    marginTop: 20, 
  }
});

export default LoadingScreen;
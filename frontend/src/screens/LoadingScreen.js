import React, { useEffect, useContext,userData } from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { UserContext } from '../store/UserContext';

const LoadingScreen = ({ navigation }) => {
  const { userData } = useContext(UserContext);

  useEffect(() => {
    // On laisse un petit délai pour voir le logo, puis on décide où aller
    const checkUser = setTimeout(() => {
      
      // Si la lecture de la BDD est finie (isLoaded = true)
      if (userData.isLoaded) {
        // Si on a un prénom, c'est que l'utilisateur existe déjà en base !
        if (userData.prenom && userData.prenom !== '') {
          console.log("✅ Utilisateur existant détecté -> Direction Accueil");
          navigation.replace('Main'); 
        } else {
          console.log("🆕 Nouvel utilisateur -> Direction Inscription");
          navigation.replace('Register'); 
        }
      }
    }, 2000);

    return () => clearTimeout(checkUser);
    
  }, [userData.isLoaded, navigation]);

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
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, ActivityIndicator, Text, Animated, Dimensions } from 'react-native';
import UserRepository from '../backend/repositories/UserRepository';

// Imports pour l'effet de lumière
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const LoadingScreen = ({ navigation }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Apparition du slogan
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // 2. Boucle de lumière infinie
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
      ])
    ).start();

    const checkUser = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const userCount = await UserRepository.countProfiles();
        
        if (userCount > 0) {
          navigation.replace('Main'); 
        } else {
          navigation.replace('Register'); 
        }
      } catch (error) {
        console.error("Erreur check user:", error);
        navigation.replace('Register');
      }
    };

    checkUser();
  }, [navigation, shimmerAnim, fadeAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const SloganContent = () => (
    <Text style={styles.slogan}>
      Des recommandations qui{"\n"}font décoller vos envies
    </Text>
  );

  return (
    <View style={styles.container}>
      <Image 
          source={require('../assets/logo.png')} 
          style={styles.logo} 
          resizeMode="contain" 
      />

      {/* Conteneur du Slogan */}
      <Animated.View style={{ opacity: fadeAnim, marginBottom: 50, width: width, alignItems: 'center' }}>
        
        <View>
            {/* COUCHE 1 (Fond) : Le texte solide, toujours parfaitement lisible */}
            <SloganContent />

            {/* COUCHE 2 (Dessus) : L'effet de lumière masqué qui passe par dessus */}
            <MaskedView
              style={StyleSheet.absoluteFill}
              maskElement={<SloganContent />}
            >
              <Animated.View
                style={{
                  ...StyleSheet.absoluteFillObject,
                  transform: [{ translateX }],
                }}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flex: 1 }}
                />
              </Animated.View>
            </MaskedView>
        </View>

      </Animated.View>

      <View style={styles.spinnerContainer}>
        <ActivityIndicator size="large" color="#0b3f4f" />
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
    paddingHorizontal: 20,
  },
  logo: {
    width: 200, 
    height: 200,
    marginBottom: 10,
  },
  slogan: {
    fontSize: 22,         // 👈 TAILLE AUGMENTÉE ICI
    color: '#0b3f4f',     // Bleu foncé
    textAlign: 'center',
    fontWeight: '700',    // Gras pour le côté pro
    lineHeight: 32,       // Espacement des lignes adapté à la nouvelle taille
    letterSpacing: 0.6,   
  },
  spinnerContainer: {
    marginTop: 0, 
  }
});

export default LoadingScreen;
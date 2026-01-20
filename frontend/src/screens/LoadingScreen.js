import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, ActivityIndicator, Text, Animated, Dimensions } from 'react-native';
import UserRepository from '../backend/repositories/UserRepository';
import Slogan from '../components/Slogan';

// Modules pour l'animation de brillance
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const LoadingScreen = ({ navigation }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Anime l'apparition du texte
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // 2. Lance l'animation de brillance en boucle
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
            <Slogan />

            {/* COUCHE 2 (Dessus) : L'effet de lumière masqué qui passe par dessus */}
            <MaskedView
              style={StyleSheet.absoluteFill}
              maskElement={<Slogan />}
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
  spinnerContainer: {
    marginTop: 0, 
  }
});

export default LoadingScreen;
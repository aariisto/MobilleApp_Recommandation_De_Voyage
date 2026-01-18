import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import UserRepository from '../backend/repositories/UserRepository';

const { width } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const loadName = async () => {
      try {
        const profile = await UserRepository.getProfile();
        if (profile) {
          const firstName = profile.firstName || '';
          const lastName = profile.lastName ? profile.lastName.toUpperCase() : '';
          setUserName(`${firstName} ${lastName}`.trim());
        }
      } catch (error) {
        console.error("Erreur récupération nom:", error);
      }
    };
    loadName();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleStart = () => {
    navigation.replace('Preferences');
  };

  // Fonction pour retourner modifier les infos
  const handleGoBack = () => {
    // On navigue vers Register. RegisterScreen va détecter le profil existant et passer en mode "Modification"
    navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Bouton Retour */}
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <Ionicons name="arrow-back" size={24} color="#004aad" />
        <Text style={styles.backText}>Modifier mes infos</Text>
      </TouchableOpacity>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        
        <View style={styles.iconContainer}>
            <View style={styles.circleBg}>
                <Ionicons name="airplane" size={60} color="#004aad" style={styles.icon} />
            </View>
        </View>

        <Text style={styles.title}>Bienvenue,</Text>
        <Text style={styles.name}>{userName || 'Voyageur'} !</Text>

        <View style={styles.messageContainer}>
            <Text style={styles.message}>
                Nous sommes ravis de vous compter parmi nous. 🌍
            </Text>
            <Text style={styles.subMessage}>
                Pour vous proposer des destinations qui vous font <Text style={styles.highlight}>vraiment vibrer</Text>, nous avons besoin de mieux connaître vos goûts.
            </Text>
            <Text style={styles.subMessage}>
                Répondez à quelques questions rapides pour calibrer votre boussole de voyage.
            </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleStart} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Personnaliser mon expérience</Text>
            <Ionicons name="arrow-forward" size={20} color="white" style={{marginLeft: 10}} />
        </TouchableOpacity>

      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
  },
  // Style du bouton retour
  backButton: {
    position: 'absolute',
    top: 50, // Ajusté pour SafeArea
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
    padding: 10,
  },
  backText: {
    color: '#004aad',
    marginLeft: 5,
    fontWeight: '600',
    fontSize: 14
  },
  content: {
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 40,
    shadowColor: "#004aad",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  circleBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    transform: [{ rotate: '-45deg' }]
  },
  title: {
    fontSize: 28,
    color: '#333',
    fontWeight: '300',
  },
  name: {
    fontSize: 32,
    color: '#004aad',
    fontWeight: '800',
    marginBottom: 30,
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 50,
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    color: '#444',
    marginBottom: 15,
    lineHeight: 26,
  },
  subMessage: {
    fontSize: 15,
    textAlign: 'center',
    color: 'gray',
    lineHeight: 24,
    marginBottom: 10,
  },
  highlight: {
    color: '#004aad',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#004aad',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: '100%',
    shadowColor: "#004aad",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default WelcomeScreen;
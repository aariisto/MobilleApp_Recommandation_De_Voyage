import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ExploreScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Cercle décoratif d'arrière-plan */}
        <View style={styles.iconContainer}>
            <View style={styles.circleOpac} />
            <Ionicons name="map-outline" size={80} color="#004aad" />
        </View>

        <Text style={styles.title}>Exploration en cours...</Text>
        
        <Text style={styles.description}>
          Nous construisons une toute nouvelle façon de découvrir le monde. 
          Préparez vos valises, cette fonctionnalité arrive très bientôt !
        </Text>

        {/* Badge "Work in Progress" avec le logo plan de construction */}
        <View style={styles.badge}>
            <Ionicons name="construct-outline" size={16} color="#E67E22" style={{marginRight: 5}}/>
            <Text style={styles.badgeText}>En développement</Text>
        </View>

        {/* Bouton d'action pour rediriger vers l'accueil si l'utilisateur */}
        <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.navigate('Accueil')}
        >
            <Text style={styles.buttonText}>Retourner à l'accueil</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Fond gris très clair moderne
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '85%',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: 150,
    height: 150,
  },
  circleOpac: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#004aad',
    opacity: 0.1, // Effet de transparence moderne
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD', // Fond jaune pâle
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFEeba',
    marginBottom: 40,
  },
  badgeText: {
    color: '#856404', // Texte jaune foncé/marron
    fontWeight: '600',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#004aad',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    shadowColor: '#004aad',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default ExploreScreen;
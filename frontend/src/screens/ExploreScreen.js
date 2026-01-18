import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../theme/ThemeProvider';

const ExploreScreen = ({ navigation }) => {
  const { colors, isDark } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        
        {/* Cercle décoratif d'arrière-plan */}
        <View style={styles.iconContainer}>
            <View style={[styles.circleOpac, { backgroundColor: colors.primary }]} />
            <Ionicons name="map-outline" size={80} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Exploration en cours...</Text>
        
        <Text style={[styles.description, { color: colors.mutedText }]}>
          Nous construisons une toute nouvelle façon de découvrir le monde. 
          Préparez vos valises, cette fonctionnalité arrive très bientôt !
        </Text>

        {/* Badge "Work in Progress" avec le logo plan de construction */}
        <View style={[styles.badge, { 
          backgroundColor: isDark ? colors.cardElevated : '#FFF3CD',
          borderColor: isDark ? colors.border : '#FFEeba'
        }]}>
            <Ionicons name="construct-outline" size={16} color={isDark ? colors.primary : '#E67E22'} style={{marginRight: 5}}/>
            <Text style={[styles.badgeText, { color: isDark ? colors.text : '#856404' }]}>En développement</Text>
        </View>

        {/* Bouton d'action pour rediriger vers l'accueil si l'utilisateur */}
        <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]} 
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
    opacity: 0.1, // Effet de transparence moderne
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 40,
  },
  badgeText: {
    fontWeight: '600',
    fontSize: 14,
  },
  button: {
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
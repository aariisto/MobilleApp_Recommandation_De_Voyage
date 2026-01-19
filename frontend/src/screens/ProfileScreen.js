import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { PieChart } from "react-native-chart-kit";
import { useTheme } from '../context/ThemeContext';
import UserRepository from '../backend/repositories/UserRepository';
import PlaceLikedRepository from '../backend/repositories/PlaceLikedRepository';
import ThemeFilterService from '../backend/services/ThemeFilterService';

// Import avatars locaux
const avatarHomme = require('../../assets/avatar_homme.png');
const avatarFemme = require('../../assets/avatar_femme.png');
const avatarAnonyme = require('../../assets/avatar_anonyme.png');

const ProfileScreen = ({ navigation }) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const [userProfile, setUserProfile] = useState(null);
  const [stats, setStats] = useState([]);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    try {
        const likedIds = await PlaceLikedRepository.getAllPlacesLiked();
        if (likedIds && likedIds.length > 0) {
            const data = await ThemeFilterService.calculateThemeStatistics(likedIds);
            
            // Calculer le total pour les pourcentages
            const total = data.reduce((acc, curr) => acc + curr.population, 0);
            
            // Convertir en pourcentages
            const statsWithPercentages = data.map(item => {
                const percentage = total > 0 ? (item.population / total) * 100 : 0;
                return {
                    ...item,
                    population: parseFloat(percentage.toFixed(1)), // Valeur numérique pour le graphique
                    name: `${item.name}`, // Nom simple ou avec % si voulu: `${item.name} (${percentage.toFixed(0)}%)`
                };
            });
            
            setStats(statsWithPercentages);
        } else {
            setStats([]);
        }
    } catch (e) {
        console.error("Erreur chargement stats:", e);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await UserRepository.getProfile();
      // DEBUG: Alerte pour voir ce qui est récupéré
      if (profile) {
        // Alert.alert("DEBUG PROFIL", JSON.stringify(profile, null, 2));
      }
      setUserProfile(profile);
    } catch (error) {
      console.error("Erreur chargement profil:", error);
    }
  };

  const getAvatarSource = () => {
    // Debug dans la console pour voir ce qui est évalué
    console.log("🔍 getAvatarSource - Genre évalué:", userProfile?.gender);

    if (!userProfile?.gender) {
         // Par défaut si pas de genre (ou pas renseigné au début)
         return { uri: 'https://avatar.iran.liara.run/public/38' }; // Neutre
    }
    
    // Normalisation pour éviter les erreurs d'espace ou de casse
    const gender = userProfile.gender.trim();

    if (gender === 'Mme') {
        return avatarFemme;
    } else if (gender === 'M.') {
        return avatarHomme;
    } else {
        return avatarAnonyme;
    }
  };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}
        >
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>Mon Profil</Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity 
                onPress={toggleTheme}
                style={styles.iconButton}
              >
                <Ionicons 
                  name={isDark ? "sunny" : "moon"} 
                  size={22} 
                  color={theme.primary} 
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                                <Ionicons name="settings-outline" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
        </View>

        {/* Bloc Profil */}
        <View style={styles.profileHeader}>
            <Image 
                source={getAvatarSource()} 
                style={styles.avatar} 
            />
            <Text style={[styles.name, { color: theme.text }]}>
                {userProfile?.firstName} {userProfile?.lastName ? userProfile.lastName.toUpperCase() : ''}
            </Text>
            {/* 
            <Text style={{ textAlign: 'center', color: 'gray', fontSize: 12 }}>
                (Debug Genre: {userProfile?.gender || 'Aucun'})
            </Text>
            */}
            <Text style={[styles.email, { color: theme.textSecondary }]}>{userProfile?.email}</Text>

            <View style={styles.bubblesContainer}>
                <View style={[styles.bubble, { backgroundColor: theme.card }]}>
                    <Ionicons name="location" size={14} color={theme.primary} style={{marginRight: 5}}/>
                    <Text style={[styles.bubbleText, { color: theme.text }]}>{userProfile?.country || 'Pays inconnu'}</Text>
                </View>
                <View style={[styles.bubble, { backgroundColor: theme.card }]}>
                    <Ionicons name="calendar-outline" size={14} color={theme.primary} style={{marginRight: 5}}/>
                    <Text style={[styles.bubbleText, { color: theme.text }]}>{userProfile?.dateOfBirth || 'Non renseigné'}</Text>
                </View>
            </View>


        </View>

        {/* Menu Sections */}
        <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Compte</Text>
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                {/* J'ai passé isLast={true} car c'est le seul élément maintenant */}
                <MenuItem
                    icon="person-outline"
                    label="Informations personnelles"
                    isLast={true}
                    onPress={() => navigation.navigate('PersonalInfo')}
                />
            </View>
        </View>

        {stats.length > 0 && (
            <View style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Statistiques</Text>
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <TouchableOpacity 
                        style={[styles.menuItem, isStatsExpanded ? { borderBottomWidth: 1, borderBottomColor: theme.border } : styles.menuItemLast]} 
                        onPress={() => setIsStatsExpanded(!isStatsExpanded)}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons name="pie-chart-outline" size={22} color={theme.primary} />
                        </View>
                        <Text style={[styles.menuText, { color: theme.text }]}>Voir mes statistiques</Text>
                        <Ionicons name={isStatsExpanded ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
                    </TouchableOpacity>

                    {isStatsExpanded && (
                        <View style={{ alignItems: 'center', paddingVertical: 15 }}>
                            <PieChart
                                data={stats}
                                width={Dimensions.get("window").width - 60}
                                height={220}
                                chartConfig={{
                                    backgroundColor: "#ffffff",
                                    backgroundGradientFrom: "#ffffff",
                                    backgroundGradientTo: "#ffffff",
                                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                }}
                                accessor={"population"}
                                backgroundColor={"transparent"}
                                paddingLeft={"15"}
                                center={[10, 0]}
                                hasLegend={true}
                            />
                            <Text style={{textAlign: 'center', color: theme.textSecondary, fontSize: 12, marginTop: 5}}>
                                Répartition de vos favoris (%)
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        )}

        <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Préférences de voyage</Text>
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <MenuItem 
                    icon="options-outline" label="Refaire le quiz voyage" isLast={false} 
                    onPress={() => navigation.navigate('Preferences')}
                />
                <MenuItem 
                    icon="heart-outline" label="Mes favoris" isLast={true} 
                    onPress={() => navigation.navigate('Favoris')}
                />
            </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const MenuItem = ({ icon, label, isLast, onPress }) => {
    const { theme } = useTheme();
    return (
        <TouchableOpacity style={[styles.menuItem, isLast && styles.menuItemLast, { borderBottomColor: theme.border }]} onPress={onPress}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={22} color={theme.primary} />
            </View>
            <Text style={[styles.menuText, { color: theme.text }]}>{label}</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111' },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { marginLeft: 12 },
  profileHeader: { alignItems: 'center', marginBottom: 25 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  email: { fontSize: 14, color: '#666', marginBottom: 15 },
  bubblesContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  bubble: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F2F5', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, marginHorizontal: 5 },
  bubbleText: { fontSize: 13, color: '#444', fontWeight: '500' },
  sectionContainer: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 5, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  menuItemLast: { borderBottomWidth: 0 },
  iconContainer: { marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, color: '#333' }
});

export default ProfileScreen;
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import UserRepository from '../backend/repositories/UserRepository';

const ProfileScreen = ({ navigation }) => {
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await UserRepository.getProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error("Erreur chargement profil:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Mon Profil</Text>
            <TouchableOpacity>
                <Ionicons name="settings-outline" size={24} color="#000" />
            </TouchableOpacity>
        </View>

        {/* Bloc Profil */}
        <View style={styles.profileHeader}>
            <Image 
                source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }} 
                style={styles.avatar} 
            />
            <Text style={styles.name}>
                {userProfile?.firstName} {userProfile?.lastName ? userProfile.lastName.toUpperCase() : ''}
            </Text>
            <Text style={styles.email}>{userProfile?.email}</Text>

            <View style={styles.bubblesContainer}>
                <View style={styles.bubble}>
                    <Ionicons name="earth" size={14} color="#555" style={{ marginRight: 5 }} />
                    <Text style={styles.bubbleText}>{userProfile?.country || 'Non défini'}</Text>
                </View>
                <View style={styles.bubble}>
                    <Ionicons name="calendar-outline" size={14} color="#555" style={{ marginRight: 5 }} />
                    <Text style={styles.bubbleText}>{userProfile?.dateOfBirth || 'JJ/MM/AAAA'}</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Modifier le profil</Text>
            </TouchableOpacity>
        </View>

        {/* Menu Sections */}
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Compte</Text>
            <View style={styles.card}>
                <MenuItem icon="person-outline" label="Informations personnelles" isLast={false} />
                <MenuItem icon="notifications-outline" label="Notifications" isLast={true} />
            </View>
        </View>

        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Préférences de voyage</Text>
            <View style={styles.card}>
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

const MenuItem = ({ icon, label, isLast, onPress }) => (
    <TouchableOpacity style={[styles.menuItem, isLast && styles.menuItemLast]} onPress={onPress}>
        <View style={styles.iconContainer}>
            <Ionicons name={icon} size={22} color="#004aad" />
        </View>
        <Text style={styles.menuText}>{label}</Text>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111' },
  profileHeader: { alignItems: 'center', marginBottom: 25 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  email: { fontSize: 14, color: '#666', marginBottom: 15 },
  bubblesContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  bubble: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F2F5', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, marginHorizontal: 5 },
  bubbleText: { fontSize: 13, color: '#444', fontWeight: '500' },
  editButton: { backgroundColor: '#EBF5FF', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 25 },
  editButtonText: { color: '#004aad', fontWeight: '600', fontSize: 14 },
  sectionContainer: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 5, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  menuItemLast: { borderBottomWidth: 0 },
  iconContainer: { marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, color: '#333' }
});

export default ProfileScreen;
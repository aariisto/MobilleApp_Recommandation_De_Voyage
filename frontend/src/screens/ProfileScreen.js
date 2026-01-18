import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../theme/ThemeProvider';
import UserRepository from '../backend/repositories/UserRepository';

const ProfileScreen = ({ navigation }) => {
  const { isDark, colors, toggleTheme } = useAppTheme();
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Mon Profil</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={toggleTheme}>
                <Ionicons 
                  name={isDark ? 'sunny-outline' : 'moon-outline'} 
                  size={24} 
                  color={colors.text} 
                />
              </TouchableOpacity>
              <TouchableOpacity style={{ marginLeft: 15 }}>
                <Ionicons name="settings-outline" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
        </View>

        {/* Bloc Profil */}
        <View style={styles.profileHeader}>
            <Image 
                source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }} 
                style={styles.avatar} 
            />
            <Text style={[styles.name, { color: colors.text }]}>
                {userProfile?.firstName} {userProfile?.lastName ? userProfile.lastName.toUpperCase() : ''}
            </Text>
            <Text style={[styles.email, { color: colors.mutedText }]}>{userProfile?.email}</Text>

            <View style={styles.bubblesContainer}>
                <View style={[styles.bubble, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                    <Ionicons name="earth" size={14} color={colors.text} style={{ marginRight: 5 }} />
                    <Text style={[styles.bubbleText, { color: colors.text }]}>{userProfile?.country || 'Non défini'}</Text>
                </View>
                <View style={[styles.bubble, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                    <Ionicons name="calendar-outline" size={14} color={colors.text} style={{ marginRight: 5 }} />
                    <Text style={[styles.bubbleText, { color: colors.text }]}>{userProfile?.dateOfBirth || 'JJ/MM/AAAA'}</Text>
                </View>
            </View>
        </View>

        {/* Menu Sections */}
        <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>Compte</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                <MenuItem icon="person-outline" label="Informations personnelles" isLast={false} onPress={() => navigation.navigate('PersonalInfo')} />
                <MenuItem icon="notifications-outline" label="Notifications" isLast={true} />
            </View>
        </View>

        <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>Préférences de voyage</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
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
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }, isLast && styles.menuItemLast]} onPress={onPress}>
        <View style={styles.iconContainer}>
            <Ionicons name={icon} size={22} color={colors.primary} />
        </View>
        <Text style={[styles.menuText, { color: colors.text }]}>{label}</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  profileHeader: { alignItems: 'center', marginBottom: 25 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  email: { fontSize: 14, marginBottom: 15 },
  bubblesContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  bubble: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, marginHorizontal: 5 },
  bubbleText: { fontSize: 13, fontWeight: '500' },
  editButton: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 25 },
  editButtonText: { fontWeight: '600', fontSize: 14 },
  sectionContainer: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginLeft: 4 },
  card: { borderRadius: 16, paddingHorizontal: 5, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 10, borderBottomWidth: 1 },
  menuItemLast: { borderBottomWidth: 0 },
  iconContainer: { marginRight: 15 },
  menuText: { flex: 1, fontSize: 16 }
});

export default ProfileScreen;
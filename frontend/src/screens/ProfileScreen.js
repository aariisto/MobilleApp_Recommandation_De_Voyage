import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ProfileScreen = ({ navigation }) => {
  
  // Composant pour une ligne de menu
  const MenuItem = ({ icon, label, isDestructive = false }) => (
    <TouchableOpacity style={styles.menuItem}>
      <View style={styles.menuLeft}>
        <View style={[styles.iconBox, isDestructive && styles.destructiveIconBox]}>
            <Ionicons name={icon} size={22} color={isDestructive ? "#FF3B30" : "#007AFF"} />
        </View>
        <Text style={[styles.menuLabel, isDestructive && styles.destructiveLabel]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* En-tête du Profil */}
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Mon Profil</Text>
            <TouchableOpacity>
                <Ionicons name="settings-outline" size={24} color="black" />
            </TouchableOpacity>
        </View>

        {/* Info Utilisateur */}
        <View style={styles.profileInfo}>
            <Image 
                source={{uri: 'https://randomuser.me/api/portraits/women/44.jpg'}} 
                style={styles.avatar} 
            />
            <Text style={styles.name}>Alex Martin</Text>
            <Text style={styles.email}>alex.martin@email.com</Text>
            <TouchableOpacity style={styles.editBtn}>
                <Text style={styles.editBtnText}>Modifier le profil</Text>
            </TouchableOpacity>
        </View>

        {/* Section Compte */}
        <Text style={styles.sectionTitle}>Compte</Text>
        <View style={styles.section}>
            <MenuItem icon="person-outline" label="Informations personnelles" />
            <MenuItem icon="card-outline" label="Moyens de paiement" />
            <MenuItem icon="notifications-outline" label="Notifications" />
        </View>

        {/* Section Préférences */}
        <Text style={styles.sectionTitle}>Préférences de voyage</Text>
        <View style={styles.section}>
            {/* On peut remettre un accès au Quiz ici aussi si on veut */}
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Preferences')}>
                 <View style={styles.menuLeft}>
                    <View style={styles.iconBox}>
                        <Ionicons name="options-outline" size={22} color="#007AFF" />
                    </View>
                    <Text style={styles.menuLabel}>Refaire le quiz voyage</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
            <MenuItem icon="heart-outline" label="Mes favoris" />
        </View>

        {/* Section Autre */}
        <Text style={styles.sectionTitle}>Autre</Text>
        <View style={[styles.section, { marginBottom: 30 }]}>
            <MenuItem icon="help-circle-outline" label="Aide et support" />
            <MenuItem icon="log-out-outline" label="Se déconnecter" isDestructive={true} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  
  profileInfo: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10, borderWidth: 3, borderColor: 'white' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  email: { fontSize: 14, color: 'gray', marginBottom: 15 },
  editBtn: { backgroundColor: '#E1F0FF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  editBtnText: { color: '#007AFF', fontWeight: '600' },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: 'gray', marginLeft: 20, marginBottom: 10, marginTop: 10 },
  section: { backgroundColor: 'white', marginHorizontal: 20, borderRadius: 15, paddingVertical: 5, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 35, height: 35, borderRadius: 10, backgroundColor: '#F0F8FF', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  destructiveIconBox: { backgroundColor: '#FFF0F0' },
  menuLabel: { fontSize: 16, fontWeight: '500', color: '#333' },
  destructiveLabel: { color: '#FF3B30' }
});

export default ProfileScreen;
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

// ============================================================================
// CONSTANTS
// ============================================================================

const USER_PROFILE_DATA = {
  avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
  fullName: 'Alex Martin',
  emailAddress: 'alex.martin@email.com',
};

const MENU_SECTIONS = {
  account: [
    { id: 'personal-info', icon: 'person-outline', label: 'Informations personnelles' },
    { id: 'notifications', icon: 'notifications-outline', label: 'Notifications' },
  ],
  travelPreferences: [
    { id: 'quiz', icon: 'options-outline', label: 'Refaire le quiz voyage', navigateTo: 'Preferences' },
    { id: 'favorites', icon: 'heart-outline', label: 'Mes favoris', navigateTo: 'Favoris' },
  ],
  other: [
    { id: 'help', icon: 'help-circle-outline', label: 'Aide et support' },
  ],
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ProfileScreen = ({ navigation }) => {
  
  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------
  
  const handleSettingsPress = () => {
    // TODO: Navigate to settings screen
    console.log('Settings pressed');
  };

  const handleEditProfilePress = () => {
    // TODO: Navigate to edit profile screen
    console.log('Edit profile pressed');
  };

  const handleMenuItemPress = (menuItem) => {
    if (menuItem.navigateTo) {
      navigation.navigate(menuItem.navigateTo);
    } else {
      console.log(`Menu item pressed: ${menuItem.id}`);
    }
  };

  // --------------------------------------------------------------------------
  // Render Components
  // --------------------------------------------------------------------------
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        <ProfileHeader onSettingsPress={handleSettingsPress} />
        
        <UserProfileInfo 
          avatarUrl={USER_PROFILE_DATA.avatarUrl}
          fullName={USER_PROFILE_DATA.fullName}
          emailAddress={USER_PROFILE_DATA.emailAddress}
          onEditPress={handleEditProfilePress}
        />

        <MenuSection 
          title="Compte" 
          menuItems={MENU_SECTIONS.account}
          onItemPress={handleMenuItemPress}
        />

        <MenuSection 
          title="Préférences de voyage" 
          menuItems={MENU_SECTIONS.travelPreferences}
          onItemPress={handleMenuItemPress}
        />

        <MenuSection 
          title="Autre" 
          menuItems={MENU_SECTIONS.other}
          onItemPress={handleMenuItemPress}
          isLastSection
        />

      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Header with title and settings icon
 */
const ProfileHeader = ({ onSettingsPress }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>Mon Profil</Text>
    <TouchableOpacity onPress={onSettingsPress}>
      <Ionicons name="settings-outline" size={24} color="black" />
    </TouchableOpacity>
  </View>
);

/**
 * User profile information card with avatar and edit button
 */
const UserProfileInfo = ({ avatarUrl, fullName, emailAddress, onEditPress }) => (
  <View style={styles.profileInfo}>
    <Image 
      source={{ uri: avatarUrl }} 
      style={styles.avatar} 
    />
    <Text style={styles.name}>{fullName}</Text>
    <Text style={styles.email}>{emailAddress}</Text>
    <TouchableOpacity style={styles.editBtn} onPress={onEditPress}>
      <Text style={styles.editBtnText}>Modifier le profil</Text>
    </TouchableOpacity>
  </View>
);

/**
 * Menu section with title and menu items
 */
const MenuSection = ({ title, menuItems, onItemPress, isLastSection = false }) => (
  <>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={[styles.section, isLastSection && { marginBottom: 30 }]}>
      {menuItems.map((item) => (
        <MenuItem 
          key={item.id}
          icon={item.icon}
          label={item.label}
          isDestructive={item.isDestructive}
          onPress={() => onItemPress(item)}
        />
      ))}
    </View>
  </>
);

/**
 * Individual menu item with icon and chevron
 */
const MenuItem = ({ icon, label, isDestructive = false, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuLeft}>
      <View style={[styles.iconBox, isDestructive && styles.destructiveIconBox]}>
        <Ionicons name={icon} size={22} color={isDestructive ? "#FF3B30" : "#007AFF"} />
      </View>
      <Text style={[styles.menuLabel, isDestructive && styles.destructiveLabel]}>{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
  </TouchableOpacity>
);

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Container
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },

  // Header
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15 
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: 'bold' 
  },
  
  // Profile Info
  profileInfo: { 
    alignItems: 'center', 
    marginBottom: 30 
  },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    marginBottom: 10, 
    borderWidth: 3, 
    borderColor: 'white' 
  },
  name: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  email: { 
    fontSize: 14, 
    color: 'gray', 
    marginBottom: 15 
  },
  editBtn: { 
    backgroundColor: '#E1F0FF', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 20 
  },
  editBtnText: { 
    color: '#007AFF', 
    fontWeight: '600' 
  },

  // Menu Section
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: 'gray', 
    marginLeft: 20, 
    marginBottom: 10, 
    marginTop: 10 
  },
  section: { 
    backgroundColor: 'white', 
    marginHorizontal: 20, 
    borderRadius: 15, 
    paddingVertical: 5, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 10, 
    elevation: 2 
  },
  
  // Menu Item
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 15, 
    paddingHorizontal: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0' 
  },
  menuLeft: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  iconBox: { 
    width: 35, 
    height: 35, 
    borderRadius: 10, 
    backgroundColor: '#F0F8FF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15 
  },
  destructiveIconBox: { 
    backgroundColor: '#FFF0F0' 
  },
  menuLabel: { 
    fontSize: 16, 
    fontWeight: '500', 
    color: '#333' 
  },
  destructiveLabel: { 
    color: '#FF3B30' 
  },
});

export default ProfileScreen;
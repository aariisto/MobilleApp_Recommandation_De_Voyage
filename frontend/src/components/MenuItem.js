import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
  menuItem: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      paddingVertical: 16, 
      paddingHorizontal: 10, 
      borderBottomWidth: 1, 
      borderBottomColor: '#F0F0F0' 
  },
  menuItemLast: { 
      borderBottomWidth: 0 
  },
  iconContainer: { 
      marginRight: 15 
  },
  menuText: { 
      flex: 1, 
      fontSize: 16, 
      color: '#333' 
  }
});

export default MenuItem;
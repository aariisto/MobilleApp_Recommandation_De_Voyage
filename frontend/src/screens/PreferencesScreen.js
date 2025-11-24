import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const PreferencesScreen = ({ navigation }) => {
  // Changement ici : un tableau vide [] pour permettre plusieurs choix
  const [selectedIds, setSelectedIds] = useState([]);
  
  const options = [
    { id: 1, label: 'Aventure', img: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b' },
    { id: 2, label: 'Détente', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e' },
    { id: 3, label: 'Culture', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5' },
    { id: 4, label: 'Gastronomie', img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836' },
    { id: 5, label: 'Festif', img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30' },
    { id: 6, label: 'Famille', img: 'https://images.unsplash.com/photo-1511895426328-dc8714191300' },
  ];

  // Fonction pour gérer la sélection multiple
  const toggleSelection = (id) => {
    if (selectedIds.includes(id)) {
      // Si déjà sélectionné, on l'enlève
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      // Sinon, on l'ajoute
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
         <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="black" />
         </TouchableOpacity>
         <Text style={styles.headerTitle}>Vos préférences</Text>
         <View style={{width: 24}} /> 
      </View>

      <View style={styles.content}>
        <Text style={styles.stepText}>Étape 1 sur 5</Text>
        <View style={styles.progressBar}><View style={styles.progressFill} /></View>
        <Text style={styles.question}>Quel est votre style de voyage ?</Text>
        <Text style={styles.subTitle}>(Plusieurs choix possibles)</Text>

        <View style={styles.grid}>
            {options.map((opt) => {
                const isSelected = selectedIds.includes(opt.id);
                return (
                    <TouchableOpacity 
                        key={opt.id} 
                        style={[styles.card, isSelected && styles.cardSelected]}
                        onPress={() => toggleSelection(opt.id)}
                        activeOpacity={0.7}
                    >
                        {/* L'image est toujours rendue ici */}
                        <Image source={{uri: opt.img}} style={styles.cardImage} resizeMode="cover" />
                        
                        {/* Overlay sombre léger pour lisibilité texte */}
                        <View style={styles.overlay} />

                        {/* Si sélectionné, on ajoute un overlay bleu semi-transparent par dessus */}
                        {isSelected && <View style={styles.selectedOverlay} />}
                        
                        {/* Coche de validation si sélectionné */}
                        {isSelected && (
                            <View style={styles.checkIcon}>
                                <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                            </View>
                        )}

                        <Text style={styles.cardLabel}>{opt.label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
      </View>
      
      <View style={styles.footer}>
          <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.goBack()}>
              <Text style={{fontWeight: 'bold', color: 'black'}}>Précédent</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnPrimary}>
              <Text style={{color:'white', fontWeight: 'bold'}}>Suivant ({selectedIds.length})</Text>
          </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center'},
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  stepText: { color: 'gray', marginBottom: 10 },
  progressBar: { height: 6, backgroundColor: '#eee', borderRadius: 3, marginBottom: 5 },
  progressFill: { width: '20%', height: '100%', backgroundColor: '#007AFF', borderRadius: 3 },
  question: { fontSize: 24, fontWeight: 'bold', marginBottom: 5, marginTop: 10 },
  subTitle: { color: 'gray', marginBottom: 20, fontSize: 14 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  
  card: { 
      width: (width - 50) / 2, 
      height: 140, 
      marginBottom: 15, 
      borderRadius: 15, 
      overflow: 'hidden', // Important pour que l'image ne dépasse pas
      backgroundColor: '#f0f0f0', // Couleur de fond si l'image charge pas
      borderWidth: 2,
      borderColor: 'transparent' // Bordure invisible par défaut
  },
  
  cardSelected: { 
      borderColor: '#007AFF', // Bordure bleue quand sélectionné
  },

  cardImage: { width: '100%', height: '100%', position: 'absolute' },
  
  overlay: { 
      ...StyleSheet.absoluteFillObject, 
      backgroundColor: 'rgba(0,0,0,0.3)' // Assombrit légèrement l'image
  },

  selectedOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 122, 255, 0.2)' // Teinte bleue légère quand sélectionné
  },

  checkIcon: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: 'white',
      borderRadius: 12,
      height: 24,
      width: 24,
      justifyContent: 'center',
      alignItems: 'center'
  },

  cardLabel: { 
      position: 'absolute', 
      bottom: 15, 
      left: 15, 
      color: 'white', 
      fontWeight: 'bold', 
      fontSize: 16,
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: {width: -1, height: 1},
      textShadowRadius: 10
  },

  footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, marginTop: 'auto', borderTopWidth: 1, borderColor: '#f0f0f0' },
  btnPrimary: { backgroundColor: '#007AFF', padding: 15, borderRadius: 30, width: '48%', alignItems: 'center' },
  btnSecondary: { backgroundColor: '#E9ECEF', padding: 15, borderRadius: 30, width: '48%', alignItems: 'center' }
});

export default PreferencesScreen;
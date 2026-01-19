import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import UserRepository from '../backend/repositories/UserRepository';
import UserCategoryRepository from '../backend/repositories/UserCategoryRepository';
import PlaceRepository from '../backend/repositories/PlaceRepository';

const CategoryFeedbackModal = ({ visible, city, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(new Set());
  const [disliked, setDisliked] = useState(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && city) {
      loadCategories();
    }
  }, [visible, city]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const placesWithCats = await PlaceRepository.getPlacesWithCategories(city.id);
      
      if (!placesWithCats || placesWithCats.length === 0) {
        console.log("❌ Aucune place trouvée pour la ville:", city.id);
        setCategories([]);
        setLoading(false);
        return;
      }

      console.log("📍 Places trouvées:", placesWithCats.length);

      // Compter les catégories
      const categoryMap = {};
      for (const place of placesWithCats) {
        if (place.categories && place.categories.length > 0) {
          place.categories.forEach((catName, idx) => {
            if (!categoryMap[catName]) {
              const catId = place.category_ids ? place.category_ids[idx] : idx;
              categoryMap[catName] = { id: catId, name: catName, count: 0 };
            }
            categoryMap[catName].count += 1;
          });
        }
      }

      // Trier par fréquence
      const sorted = Object.values(categoryMap)
        .sort((a, b) => b.count - a.count);

      console.log("🏷️ Catégories de", city.name, ":", sorted.map(c => c.name));

      setCategories(sorted);
      setLiked(new Set());
      setDisliked(new Set());
    } catch (error) {
      console.error("❌ Erreur chargement catégories:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = (categoryName) => {
    console.log("👍 Like:", categoryName);
    const newLiked = new Set(liked);
    const newDisliked = new Set(disliked);

    if (newLiked.has(categoryName)) {
      newLiked.delete(categoryName);
    } else {
      newLiked.add(categoryName);
      newDisliked.delete(categoryName);
    }

    setLiked(newLiked);
    setDisliked(newDisliked);
  };

  const toggleDislike = (categoryName) => {
    console.log("👎 Dislike:", categoryName);
    const newLiked = new Set(liked);
    const newDisliked = new Set(disliked);

    if (newDisliked.has(categoryName)) {
      newDisliked.delete(categoryName);
    } else {
      newDisliked.add(categoryName);
      newLiked.delete(categoryName);
    }

    setLiked(newLiked);
    setDisliked(newDisliked);
  };

  const saveFeedback = async () => {
    if (liked.size === 0 && disliked.size === 0) {
      Alert.alert("Sélection vide", "Sélectionnez au moins une catégorie");
      return;
    }

    setSaving(true);
    try {
      const profile = await UserRepository.getProfile();
      if (!profile || !profile.id) {
        Alert.alert("Erreur", "Profil utilisateur non trouvé");
        return;
      }

      console.log("\n👤 Utilisateur:", profile.id);
      console.log("📍 Ville:", city.name);

      // Enregistrer les likes
      for (const category of liked) {
        console.log("  ➕ Like:", category);
        await UserCategoryRepository.addOrIncrementLike(profile.id, category, 1);
      }

      // Enregistrer les dislikes
      for (const category of disliked) {
        console.log("  ➖ Dislike:", category);
        await UserCategoryRepository.addOrIncrementDislike(profile.id, category, 1);
      }

      // Récupérer et afficher les préférences sauvegardées
      const userLikes = await UserCategoryRepository.getUserLikes(profile.id);
      const userDislikes = await UserCategoryRepository.getUserDislikes(profile.id);

      console.log("\n✅ User Category Likes:", userLikes);
      console.log("✅ User Category Dislikes:", userDislikes);
      console.log("✅ Sauvegardé\n");

      Alert.alert("✅ Merci !", "Vos préférences ont été sauvegardées", [
        { text: "OK", onPress: onClose }
      ]);
    } catch (error) {
      console.error("❌ Erreur:", error);
      Alert.alert("Erreur", "Impossible de sauvegarder");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#111" />
            </TouchableOpacity>
            <Text style={styles.title}>Qu'avez-vous aimé ?</Text>
            <View style={{ width: 28 }} />
          </View>

          <Text style={styles.subtitle}>À {city?.name}, quelles catégories vous ont plu ?</Text>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#004aad" />
            </View>
          ) : categories.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>Aucune catégorie trouvée</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={categories}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={true}
                renderItem={({ item: cat }) => (
                  <View style={styles.listItem}>
                    <Text style={styles.itemText}>{cat.name}</Text>
                    <View style={styles.itemButtons}>
                      <TouchableOpacity
                        style={[styles.iconBtn, liked.has(cat.name) && styles.iconBtnActive]}
                        onPress={() => toggleLike(cat.name)}
                      >
                        <Ionicons
                          name={liked.has(cat.name) ? "heart" : "heart-outline"}
                          size={18}
                          color={liked.has(cat.name) ? "#e74c3c" : "#666"}
                        />
                        <Text style={{ fontSize: 12, color: liked.has(cat.name) ? "#e74c3c" : "#666" }}>
                          J'aime
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.iconBtn, disliked.has(cat.name) && styles.iconBtnActive]}
                        onPress={() => toggleDislike(cat.name)}
                      >
                        <Ionicons
                          name={disliked.has(cat.name) ? "close-circle" : "close-circle-outline"}
                          size={18}
                          color={disliked.has(cat.name) ? "#e74c3c" : "#666"}
                        />
                        <Text style={{ fontSize: 12, color: disliked.has(cat.name) ? "#e74c3c" : "#666" }}>
                          J'aime pas
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            </>
          )}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
              <Text style={styles.cancelText}>Ignorer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={saveFeedback} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveText}>Valider</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 15,
  },
  scroll: {
    flex: 1,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
  },
  list: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  listItem: {
    paddingVertical: 14,
    paddingHorizontal: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    flexDirection: 'column',
  },
  itemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  itemButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtnActive: {
    backgroundColor: '#e8f0ff',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  categoryItem: {
    width: '48%',
    marginRight: '4%',
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  btn: {
    padding: 6,
    borderRadius: 8,
  },
  btnActive: {
    backgroundColor: '#e8f0ff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#004aad',
    alignItems: 'center',
  },
  saveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default CategoryFeedbackModal;

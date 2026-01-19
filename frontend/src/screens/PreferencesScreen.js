import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { questions } from '../data/questionnaireData'; 
import UserCategoryRepository from '../backend/repositories/UserCategoryRepository';
import UserRepository from '../backend/repositories/UserRepository';


const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40 - 15) / 2;

const PreferencesScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selections, setSelections] = useState({});

  if (!questions || questions.length === 0) {
      return <SafeAreaView><Text>Chargement...</Text></SafeAreaView>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  
  const hasSelectionForCurrentQuestion = () => {
    return currentQuestion.options.some(opt => selections[opt.id] !== undefined);
  };

  const cyclePreference = (optionId) => {
    const currentStatus = selections[optionId];
    if (!currentStatus) {
      setSelections({ ...selections, [optionId]: 'like' });
    } else if (currentStatus === 'like') {
      setSelections({ ...selections, [optionId]: 'dislike' });
    } else {
      const newSelections = { ...selections };
      delete newSelections[optionId];
      setSelections(newSelections);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      generateResults();
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      navigation.goBack();
    }
  };

  const generateResults = async () => {
    let likedCategoriesSet = new Set();
    let dislikedCategoriesSet = new Set();

    questions.forEach(q => {
      if(q.options) {
          q.options.forEach(opt => {
            const status = selections[opt.id];
            if (status === 'like' && opt.categories) {
              opt.categories.forEach(cat => likedCategoriesSet.add(cat));
            }
            else if (status === 'dislike' && opt.categories) {
              opt.categories.forEach(cat => dislikedCategoriesSet.add(cat));
            }
          });
      }
    });

    const likedTable = Array.from(likedCategoriesSet);
    const dislikedTable = Array.from(dislikedCategoriesSet);

    try {
      const profile = await UserRepository.getProfile();
      if (profile && profile.id) {
        for (const category of dislikedTable) {
          await UserCategoryRepository.addOrIncrementDislike(profile.id, category);
        }
        for (const category of likedTable) {
          await UserCategoryRepository.addOrIncrementLike(profile.id, category);
        }
      }
    } catch (error) {
      console.error("⚠️ Erreur lors de l'enregistrement des préférences:", error);
    }

    Alert.alert(
      "Profil terminé !",
      `Merci ! Nous avons identifié ${likedTable.length} centres d'intérêt.`,
      [{ 
          text: "Voir résultats", 
          onPress: () => navigation.replace('Main', { userPreferences: likedTable }) 
      }]
    );
  };

  const isNextDisabled = !hasSelectionForCurrentQuestion();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
         {/* Bouton caché si index est 0 */}
         {currentQuestionIndex > 0 ? (
             <TouchableOpacity onPress={handleBack} style={{padding: 5}}>
                <Ionicons name="arrow-back" size={24} color={theme.text} />
             </TouchableOpacity>
         ) : (
             <View style={{width: 34}} /> // Espace vide pour garder le titre centré
         )}
         
         <Text style={[styles.headerTitle, { color: theme.text }]}>Préférences ({currentQuestionIndex + 1}/{questions.length})</Text>
         <View style={{width: 34}} /> 
      </View>

      <View style={styles.content}>
        <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View style={[styles.progressFill, { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`, backgroundColor: theme.primary }]} />
        </View>

        <Text style={[styles.question, { color: theme.text }]}>{currentQuestion.question}</Text>
        <Text style={[styles.subTitle, { color: theme.textSecondary }]}>Sélectionnez au moins une option pour continuer</Text>
        <Text style={[styles.subTitle, { color: theme.textSecondary }]}>1 click = ✅ | 2 click = ❌ </Text>

        <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
                {currentQuestion.options.map((opt) => {
                    const status = selections[opt.id]; 
                    return (
                        <TouchableOpacity 
                            key={opt.id} 
                            style={[
                                styles.card, 
                                status === 'like' && styles.cardLike,
                                status === 'dislike' && styles.cardDislike
                            ]}
                            onPress={() => cyclePreference(opt.id)}
                            activeOpacity={0.8}
                        >
                            <Image source={{uri: opt.img}} style={styles.cardImage} resizeMode="cover" />
                            <View style={styles.darkOverlay} />
                            {status === 'like' && <View style={styles.likeOverlay} />}
                            {status === 'dislike' && <View style={styles.dislikeOverlay} />}
                            <Text style={styles.cardLabel}>{opt.label}</Text>
                            {status === 'like' && (
                                <View style={[styles.iconBadge, { backgroundColor: '#007AFF' }]}>
                                    <Ionicons name="checkmark" size={16} color="white" />
                                </View>
                            )}
                            {status === 'dislike' && (
                                <View style={[styles.iconBadge, { backgroundColor: '#FF3B30' }]}>
                                    <Ionicons name="close" size={16} color="white" />
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
            <View style={{height: 20}} />
        </ScrollView>
      </View>
      
      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          {/*  Bouton Précédent désactivé/invisible si index 0 */}
          {currentQuestionIndex > 0 ? (
            <TouchableOpacity style={[styles.btnSecondary, { backgroundColor: theme.background, borderColor: theme.border }]} onPress={handleBack}>
                <Text style={{fontWeight: 'bold', color: theme.text}}>Précédent</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.btnSecondary, {backgroundColor:'transparent'}]} />
          )}
          
          <TouchableOpacity 
            style={[styles.btnPrimary, { backgroundColor: theme.primary }, isNextDisabled && styles.btnDisabled]} 
            onPress={handleNext}
            disabled={isNextDisabled}
          >
              <Text style={{color:'white', fontWeight: 'bold', fontSize: 16}}>
                  {currentQuestionIndex === questions.length - 1 ? "Terminer" : "Suivant"}
              </Text>
          </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10, alignItems: 'center'},
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 20 },
  progressBar: { height: 4, backgroundColor: '#eee', borderRadius: 2, marginBottom: 15, marginTop: 5 },
  progressFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 2 },
  question: { fontSize: 22, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  subTitle: { color: 'gray', marginBottom: 20, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { 
      width: CARD_WIDTH, height: 140, marginBottom: 15, borderRadius: 16, 
      overflow: 'hidden', backgroundColor: '#f0f0f0', borderWidth: 3, borderColor: 'transparent', position: 'relative' 
  },
  cardLike: { borderColor: '#007AFF' },
  cardDislike: { borderColor: '#FF3B30' },
  cardImage: { width: '100%', height: '100%', position: 'absolute' },
  darkOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  likeOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 122, 255, 0.4)' },
  dislikeOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 59, 48, 0.5)' },
  cardLabel: { position: 'absolute', bottom: 12, left: 12, right: 12, fontSize: 15, fontWeight: 'bold', color: 'white', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 4 },
  iconBadge: { position: 'absolute', top: 10, right: 10, borderRadius: 12, height: 24, width: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'white' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderTopWidth: 1, borderColor: '#f0f0f0', backgroundColor: 'white' },
  
  btnPrimary: { backgroundColor: '#007AFF', paddingVertical: 15, borderRadius: 30, width: '48%', alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { backgroundColor: '#A0C4FF', opacity: 0.7 }, 
  btnSecondary: { backgroundColor: '#F0F2F5', paddingVertical: 15, borderRadius: 30, width: '48%', alignItems: 'center', justifyContent: 'center' }
});

export default PreferencesScreen;
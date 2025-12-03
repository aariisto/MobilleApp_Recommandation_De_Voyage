import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { questions } from '../data/questionnaireData'; 

// Constantes
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 20;
const CARD_SPACING = 15;
const CARD_WIDTH = (SCREEN_WIDTH - (HORIZONTAL_PADDING * 2) - CARD_SPACING) / 2;

// États possibles pour une préférence
const PREFERENCE_STATUS = {
  NONE: undefined,
  LIKE: 'like',
  DISLIKE: 'dislike'
};

const PreferencesScreen = ({ navigation }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userSelections, setUserSelections] = useState({});

  // Vérification des données
  if (!questions || questions.length === 0) {
    return (
      <SafeAreaView>
        <Text>Chargement...</Text>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  // Vérifie si au moins une option est sélectionnée pour la question actuelle
  const hasUserMadeSelection = () => {
    return currentQuestion.options.some(option => 
      userSelections[option.id] !== PREFERENCE_STATUS.NONE
    );
  };

  // Gère le cycle des préférences : none → like → dislike → none
  const handleTogglePreference = (optionId) => {
    const currentStatus = userSelections[optionId];
    let newStatus;

    if (!currentStatus) {
      newStatus = PREFERENCE_STATUS.LIKE;
    } else if (currentStatus === PREFERENCE_STATUS.LIKE) {
      newStatus = PREFERENCE_STATUS.DISLIKE;
    } else {
      newStatus = PREFERENCE_STATUS.NONE;
    }

    const updatedSelections = { ...userSelections };
    
    if (newStatus === PREFERENCE_STATUS.NONE) {
      delete updatedSelections[optionId];
    } else {
      updatedSelections[optionId] = newStatus;
    }

    setUserSelections(updatedSelections);
  };

  // Navigation vers la question suivante ou génération des résultats
  const handleNextQuestion = () => {
    if (isLastQuestion) {
      generateUserProfile();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Navigation vers la question précédente ou retour
  const handlePreviousQuestion = () => {
    if (isFirstQuestion) {
      navigation.goBack();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Génère le profil de l'utilisateur basé sur ses sélections
  const generateUserProfile = () => {
    const likedCategoriesSet = new Set();
    const dislikedCategoriesSet = new Set();

    questions.forEach(question => {
      if (question.options) {
        question.options.forEach(option => {
          const preferenceStatus = userSelections[option.id];
          
          if (preferenceStatus === PREFERENCE_STATUS.LIKE && option.categories) {
            option.categories.forEach(category => likedCategoriesSet.add(category));
          } else if (preferenceStatus === PREFERENCE_STATUS.DISLIKE && option.categories) {
            option.categories.forEach(category => dislikedCategoriesSet.add(category));
          }
        });
      }
    });

    const likedCategories = Array.from(likedCategoriesSet);
    const dislikedCategories = Array.from(dislikedCategoriesSet);

    console.log("✅ Catégories aimées :", likedCategories);
    console.log("❌ Catégories non aimées :", dislikedCategories);

    showResultsAlert(likedCategories);
  };

  // Affiche l'alerte de fin de questionnaire
  const showResultsAlert = (likedCategories) => {
    Alert.alert(
      "Profil terminé !",
      `Merci ! Nous avons identifié ${likedCategories.length} centres d'intérêt.`,
      [{ 
        text: "Voir résultats", 
        onPress: () => navigation.navigate('Main', { userPreferences: likedCategories }) 
      }]
    );
  };

  const isNextButtonDisabled = !hasUserMadeSelection();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <PreferencesHeader
        currentQuestionNumber={currentQuestionIndex + 1}
        totalQuestions={totalQuestions}
        onBackPress={handlePreviousQuestion}
      />

      <View style={styles.content}>
        <ProgressBar
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={totalQuestions}
        />

        <QuestionSection
          questionText={currentQuestion.question}
          subtitle="Sélectionnez au moins une option pour continuer"
        />

        <OptionsGrid
          options={currentQuestion.options}
          selections={userSelections}
          onTogglePreference={handleTogglePreference}
        />
      </View>
      
      <NavigationFooter
        onPreviousPress={handlePreviousQuestion}
        onNextPress={handleNextQuestion}
        isNextDisabled={isNextButtonDisabled}
        isLastQuestion={isLastQuestion}
      />
    </SafeAreaView>
  );
};

// Composant Header avec navigation et progression
const PreferencesHeader = ({ currentQuestionNumber, totalQuestions, onBackPress }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBackPress} style={styles.headerButton}>
      <Ionicons name="arrow-back" size={24} color="black" />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>
      Préférences ({currentQuestionNumber}/{totalQuestions})
    </Text>
    <View style={styles.headerSpacer} /> 
  </View>
);

// Composant Barre de progression
const ProgressBar = ({ currentQuestion, totalQuestions }) => {
  const progressPercentage = (currentQuestion / totalQuestions) * 100;

  return (
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
    </View>
  );
};

// Composant Section de la question
const QuestionSection = ({ questionText, subtitle }) => (
  <>
    <Text style={styles.question}>{questionText}</Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
  </>
);

// Composant Grille d'options
const OptionsGrid = ({ options, selections, onTogglePreference }) => (
  <ScrollView showsVerticalScrollIndicator={false}>
    <View style={styles.grid}>
      {options.map((option) => (
        <OptionCard
          key={option.id}
          option={option}
          status={selections[option.id]}
          onPress={() => onTogglePreference(option.id)}
        />
      ))}
    </View>
    <View style={styles.gridBottomSpacer} />
  </ScrollView>
);

// Composant Carte d'option
const OptionCard = ({ option, status, onPress }) => {
  const isLiked = status === PREFERENCE_STATUS.LIKE;
  const isDisliked = status === PREFERENCE_STATUS.DISLIKE;

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        isLiked && styles.cardLike,
        isDisliked && styles.cardDislike
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: option.img }} 
        style={styles.cardImage} 
        resizeMode="cover" 
      />
      
      <View style={styles.darkOverlay} />
      {isLiked && <View style={styles.likeOverlay} />}
      {isDisliked && <View style={styles.dislikeOverlay} />}

      <Text style={styles.cardLabel}>{option.label}</Text>

      {isLiked && (
        <PreferenceIcon iconName="checkmark" backgroundColor="#007AFF" />
      )}
      {isDisliked && (
        <PreferenceIcon iconName="close" backgroundColor="#FF3B30" />
      )}
    </TouchableOpacity>
  );
};

// Composant Icône de préférence (like/dislike)
const PreferenceIcon = ({ iconName, backgroundColor }) => (
  <View style={[styles.iconBadge, { backgroundColor }]}>
    <Ionicons name={iconName} size={16} color="white" />
  </View>
);

// Composant Footer de navigation
const NavigationFooter = ({ onPreviousPress, onNextPress, isNextDisabled, isLastQuestion }) => (
  <View style={styles.footer}>
    <TouchableOpacity style={styles.btnSecondary} onPress={onPreviousPress}>
      <Text style={styles.btnSecondaryText}>Précédent</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={[styles.btnPrimary, isNextDisabled && styles.btnDisabled]} 
      onPress={onNextPress}
      disabled={isNextDisabled}
    >
      <Text style={styles.btnPrimaryText}>
        {isLastQuestion ? "Terminer" : "Suivant"}
      </Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  // Container principal
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },

  // Header
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    alignItems: 'center'
  },
  headerTitle: { 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  headerButton: { 
    padding: 5 
  },
  headerSpacer: { 
    width: 34 
  },

  // Contenu
  content: { 
    flex: 1, 
    paddingHorizontal: HORIZONTAL_PADDING 
  },

  // Barre de progression
  progressBar: { 
    height: 4, 
    backgroundColor: '#eee', 
    borderRadius: 2, 
    marginBottom: 15, 
    marginTop: 5 
  },
  progressFill: { 
    height: '100%', 
    backgroundColor: '#007AFF', 
    borderRadius: 2 
  },

  // Question
  question: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 5, 
    color: '#333' 
  },
  subtitle: { 
    color: 'gray', 
    marginBottom: 20, 
    fontSize: 14 
  },

  // Grille d'options
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  gridBottomSpacer: { 
    height: 20 
  },

  // Carte d'option
  card: { 
    width: CARD_WIDTH, 
    height: 140, 
    marginBottom: 15, 
    borderRadius: 16, 
    overflow: 'hidden', 
    backgroundColor: '#f0f0f0', 
    borderWidth: 3, 
    borderColor: 'transparent', 
    position: 'relative' 
  },
  cardLike: { 
    borderColor: '#007AFF' 
  },
  cardDislike: { 
    borderColor: '#FF3B30' 
  },
  cardImage: { 
    width: '100%', 
    height: '100%', 
    position: 'absolute' 
  },
  darkOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.25)' 
  },
  likeOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0, 122, 255, 0.4)' 
  },
  dislikeOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(255, 59, 48, 0.5)' 
  },
  cardLabel: { 
    position: 'absolute', 
    bottom: 12, 
    left: 12, 
    right: 12, 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: 'white', 
    textShadowColor: 'rgba(0, 0, 0, 0.75)', 
    textShadowOffset: { width: 0, height: 1 }, 
    textShadowRadius: 4 
  },
  iconBadge: { 
    position: 'absolute', 
    top: 10, 
    right: 10, 
    borderRadius: 12, 
    height: 24, 
    width: 24, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: 'white' 
  },

  // Footer
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 20, 
    borderTopWidth: 1, 
    borderColor: '#f0f0f0', 
    backgroundColor: 'white' 
  },
  btnPrimary: { 
    backgroundColor: '#007AFF', 
    paddingVertical: 15, 
    borderRadius: 30, 
    width: '48%', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  btnPrimaryText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  btnDisabled: { 
    backgroundColor: '#A0C4FF', 
    opacity: 0.7 
  },
  btnSecondary: { 
    backgroundColor: '#F0F2F5', 
    paddingVertical: 15, 
    borderRadius: 30, 
    width: '48%', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  btnSecondaryText: { 
    fontWeight: 'bold', 
    color: 'black' 
  }
});

export default PreferencesScreen;
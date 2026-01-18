import React, { useState, useEffect } from 'react'; 
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import UserRepository from '../../backend/repositories/UserRepository';

const RegisterScreen = ({ navigation }) => {

  const [formData, setFormData] = useState({
    civilite: '', 
    nom: '',
    prenom: '',
    email: '',
    dateNaissance: '',
    pays: 'France',      
    countryCode: 'FR' 
  });

  const [isUpdateMode, setIsUpdateMode] = useState(false);

  // Au chargement, on vérifie si l'utilisateur existe déjà
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const count = await UserRepository.countProfiles();
        if (count > 0) {
          const profile = await UserRepository.getProfile();
          if (profile) {
            console.log("📝 Mode modification activé - Chargement des données");
            setFormData({
              civilite: '', // Ce champ n'est pas stocké en BDD dans votre modèle actuel, on le laisse vide ou on gère ça plus tard
              nom: profile.lastName || '',
              prenom: profile.firstName || '',
              email: profile.email || '',
              dateNaissance: profile.dateOfBirth || '',
              pays: profile.country || 'France',
              countryCode: 'FR'
            });
            setIsUpdateMode(true);
          }
        }
      } catch (error) {
        console.error("Erreur chargement profil existant:", error);
      }
    };
    loadExistingData();
  }, []);

  const RadioButton = ({ label, value }) => {
    const isSelected = formData.civilite === value;
    return (
        <TouchableOpacity 
            style={styles.radioContainer} 
            onPress={() => handleInputChange('civilite', value)}
            activeOpacity={0.8}
        >
            <View style={[styles.radioOuterCircle, isSelected && styles.radioOuterCircleSelected]}>
                {isSelected && <View style={styles.radioInnerCircle} />}
            </View>
            <Text style={styles.radioText}>{label}</Text>
        </TouchableOpacity>
    );
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };
  
  const handleDateChange = (text) => { 
    let cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length >= 3) cleaned = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    if (cleaned.length >= 6) cleaned = `${cleaned.slice(0, 5)}/${cleaned.slice(5, 9)}`;
    setFormData({ ...formData, dateNaissance: cleaned });
  };
  
  const handleSubmit = async () => {
    if (!formData.nom || !formData.prenom || !formData.email) {
      Alert.alert("Attention", "Veuillez remplir les champs obligatoires (Nom, Prénom, Email).");
      return;
    }

    try {
      const userData = {
        firstName: formData.prenom,
        lastName: formData.nom,
        email: formData.email,
        gender: formData.civilite, // Ajout du genre (Mme, M., N/R)
        dateOfBirth: formData.dateNaissance || null,
        country: 'France',
      };

      // DEBUG: Afficher une alerte pour vérifier les données avant envoi
      Alert.alert("DEBUG DONNÉES", `Envoi: ${JSON.stringify(userData, null, 2)}`);

      // Sauvegarder dans la base de données avec createProfile
      const userId = await UserRepository.createProfile(userData);
      console.log(`✅ Profil créé avec succès! User ID: ${userId}`);
      if (isUpdateMode) {
        console.log("🔄 Mise à jour du profil...", userData);
        await UserRepository.updateProfile(userData);
        console.log("✅ Profil mis à jour !");
      } else {
        console.log("💾 Création du profil...", userData);
        userData.preferences = [];
        userData.weaknesses = [];
        await UserRepository.createProfile(userData);
        console.log("✅ Profil créé !");
      }

      // Redirection vers Welcome
      navigation.replace('Welcome');

    } catch (error) {
      console.error("❌ Erreur sauvegarde:", error);
      Alert.alert("Erreur", "Une erreur est survenue.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.headerContainer}>
            <Text style={styles.title}>
                {isUpdateMode ? "Modifier mes infos" : "Bienvenue sur AirAtlas"}
            </Text>
            <Text style={styles.subtitle}>
                {isUpdateMode ? "Corrigez vos informations ci-dessous" : "Créez votre profil voyageur"}
            </Text>
          </View>

          <View style={styles.formContainer}>
            {/* Civilité */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Civilité</Text>
                <View style={styles.radioGroup}>
                    <RadioButton label="Madame" value="Mme" />
                    <RadioButton label="Monsieur" value="M." />
                    <RadioButton label="Ne pas renseigner" value="N/R" />
                </View>
            </View>

            {/* Nom */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom</Text>
                <TextInput style={styles.input} placeholder="Votre nom" value={formData.nom} onChangeText={(t) => handleInputChange('nom', t)}/>
            </View>

            {/* Prénom */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Prénom</Text>
                <TextInput style={styles.input} placeholder="Votre prénom" value={formData.prenom} onChangeText={(t) => handleInputChange('prenom', t)}/>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} placeholder="exemple@email.com" keyboardType="email-address" autoCapitalize="none" value={formData.email} onChangeText={(t) => handleInputChange('email', t)}/>
            </View>

            {/* Date Naissance */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Date de naissance</Text>
                <TextInput style={styles.input} placeholder="JJ/MM/AAAA" keyboardType="numeric" maxLength={10} value={formData.dateNaissance} onChangeText={handleDateChange}/>
            </View>

            {/* Pays - Fixe */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Pays</Text>
                <View style={[styles.countryInputContainer, styles.disabledInput]}>
                  <Text style={{ fontSize: 24, marginLeft: 10 }}>🇫🇷</Text>
                  <Text style={[styles.countryNameText, { color: '#555' }]}>France</Text>
                  <Ionicons name="lock-closed-outline" size={18} color="#999" style={{marginRight: 15}} />
                </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>
                    {isUpdateMode ? "Valider les modifications" : "Commencer l'aventure"}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="white" style={{marginLeft: 10}}/>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  headerContainer: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#004aad', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: 'gray', textAlign: 'center' },
  formContainer: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10, marginLeft: 5 },
  radioGroup: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  radioContainer: { flexDirection: 'row', alignItems: 'center' },
  radioOuterCircle: { height: 18, width: 18, borderRadius: 9, borderWidth: 2, borderColor: '#777', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  radioOuterCircleSelected: { borderColor: '#004aad' },
  radioInnerCircle: { height: 9, width: 9, borderRadius: 4.5, backgroundColor: '#004aad' },
  radioText: { fontSize: 13, color: '#333' },
  input: { backgroundColor: '#F5F7FA', padding: 15, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#E1E1E1' },
  countryInputContainer: { backgroundColor: '#F5F7FA', borderRadius: 12, borderWidth: 1, borderColor: '#E1E1E1', flexDirection: 'row', alignItems: 'center', height: 55 },
  disabledInput: { backgroundColor: '#E9ECEF', borderColor: '#D1D5DB' },
  countryNameText: { flex: 1, fontSize: 16, color: '#000', marginLeft: 10 },
  button: { backgroundColor: '#004aad', paddingVertical: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, shadowColor: '#004aad', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});

export default RegisterScreen;
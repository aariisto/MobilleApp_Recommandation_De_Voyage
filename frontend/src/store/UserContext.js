import React, { createContext, useState, useEffect } from 'react';
import dbConnection from '../backend/database/connection'; 
import UserRepository from '../backend/repositories/UserRepository'; 

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState({
    civilite: '', nom: '', prenom: '', email: '', dateNaissance: '', pays: '', countryCode: '',
    isLoaded: false
  });

  useEffect(() => {
    // 1. On initialise la DB (création table si besoin)
    // 2. On charge le profil
    initDB().then(() => loadUserFromDB());
  }, []);


  const initDB = async () => {
    try {
      // On s'assure d'abord que la connexion est ouverte 
      await dbConnection.openDatabase();

      const query = `
        CREATE TABLE IF NOT EXISTS user_profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          dateOfBirth TEXT,
          country TEXT,
          preferences TEXT,
          preferences_vector BLOB,
          weaknesses TEXT,
          weaknesses_vector BLOB,
          user_embedding BLOB,
          updated INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await dbConnection.executeSql(query);

      // Création des tables pour les likes (V2 Algo)
      const queryLikes = `
        CREATE TABLE IF NOT EXISTS user_category_likes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          category_name TEXT,
          points INTEGER DEFAULT 1,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES user_profiles(id)
        );
      `;
      await dbConnection.executeSql(queryLikes);

      // Création des tables pour les dislikes (V2 Algo)
      const queryDislikes = `
        CREATE TABLE IF NOT EXISTS user_category_dislikes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          category_name TEXT,
          points INTEGER DEFAULT 1,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES user_profiles(id)
        );
      `;
      await dbConnection.executeSql(queryDislikes);

      console.log("🔨 Tables user_profiles et user_category_likes/dislikes vérifiées avec succès");
    } catch (error) {
      console.warn("⚠️ Erreur initDB (si la table existe déjà ce n'est pas grave) :", error);
    }
  };

  const loadUserFromDB = async () => {
    try {
      // UserRepository doit aussi utiliser dbConnection en interne
      const profile = await UserRepository.getProfile(); 
      
      if (profile) {
        let foundCivilite = '';
        if (profile.preferences) {
            let prefs = Array.isArray(profile.preferences) ? profile.preferences : [];
            try { 
                if (typeof profile.preferences === 'string') prefs = JSON.parse(profile.preferences); 
            } catch (e) { prefs = []; }
            
            const civPref = prefs.find(p => typeof p === 'string' && p.startsWith('Civilité:'));
            if (civPref) foundCivilite = civPref.split(':')[1];
        }

        setUserData({
          civilite: foundCivilite, 
          nom: profile.lastName || '', 
          prenom: profile.firstName || '',
          email: profile.email || '', 
          dateNaissance: profile.dateOfBirth || '', 
          pays: profile.country || '',
          isLoaded: true
        });
      } else {
        setUserData(prev => ({ ...prev, isLoaded: true }));
      }
    } catch (error) {
      // S'il n'y a pas de profil, ce n'est pas grave, on charge l'app vide et l'utilisateur devra s'inscrire
      setUserData(prev => ({ ...prev, isLoaded: true }));
    }
  };

  const saveUserToDB = async (newInfo) => {
    // Mise à jour optimiste (Affichage instantané)
    setUserData({ ...newInfo, isLoaded: true }); 
    
    try {
      const dbData = {
        firstName: newInfo.prenom,
        lastName: newInfo.nom,
        email: newInfo.email,
        dateOfBirth: newInfo.dateNaissance,
        country: newInfo.pays,
        preferences: [`Civilité:${newInfo.civilite}`] 
      };

      const count = await UserRepository.countProfiles();
      
      if (count > 0) {
        await UserRepository.updateProfile(dbData);
      } else {
        await UserRepository.createProfile(dbData);
      }
      console.log("✅ Sauvegarde BDD réussie");

    } catch (error) {
      console.error("⚠️ Erreur sauvegarde BDD :", error);
    }
  };

  // --- SUPPRESSION DU COMPTE  ---
  const deleteAccount = async () => {
    try {
      console.log("🗑️ Suppression complète du compte...");
      
      // 1. On détruit la table user_profiles
      // Votre connection.js va exécuter cela via db.runAsync, c'est parfait.
      await dbConnection.executeSql("DROP TABLE IF EXISTS user_profiles");
      
      // 2. On la recrée tout de suite (vide et propre)
      await initDB();

      // 3. On remet l'affichage à zéro
      setUserData({
        civilite: '', nom: '', prenom: '', email: '', dateNaissance: '', pays: '', countryCode: '',
        isLoaded: true 
      });
      
      console.log("✅ Compte supprimé et table reconstruite.");
    } catch (error) {
      console.error("❌ Erreur lors de la suppression :", error);
    }
  };

  return (
    <UserContext.Provider value={{ userData, setUserData, saveUserToDB, deleteAccount }}>
      {children}
    </UserContext.Provider>
  );
};
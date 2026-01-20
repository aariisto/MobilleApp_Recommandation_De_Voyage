# 🌍 Air Atlas

## 📱 À propos du projet

Air Atlas est une application mobile développée avec React Native  qui permet aux utilisateurs de découvrir et d'obtenir des recommandations personnalisées de destinations de voyage. L'application utilise des algorithmes intelligents pour suggérer des villes basées sur les préférences de l'utilisateur, affiche des informations détaillées sur chaque destination et intègre des fonctionnalités de recherche de vols et d'images. jjjjj

![MobileApp Recommandation De Voyage](image/ban.png)

> **Architecture du système** : Cette application mobile se connecte à un backend Flask pour obtenir les recommandations de destinations. Pour une expérience complète, assurez-vous que le serveur backend est en cours d'exécution sur votre réseau.

## ✨ Fonctionnalités

- 🎯 **Recommandations intelligentes** basées sur les préférences et critères de l'utilisateur
- 🗺️ **Affichage détaillé des destinations** avec images et descriptions
- ✈️ **Recherche de vols** via intégration Amadeus et Google Flights
- 📸 **Galerie d'images** des destinations via Unsplash
- 🔒 **Authentification** des utilisateurs
- 🌡️ **Informations climatiques** pour chaque destination
- 📊 **Graphiques de recommandation** avec visualisations
- 🔍 **Recherche et filtrage** des destinations
- 💾 **Stockage local** des données avec SQLite

## 🛠️ Technologies utilisées

- 📱 &nbsp;**Mobile**
  ![React Native](https://img.shields.io/badge/-React%20Native-333333?style=flat&logo=react)
  ![Expo](https://img.shields.io/badge/-Expo-333333?style=flat&logo=expo)
  ![React Navigation](https://img.shields.io/badge/-React%20Navigation-333333?style=flat&logo=react)

- 📊 &nbsp;**Visualisations & Graphiques**
  ![React Native Chart Kit](https://img.shields.io/badge/-Chart%20Kit-333333?style=flat&logo=chart.js)
  ![React Native SVG](https://img.shields.io/badge/-SVG-333333?style=flat&logo=svg)

- 🗺️ &nbsp;**Cartographie & Localisation**
  ![Expo Location](https://img.shields.io/badge/-Expo%20Location-333333?style=flat&logo=expo)
  ![Geolocation](https://img.shields.io/badge/-Geolocation-333333?style=flat&logo=maps)

- 🌐 &nbsp;**API & Réseau**
  ![Axios](https://img.shields.io/badge/-Axios-333333?style=flat&logo=axios)
  ![REST API](https://img.shields.io/badge/-REST%20API-333333?style=flat&logo=api)
  ![Amadeus API](https://img.shields.io/badge/-Amadeus%20API-333333?style=flat&logo=api)
  ![Google Flights](https://img.shields.io/badge/-Google%20Flights-333333?style=flat&logo=google)

- 🎨 &nbsp;**UI & UX**
  ![Expo Linear Gradient](https://img.shields.io/badge/-Linear%20Gradient-333333?style=flat&logo=expo)
  ![React Native Vector Icons](https://img.shields.io/badge/-Vector%20Icons-333333?style=flat&logo=expo)
  ![Expo Status Bar](https://img.shields.io/badge/-Status%20Bar-333333?style=flat&logo=expo)

- 🔄 &nbsp;**Base de Données Locale**
  ![SQLite](https://img.shields.io/badge/-SQLite-333333?style=flat&logo=sqlite)
  ![Expo SQLite](https://img.shields.io/badge/-Expo%20SQLite-333333?style=flat&logo=expo)

-  &nbsp;**Outils de développement**
  ![Git](https://img.shields.io/badge/-Git-333333?style=flat&logo=git)
  ![VS Code](https://img.shields.io/badge/-VS%20Code-333333?style=flat&logo=visual-studio-code&logoColor=007ACC)
  ![Android Studio](https://img.shields.io/badge/-Android%20Studio-333333?style=flat&logo=android-studio)

## 📂 Structure du projet

```
frontend/
├── src/                    # Code source principal
│   ├── App.js              # Point d'entrée de l'application
│   ├── index.js            # Entrée React Native
│   ├── components/         # Composants réutilisables
│   ├── navigation/         # Configuration de la navigation
│   ├── screens/            # Écrans de l'application
│   │   ├── HomeScreen.js   # Écran d'accueil
│   │   ├── ProfileScreen.js # Écran profil utilisateur
│   │   └── ...             # Autres écrans
│   ├── services/           # Services pour les appels API
│   │   ├── amadeus_client.js
│   │   ├── unsplash_service.js
│   │   └── ...
│   ├── utils/              # Utilitaires et helpers
│   ├── hooks/              # Custom React Hooks
│   ├── data/               # Données locales
│   └── assets/             # Images et ressources
├── android/                # Configuration Android
├── app.json                # Configuration Expo
├── babel.config.js         # Configuration Babel
├── metro.config.js         # Configuration Metro bundler
└── package.json            # Dépendances du projet
```

## 🚀 Installation et déploiement

### Prérequis

- [Node.js](https://nodejs.org/) (v16 ou supérieur)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Android Studio](https://developer.android.com/studio) ou un émulateur Android configuré

### Installation de l'application mobile

1. **Cloner le dépôt**

   ```bash
   git clone https://github.com/aariisto/MobileApp_Recommandation_De_Voyage
   cd MobileApp_Recommandation_De_Voyage/frontend
   ```

2. **Installer les dépendances**

   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Configurer l'API**
   Modifiez les fichiers de configuration pour pointer vers votre backend (généralement `http://localhost:5000`).

4. **Lancer l'application en mode développement**

   ```bash
   npm start
   # ou
   yarn start
   ```

5. **Lancer sur Android (émulateur ou appareil)**

   ```bash
   npm run android
   # ou
   npx react-native run-android
   ```

   Vous pouvez aussi scanner le QR code avec l'application Expo Go sur votre appareil mobile.

> **Important** : Le téléphone/émulateur et le PC sur lequel le projet est exécuté doivent être connectés au même réseau Wi-Fi pour communiquer avec le serveur.

## 🔄 Fonctionnalités principales

### Recommandations intelligentes

L'application affiche des destinations recommandées basées sur les algorithmes du backend qui analysent les préférences utilisateur.

### Recherche de vols

Intégration avec Amadeus et Google Flights pour afficher les prix de vols en temps réel et permettre aux utilisateurs de planifier leur voyage directement depuis l'app.

### Galerie d'images

Les images des destinations sont récupérées dynamiquement via l'API Unsplash pour offrir une expérience visuelle riche et attrayante.

### Navigation intuitive

Interface utilisateur moderne avec navigation par onglets (bottom tabs) et écrans détaillés pour chaque destination.

## 📸 Captures d'écran

[Les captures d'écran seront ajoutées ici]

## 👨‍💻 Contributeurs

- **aariisto** - Développeur principal

## 📬 Contact

Pour plus d'informations, consultez les fichiers README dans chaque dossier (`frontend/README.md`, `backend/README.md`).

---

Fait avec ❤️ pour les voyageurs du monde entier.

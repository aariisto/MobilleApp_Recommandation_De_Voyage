# 🌍 Air Atlas - Application de Recommandation de Voyage AI

## 📱 À propos du projet

**Air Atlas** est une application mobile innovante développée avec **React Native** qui aide les utilisateurs à découvrir leur prochaine destination de voyage idéale. Contrairement aux applications classiques, **Air Atlas** utilise une **Intelligence Artificielle embarquée (On-Device AI)** pour analyser les préférences des utilisateurs et recommander des villes basées sur des similitudes vectorielles (Embeddings), le tout sans nécessiter de connexion serveur permanente pour l'analyse.

> **Note :** Ce projet intègre un moteur de recommandation complet fonctionnant localement sur le téléphone grâce à ONNX et SQLite.

## ✨ Fonctionnalités

- 🧠 **IA Embarquée & Privée** : Analyse des préférences et matching des villes directement sur l'appareil via `onnxruntime-react-native` et `@xenova/transformers`.
- 🎯 **Recommandations Personnalisées** : Algorithme de ranking prenant en compte les "Likes", "Dislikes" et les pénalités de distance/prix.
- 📂 **Mode Hors-Ligne** : Base de données complète des villes, prix et climats stockée localement via **SQLite**.
- 📊 **Visualisation de Données** : Graphiques de prix et de climat pour chaque destination.
- 🔍 **Recherche Avancée** : Filtrage par critères (plage, histoire, vie nocturne, etc.).
- 🎨 **Interface Moderne** : Design fluide avec animations et thèmes.

## 🛠️ Technologies utilisées

### Mobile

- 📱 **Framework** : [React Native](https://reactnative.dev/) (v0.81) & [Expo](https://expo.dev/) (Modules)
- 🧭 **Navigation** : [React Navigation 7](https://reactnavigation.org/) (Native Stack & Bottom Tabs)
- ⚡ **Performance** : [FlashList](https://shopify.github.io/flash-list/) pour les listes optimisées

### Intelligence Artificielle & Data

- 🤖 **Moteur AI** : [ONNX Runtime](https://onnxruntime.ai/) & [@xenova/transformers](https://huggingface.co/docs/transformers.js)
- 💾 **Base de Données** : [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- 🧮 **Algorithmes** : Calculs vectoriels (Cosinus Similarity) en JavaScript pur optimisé.

### UI & Utilitaires

- 🎨 **Design** : `react-native-linear-gradient`, `react-native-vector-icons`
- 📈 **Charts** : `react-native-chart-kit`

## 📂 Structure du projet

```
frontend/
├── android/                # Projet natif Android
├── assets/                 # Ressources (Images, Modèles ONNX, Vocab)
│   ├── models/             # Modèles IA quantifiés (.onnx)
│   └── city_images/        # Photos des villes
├── src/                    # Code source principal
│   ├── backend/            # Logique métier et BDD (Migré en local)
│   │   ├── algorithms/     # Algorithmes de ranking et vecteurs
│   │   ├── database/       # Gestion SQLite et Schémas
│   │   ├── repositories/   # Couche d'accès aux données (DAO)
│   │   └── services/       # Services métier (Inference, Recommendation)
│   ├── components/         # Composants UI réutilisables
│   ├── context/            # Gestion d'état global (Thème, Auth)
│   ├── data/               # Données statiques (JSON)
│   ├── navigation/         # Configuration des routes
│   └── screens/            # Écrans de l'application
├── App.js                  # Point d'entrée
└── package.json            # Dépendances
```

## 🚀 Installation et déploiement

### Prérequis

- **Node.js** (v18+ recommandé)
- **Java Development Kit (JDK)** (v17 recommandé) / **Android Studio**
- **Android SDK** configuré

### Installation

1.  **Cloner le dépôt**

    ```bash
    git clone <url-du-repo>
    cd SAEE_BUT/frontend
    ```

2.  **Installer les dépendances**

    ```bash
    npm install
    # ou
    yarn install
    ```

3.  **Configurer l'environnement Android**
    Assurez-vous que la variable `ANDROID_HOME` est bien définie.
    _(Commande PowerShell rapide)_ :

    ```powershell
    $env:ANDROID_HOME="C:\Users\VotreUtilisateur\AppData\Local\Android\Sdk"
    ```

4.  **Lancer l'application**
    Dans un terminal (Lancer Metro) :
    ```bash
    npx react-native start --reset-cache
    ```
    Dans un second terminal (Compiler et installer sur l'émulateur) :
    ```bash
    npx react-native run-android
    ```

> **Astuce** : Si le téléphone ne se connecte pas au serveur Dev, utilisez `adb reverse tcp:8081 tcp:8081`.

## 🔄 Fonctionnalités Spéciales

### 🧠 Moteur d'Inférence Local

L'application ne dépend pas d'une API Python externe pour ses calculs d'IA. Le modèle de langage est "quantifié" et embarqué directement dans le dossier `assets/models`. Lors du premier lancement, l'application initialise le moteur ONNX pour transformer les requêtes utilisateur en vecteurs mathématiques instantanément.

### 💾 Architecture "Offline-First"

Grâce à `expo-sqlite`, l'intégralité du catalogue de villes et des embeddings est stockée sur le téléphone. Cela garantit une confidentialité totale des données utilisateur et une réactivité immédiate, même sans réseau.

## 📬 Contact

Projet développé dans le cadre de la SAE BUT3.

---

_Fait avec ❤️ et beaucoup de café ☕_

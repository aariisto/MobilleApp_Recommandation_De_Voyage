# ExploreUs Frontend

Ce dossier contient le code source de l'application mobile ExploreUs (React Native / Expo).

## Prérequis

1.  **Node.js** : Assurez-vous d'avoir Node.js installé.
2.  **Android Studio** : Nécessaire pour l'émulateur et le SDK Android.
    - Télécharger ici : [Android Studio](https://developer.android.com/studio)

## Configuration Android (Windows)

Pour que les commandes `adb` et l'émulateur fonctionnent correctement, vous devez ajouter les chemins du SDK Android à vos variables d'environnement (PATH).

1.  Ouvrez la recherche Windows et tapez "Modifier les variables d'environnement système".
2.  Cliquez sur "Variables d'environnement".
3.  Dans la section "Variables utilisateur" ou "Variables système", trouvez la variable `Path` et cliquez sur "Modifier".
4.  Ajoutez les deux chemins suivants (remplacez `<TonNom>` par votre nom d'utilisateur Windows) :

    ```text
    C:\Users\<TonNom>\AppData\Local\Android\Sdk\platform-tools
    C:\Users\<TonNom>\AppData\Local\Android\Sdk\emulator
    ```

5.  Validez et redémarrez votre terminal (PowerShell ou CMD) pour que les changements soient pris en compte.

## Installation

Installez les dépendances du projet :

```bash
npm install
```

## Lancer le projet

```bash
npx react-native run-android
```

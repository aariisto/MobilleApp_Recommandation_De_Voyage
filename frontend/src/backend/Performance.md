# Rapport de Performance : Application React Native

**Contexte :** Analyse des logs d'exécution sur Android.
**Focus :** Algorithme de recommandation (exécuté 1x/semaine) et interactions UI.

## 1. Zone Critique (Goulot d'étranglement)
Ces fonctions bloquent le thread principal JavaScript et présentent un risque de gel de l'interface ou de crash mémoire sur les petits appareils.

| Fonction | Durée (Temps) | RAM (Mémoire) | CPU (Moyen) | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **rankCitiesWithPenalty** | **6 169,61 ms** (6,1s) | **30,85 MB** | 0,00 ms* | **CRITIQUE** - Bloque l'interface. Cause principale du délai. |
| **Algorithm Test** (Total) | **12 342,09 ms** (12,3s) | **61,71 MB** | 78,77 ms | **LOURD** - Risque de saturation mémoire (OOM). |

*Note : 0,00 ms CPU indique que la charge est entièrement sur le Thread JavaScript (calculs mathématiques), et non sur le CPU natif.*

---

## 2. Intelligence Artificielle (Inférence ONNX)
Performance excellente. L'IA n'est pas la cause des lenteurs.

| Fonction | Durée | RAM | Verdict |
| :--- | :--- | :--- | :--- |
| InferenceService.generateEmbedding | 94,28 ms | 0,47 MB | Très Rapide |
| InferenceService.loadModel | 42,34 ms | 0,21 MB | Excellent |
| InferenceService.prepareInputs | 25,59 ms | 0,13 MB | Excellent |
| InferenceService.tokenizeText | 7,61 ms | 0,04 MB | Instantané |

---

## 3. Base de Données & Services (Volumétrie)
Ces fonctions sont rapides unitairement, mais instables ou appelées trop souvent (problème de boucle "N+1").

| Fonction | Durée (Moy - Max) | RAM (Max) | Verdict |
| :--- | :--- | :--- | :--- |
| ThemeFilterService.getCityThemes | 12 ms - **239,48 ms** | **1,20 MB** | **Instable** - Pics de latence anormaux. |
| CityActivityService.getCityActivities | 12 ms - **254,02 ms** | **1,27 MB** | **Instable** - Dépend de la fonction ci-dessus. |
| CityRepository.getCityById | 0,30 ms - **74,97 ms** | 0,37 MB | **Trop Fréquent** - Appelé des centaines de fois. |
| PlaceLikedRepository.getAllPlacesLiked | 0,32 ms - 43,11 ms | 0,22 MB | Correct |
| ThemeFilterService.filterHistory | 0,30 ms - 55,07 ms | 0,28 MB | Correct |
| ThemeFilterService.filterNature | 0,16 ms - 5,56 ms | 0,03 MB | Instantané |

---

$## Recommandations Techniques

1.  **Gestion du Thread Principal (Priorité 1) :**
    * La fonction `rankCitiesWithPenalty` ne doit jamais être exécutée de manière synchrone directe.
    * **Action :** Utiliser `InteractionManager.runAfterInteractions` ou un `setTimeout` pour garantir l'affichage du chargement (spinner) avant le début du calcul.

2.  **Gestion de la Mémoire :**
    * Un pic de **60MB** est observé.
    * **Action :** Surveiller cette métrique lors de l'ajout de nouvelles villes. Si la mémoire dépasse 100MB, envisager le traitement par lots (chunking).

3.  **Optimisation SQL (Secondaire) :**
    * Les appels multiples à la base de données ralentissent le traitement global.
    * **Action :** À terme, remplacer les requêtes itératives par des requêtes groupées (`WHERE id IN (...)`).$
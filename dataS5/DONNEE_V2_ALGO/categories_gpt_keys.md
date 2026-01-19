<<<<<<< HEAD
# categories_gpt_keys.json — Explication (filtre strict)

Cette configuration décrit **quels thèmes touristiques** doivent être gardés (et lesquels doivent être ignorés) lors de la génération de `categories_gpt`.

Objectif : maximiser la pertinence pour MiniLM en décrivant **l’expérience touristique et l’ambiance**, pas l’infrastructure.

Le générateur lit la liste `categories` (tags en notation pointée comme `tourism.sights.castle`) et construit une **courte phrase en anglais** en :

1. détectant les thèmes importants (Nature / Histoire / Gastronomie / Shopping / Fun-Sport)
2. extrayant quelques valeurs « leaf » utiles (ex: `castle`, `ruines`, types de cuisine)
3. supprimant les doublons + limitant le nombre d’éléments
4. ignorant volontairement le bruit (administratif/technique/infrastructure)

---

## Structure du fichier

### `version`

Simple numéro de version de la configuration (v3 inclut des ajustements de matching/précision).

### `include_themes`

Blocs de thèmes **à inclure** dans la phrase si présents.

- `nature` : `natural`, `beach`, `island`, `national_park` (+ extraction de leaf sur ces préfixes, ex: `natural.forest`, `beach.sand`).
- `history` : `heritage`, `tourism.sights`, `religion`, `memorial`, et **exception** `building.historic`.
- `gastronomy` : `production.winery`, `production.brewery` et **tous** les `catering.restaurant.*`.
- `shopping` : **uniquement** `commercial.shopping_mall`, `commercial.marketplace`, `commercial.gift_and_souvenir`.
- `fun_sport` : matching par préfixe pour capter aussi les sous-tags (`adult.nightclub.*`, `adult.casino.*`, `entertainment.theme_park.*`, `sport.stadium.*`) + `ski.*`.

#### `any_prefixes` et `any_exact`

Un thème est considéré comme présent si :

- une catégorie est égale à un élément de `any_exact` (match exact), ou
- une catégorie est égale à un préfixe de `any_prefixes` ou commence par `prefix.`.

Exemple :

- le préfixe `tourism.sights` matche `tourism.sights.castle`, `tourism.sights.memorial.monument`, etc.

#### Extraction « leaf »

Certains thèmes extraient des valeurs « leaf » (feuilles) pour rendre la phrase plus spécifique.

Exemples :

- si un tag vaut `tourism.sights.place_of_worship.cathedral`, alors la leaf est `cathedral`.
- si un tag vaut `catering.restaurant.french`, alors la leaf est `french`.
- et qu’un tag vaut `tourism.sights.place_of_worship.cathedral`
- alors la leaf extraite est `cathedral` (la dernière partie après le dernier point)

Les champs `max_*` limitent le nombre de leaf conservées (pour garder des phrases courtes et stables).

#### `themes.food_and_drink.cuisines_leaf_extraction_prefix`

Même idée pour les restaurants :

- `catering.restaurant.french` → leaf `french`
- `catering.restaurant.seafood` → leaf `seafood`

`cuisines_blacklist` retire des leaf trop génériques qui n’aident pas la sémantique (comme `restaurant`, `regional`).

---

## `ignore`

Liste des familles à **ignorer complètement** (bruit) :

- administratif/infrastructure : `administrative`, `office`, `parking`, `highway`, `education`, `healthcare`
- attributs techniques : `fee`, `internet_access`, `wheelchair`, `access`, `access_limited`
- catégories trop vagues : `man_made`, `building`

Exception : `building.historic` est autorisé car il porte un signal “histoire”.

---

## `sentence_rules`

### `fallback`

Si aucun thème n’est détecté, le générateur utilise une phrase de repli (en anglais).

---

## Exemple rapide

Catégories d’entrée :

- `tourism.sights.castle`
- `tourism.sights.memorial.monument`
- `internet_access.free`

Résultat (conceptuel) :

- inclus : Histoire (sights + memorial)
- ignoré : `internet_access.free` (attribut technique)
- phrase : `"<City> is a great choice for travelers seeking historical heritage, with landmarks like castle and memorials."`
=======
# categories_gpt_keys.json — Explication (filtre strict)

Cette configuration décrit **quels thèmes touristiques** doivent être gardés (et lesquels doivent être ignorés) lors de la génération de `categories_gpt`.

Objectif : maximiser la pertinence pour MiniLM en décrivant **l’expérience touristique et l’ambiance**, pas l’infrastructure.

Le générateur lit la liste `categories` (tags en notation pointée comme `tourism.sights.castle`) et construit une **courte phrase en anglais** en :

1. détectant les thèmes importants (Nature / Histoire / Gastronomie / Shopping / Fun-Sport)
2. extrayant quelques valeurs « leaf » utiles (ex: `castle`, `ruines`, types de cuisine)
3. supprimant les doublons + limitant le nombre d’éléments
4. ignorant volontairement le bruit (administratif/technique/infrastructure)

---

## Structure du fichier

### `version`

Simple numéro de version de la configuration (v3 inclut des ajustements de matching/précision).

### `include_themes`

Blocs de thèmes **à inclure** dans la phrase si présents.

- `nature` : `natural`, `beach`, `island`, `national_park` (+ extraction de leaf sur ces préfixes, ex: `natural.forest`, `beach.sand`).
- `history` : `heritage`, `tourism.sights`, `religion`, `memorial`, et **exception** `building.historic`.
- `gastronomy` : `production.winery`, `production.brewery` et **tous** les `catering.restaurant.*`.
- `shopping` : **uniquement** `commercial.shopping_mall`, `commercial.marketplace`, `commercial.gift_and_souvenir`.
- `fun_sport` : matching par préfixe pour capter aussi les sous-tags (`adult.nightclub.*`, `adult.casino.*`, `entertainment.theme_park.*`, `sport.stadium.*`) + `ski.*`.

#### `any_prefixes` et `any_exact`

Un thème est considéré comme présent si :

- une catégorie est égale à un élément de `any_exact` (match exact), ou
- une catégorie est égale à un préfixe de `any_prefixes` ou commence par `prefix.`.

Exemple :

- le préfixe `tourism.sights` matche `tourism.sights.castle`, `tourism.sights.memorial.monument`, etc.

#### Extraction « leaf »

Certains thèmes extraient des valeurs « leaf » (feuilles) pour rendre la phrase plus spécifique.

Exemples :

- si un tag vaut `tourism.sights.place_of_worship.cathedral`, alors la leaf est `cathedral`.
- si un tag vaut `catering.restaurant.french`, alors la leaf est `french`.
- et qu’un tag vaut `tourism.sights.place_of_worship.cathedral`
- alors la leaf extraite est `cathedral` (la dernière partie après le dernier point)

Les champs `max_*` limitent le nombre de leaf conservées (pour garder des phrases courtes et stables).

#### `themes.food_and_drink.cuisines_leaf_extraction_prefix`

Même idée pour les restaurants :

- `catering.restaurant.french` → leaf `french`
- `catering.restaurant.seafood` → leaf `seafood`

`cuisines_blacklist` retire des leaf trop génériques qui n’aident pas la sémantique (comme `restaurant`, `regional`).

---

## `ignore`

Liste des familles à **ignorer complètement** (bruit) :

- administratif/infrastructure : `administrative`, `office`, `parking`, `highway`, `education`, `healthcare`
- attributs techniques : `fee`, `internet_access`, `wheelchair`, `access`, `access_limited`
- catégories trop vagues : `man_made`, `building`

Exception : `building.historic` est autorisé car il porte un signal “histoire”.

---

## `sentence_rules`

### `fallback`

Si aucun thème n’est détecté, le générateur utilise une phrase de repli (en anglais).

---

## Exemple rapide

Catégories d’entrée :

- `tourism.sights.castle`
- `tourism.sights.memorial.monument`
- `internet_access.free`

Résultat (conceptuel) :

- inclus : Histoire (sights + memorial)
- ignoré : `internet_access.free` (attribut technique)
- phrase : `"<City> is a great choice for travelers seeking historical heritage, with landmarks like castle and memorials."`
>>>>>>> main

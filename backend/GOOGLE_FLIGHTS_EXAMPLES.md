<<<<<<< HEAD
# 🔗 Guide d'Utilisation - API Google Flights Link Generator

## 📋 Vue d'ensemble

Cette API génère des liens de recherche Google Flights **simples et fiables** basés sur les noms de villes.

**Format d'URL généré:**
\`\`\`\`\`\`
https://www.google.com/travel/flights?q={CITY_FROM}%20to%20{CITY_TO}
\`\`\`\`\`\`

## Exemple Complet

**Requête:**
\`\`\`\`\`\`bash
curl 'http://localhost:5000/api/travel/flights/google-link?originCity=Paris&destinationCity=Algiers'
\`\`\`\`\`\`

**Réponse:**
\`\`\`\`\`\`json
{
\`"success\`": true,
\`"message\`": \`"Google Flights search link generated successfully\`",
\`"data\`": {
\`"url\`": \`"https://www.google.com/travel/flights?q=Paris%20to%20Algiers\`",
\`"search_query\`": {
\`"origin_city\`": \`"Paris\`",
\`"destination_city\`": \`"Algiers\`"
}
}
}
\`\`\`\`\`\`

Voir ARCHITECTURE.md pour plus de détails.
"@
=======
# 🔗 Guide d'Utilisation - API Google Flights Link Generator

## 📋 Vue d'ensemble

Cette API génère des liens de recherche Google Flights **simples et fiables** basés sur les noms de villes.

**Format d'URL généré:**
\`\`\`\`\`\`
https://www.google.com/travel/flights?q={CITY_FROM}%20to%20{CITY_TO}
\`\`\`\`\`\`

## Exemple Complet

**Requête:**
\`\`\`\`\`\`bash
curl 'http://localhost:5000/api/travel/flights/google-link?originCity=Paris&destinationCity=Algiers'
\`\`\`\`\`\`

**Réponse:**
\`\`\`\`\`\`json
{
\`"success\`": true,
\`"message\`": \`"Google Flights search link generated successfully\`",
\`"data\`": {
\`"url\`": \`"https://www.google.com/travel/flights?q=Paris%20to%20Algiers\`",
\`"search_query\`": {
\`"origin_city\`": \`"Paris\`",
\`"destination_city\`": \`"Algiers\`"
}
}
}
\`\`\`\`\`\`

Voir ARCHITECTURE.md pour plus de détails.
"@
>>>>>>> main

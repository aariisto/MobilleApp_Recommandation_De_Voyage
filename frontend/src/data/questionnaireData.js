export const questions = [
  {
    id: 1,
    question: "Quel type de lieu t’intéresse le plus ?",
    options: [
      { id: '1A', label: "Monuments touristiques", img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=500', categories: ['tourism', 'tourism.attraction'] },
      { id: '1B', label: "Restos & Bars", img: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=500', categories: ['catering', 'catering.restaurant', 'catering.bar'] },
      { id: '1C', label: "Nature & Plages", img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500', categories: ['leisure', 'natural', 'beach'] },
      { id: '1D', label: "Shopping", img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=500', categories: ['commercial', 'commercial.shopping_mall'] },
      { id: '1E', label: "Vie nocturne", img: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=500', categories: ['adult', 'adult.nightclub'] },
      { id: '1F', label: "Sport", img: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=500', categories: ['sport'] },
      { id: '1G', label: "Culture & Musées", img: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=500', categories: ['entertainment.museum', 'entertainment.culture'] },
      { id: '1H', label: "Spirituel & Religieux", img: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=500', categories: ['religion'] },
    ]
  },
  {
    id: 2,
    question: "Quel type de cuisine préfères-tu ?",
    options: [
      { id: '2A', label: "Locale / Régionale", img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500', categories: ['catering.restaurant.regional'] },
      { id: '2B', label: "Italienne (Pizza/Pâtes)", img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500', categories: ['catering.restaurant.italian'] },
      { id: '2C', label: "Asiatique", img: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=500', categories: ['catering.restaurant.asian'] },
      { id: '2D', label: "Américaine / Burgers", img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500', categories: ['catering.restaurant.american'] },
      { id: '2E', label: "Végétarien / Healthy", img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500', categories: ['vegetarian'] },
      { id: '2F', label: "Peu importe", img: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=500', categories: ['catering.restaurant'] },
    ]
  },
  {
    id: 3,
    question: "Restrictions alimentaires ?",
    options: [
      { id: '3A', label: "Végétarien", img: 'https://images.unsplash.com/photo-1540914124281-342587941389?auto=format&fit=crop&w=500', categories: ['vegetarian'] },
      { id: '3B', label: "Vegan", img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500', categories: ['vegan'] },
      { id: '3C', label: "Halal", img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=80', categories: ['halal'] },
      { id: '3D', label: "Sans gluten", img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500', categories: ['gluten_free'] },
      { id: '3E', label: "Aucune", img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500', categories: [] },
    ]
  },
  {
    id: 4,
    question: "Type d'hébergement ?",
    options: [
      { id: '4A', label: "Hôtel", img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500', categories: ['accommodation.hotel'] },
      { id: '4B', label: "Auberge de jeunesse", img: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=500', categories: ['accommodation.hostel'] },
      { id: '4C', label: "Chambre d’hôtes", img: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=500', categories: ['accommodation.guest_house'] },
      { id: '4D', label: "Refuge / Nature", img: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=500', categories: ['accommodation.hut'] },
      { id: '4E', label: "Pas besoin", img: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=500', categories: [] },
    ]
  },
  {
    id: 5,
    question: "Accessibilité PMR ?",
    options: [
      { id: '5A', label: "Indispensable", img: 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?auto=format&fit=crop&w=500', categories: ['wheelchair.yes'] },
      { id: '5B', label: "Appréciée", img: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500', categories: ['wheelchair.limited'] },
      { id: '5C', label: "Pas de besoin", img: 'https://images.unsplash.com/photo-1461301214746-1e790926d323?auto=format&fit=crop&w=500&q=80', categories: [] },
    ]
  },
  {
    id: 6,
    question: "Accès Internet ?",
    options: [
      { id: '6A', label: "Wifi indispensable", img: 'https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&fit=crop&w=500', categories: ['internet_access.free'] },
      { id: '6B', label: "Wifi clients OK", img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=500', categories: ['internet_access.for_customers'] },
      { id: '6C', label: "Déconnexion", img: 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?auto=format&fit=crop&w=500', categories: [] },
    ]
  },
  {
    id: 7,
    question: "Animaux de compagnie ?",
    options: [
      { id: '7A', label: "Chiens bienvenus", img: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=500', categories: ['dogs.yes'] },
      { id: '7B', label: "En laisse OK", img: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=500', categories: ['dogs.leashed'] },
      { id: '7C', label: "Sans animaux", img: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&w=500', categories: ['no_dogs'] },
      { id: '7D', label: "Peu importe", img: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=500', categories: [] },
    ]
  },
  {
    id: 8,
    question: "Budget / Entrée ?",
    options: [
      { id: '8A', label: "Gratuit uniquement", img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=500', categories: ['no_fee'] },
      { id: '8B', label: "Mixte", img: 'https://images.unsplash.com/photo-1518183214770-9cffbec72538?auto=format&fit=crop&w=500', categories: ['fee', 'no_fee'] },
      { id: '8C', label: "Expériences payantes", img: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=500', categories: ['fee'] },
    ]
  },
  {
    id: 9,
    question: "Environnement préféré ?",
    options: [
      { id: '9A', label: "Urbain / Ville", img: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=500', categories: ['populated_place'] },
      { id: '9B', label: "Nature / Montagne", img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=500', categories: ['natural'] },
      { id: '9C', label: "Mer / Plage", img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500', categories: ['beach'] },
      { id: '9D', label: "Peu importe", img: 'https://images.unsplash.com/photo-1524850011238-e3d235c7d4c9?auto=format&fit=crop&w=500', categories: [] },
    ]
  },
  {
    id: 10,
    question: "Intérêts culturels ?",
    options: [
      { id: '10A', label: "Musées", img: 'https://images.unsplash.com/photo-1584652868574-0669f4292976?auto=format&fit=crop&w=500', categories: ['entertainment.museum'] },
      { id: '10B', label: "Châteaux & Forts", img: 'https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?auto=format&fit=crop&w=500', categories: ['tourism.sights.castle'] },
      { id: '10C', label: "Lieux de culte", img: 'https://images.unsplash.com/photo-1548544149-4835e62ee5b3?auto=format&fit=crop&w=500', categories: ['religion'] },
      { id: '10D', label: "Spectacles", img: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=500', categories: ['entertainment.culture'] },
      { id: '10E', label: "Peu importe", img: 'https://images.unsplash.com/photo-1515169273894-7e876dcf13da?auto=format&fit=crop&w=500', categories: [] },
    ]
  },
  {
    id: 11,
    question: "Attractions fun ?",
    options: [
      { id: '11A', label: "Parcs d'attractions", img: 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=500', categories: ['entertainment.theme_park'] },
      { id: '11B', label: "Zoo / Animaux", img: 'https://images.unsplash.com/photo-1557008075-7f2c5efa4cfd?auto=format&fit=crop&w=500', categories: ['entertainment.zoo'] },
      { id: '11C', label: "Jeux / Arcade", img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=500', categories: ['entertainment.amusement_arcade'] },
      { id: '11D', label: "Pas intéressé", img: 'https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?auto=format&fit=crop&w=500', categories: [] },
    ]
  },
  {
    id: 12,
    question: "Transport principal ?",
    options: [
      { id: '12A', label: "À pied", img: 'https://images.unsplash.com/photo-1501901609772-df0848060b33?auto=format&fit=crop&w=500', categories: ['highway.pedestrian'] },
      { id: '12B', label: "Transports en commun", img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=500', categories: ['public_transport'] },
      { id: '12C', label: "Voiture", img: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=500', categories: ['parking'] },
      { id: '12D', label: "Vélo / Autre", img: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=500', categories: ['rental.bicycle'] },
    ]
  },
  {
    id: 13,
    question: "Services pratiques ?",
    options: [
      { id: '13A', label: "Banque / ATM", img: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&w=500', categories: ['service.financial'] },
      { id: '13B', label: "Pharmacie / Santé", img: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=500', categories: ['healthcare'] },
      { id: '13C', label: "Coworking", img: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=500', categories: ['office.coworking'] },
      { id: '13D', label: "Aucun", img: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=500', categories: [] },
    ]
  },
  {
    id: 14,
    question: "Type de shopping ?",
    options: [
      { id: '14A', label: "Centres commerciaux", img: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=500', categories: ['commercial.shopping_mall'] },
      { id: '14B', label: "Artisanat & Souvenirs", img: 'https://images.unsplash.com/photo-1459257831348-f0cdd359235f?w=500', categories: ['commercial.gift_and_souvenir'] },
      { id: '14C', label: "Livres & Loisirs", img: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=500', categories: ['commercial.books'] },
      { id: '14D', label: "Pas de shopping", img: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500', categories: [] },
    ]
  },
  {
    id: 15,
    question: "Nature & Patrimoine ?",
    options: [
      { id: '15A', label: "Nature + Monuments", img: 'https://images.unsplash.com/photo-1505567745926-ba89000d255a?auto=format&fit=crop&w=500', categories: ['tourism.sights.memorial'] },
      { id: '15B', label: "Vues panoramiques", img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Grand_Canyon_HDR_Panorama.jpg/640px-Grand_Canyon_HDR_Panorama.jpg', categories: ['tourism.attraction.viewpoint'] },
      { id: '15C', label: "Pas prioritaire", img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=500', categories: [] },
    ]
  }
];
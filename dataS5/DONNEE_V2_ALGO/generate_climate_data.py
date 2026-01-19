import json

# Charger les données des villes avec les pays
with open('../DONNE_V1_ALGO/cities_geocoded_all.json', 'r', encoding='utf-8') as f:
    cities_data = json.load(f)

# Règles climatiques par latitude/région
climate_rules = {
    # Europe du Nord (Scandinavie, Baltique) - Latitude > 55°N
    'northern_europe': {
        'countries': ['Norway', 'Sweden', 'Finland', 'Denmark', 'Iceland', 'Estonia', 'Latvia', 'Lithuania'],
        'climate': {'hiver': 'froid', 'printemps': 'froid', 'été': 'froid', 'automne': 'froid'}
    },
    
    # Europe Centrale (Allemagne, Pologne, République tchèque, Autriche)
    'central_europe': {
        'countries': ['Germany', 'Poland', 'Czech Republic', 'Austria', 'Switzerland', 'Hungary', 'Slovakia'],
        'mountain_cities': ['Innsbruck', 'Salzburg', 'Lucerne', 'Interlaken', 'Zermatt', 'Graz'],
        'mountain_climate': {'hiver': 'froid', 'printemps': 'froid', 'été': 'tempéré', 'automne': 'froid'},
        'default_climate': {'hiver': 'froid', 'printemps': 'tempéré', 'été': 'tempéré', 'automne': 'froid'}
    },
    
    # Europe de l'Ouest (France nord, UK, Benelux)
    'western_europe': {
        'countries': ['United Kingdom', 'Ireland', 'Netherlands', 'Belgium', 'Luxembourg'],
        'northern_cities': ['Edinburgh', 'Glasgow', 'Aberdeen', 'Newcastle', 'Belfast'],
        'northern_climate': {'hiver': 'froid', 'printemps': 'froid', 'été': 'tempéré', 'automne': 'froid'},
        'default_climate': {'hiver': 'froid', 'printemps': 'tempéré', 'été': 'tempéré', 'automne': 'froid'}
    },
    
    # France (climat océanique/continental)
    'france': {
        'countries': ['France'],
        'northern_cities': ['Lille', 'Strasbourg', 'Nancy', 'Reims', 'Metz'],
        'northern_climate': {'hiver': 'froid', 'printemps': 'froid', 'été': 'tempéré', 'automne': 'froid'},
        'southern_cities': ['Marseille', 'Nice', 'Montpellier', 'Toulouse', 'Bordeaux', 'Nantes', 'Brest'],
        'southern_climate': {'hiver': 'tempéré', 'printemps': 'tempéré', 'été': 'chaud', 'automne': 'tempéré'},
        'default_climate': {'hiver': 'froid', 'printemps': 'tempéré', 'été': 'tempéré', 'automne': 'tempéré'}
    },
    
    # Europe du Sud (Méditerranée)
    'southern_europe': {
        'countries': ['Spain', 'Italy', 'Portugal', 'Greece', 'Croatia', 'Slovenia', 'Malta', 'Cyprus'],
        'climate': {'hiver': 'tempéré', 'printemps': 'tempéré', 'été': 'chaud', 'automne': 'tempéré'}
    },
    
    # Europe du Sud-Est (Balkans)
    'southeastern_europe': {
        'countries': ['Romania', 'Bulgaria', 'Serbia', 'Bosnia and Herzegovina', 'Montenegro', 'Albania', 'North Macedonia'],
        'climate': {'hiver': 'froid', 'printemps': 'tempéré', 'été': 'chaud', 'automne': 'tempéré'}
    },
    
    # Afrique du Nord
    'north_africa': {
        'countries': ['Morocco', 'Algeria', 'Tunisia', 'Libya', 'Egypt'],
        'climate': {'hiver': 'tempéré', 'printemps': 'chaud', 'été': 'chaud', 'automne': 'chaud'}
    },
    
    # Afrique Subsaharienne
    'sub_saharan_africa': {
        'countries': ['Senegal', 'Mali', 'Burkina Faso', 'Niger', 'Nigeria', 'Ghana', 'Ivory Coast', 'Cameroon', 'Kenya', 'Tanzania', 'Uganda', 'Ethiopia'],
        'climate': {'hiver': 'chaud', 'printemps': 'chaud', 'été': 'chaud', 'automne': 'chaud'}
    },
    
    # Afrique Australe (Hémisphère Sud)
    'southern_africa': {
        'countries': ['South Africa', 'Namibia', 'Botswana', 'Zimbabwe', 'Mozambique'],
        'climate': {'hiver': 'tempéré', 'printemps': 'tempéré', 'été': 'chaud', 'automne': 'tempéré'},
        'hemisphere': 'south'
    },
    
    # Moyen-Orient
    'middle_east': {
        'countries': ['Turkey', 'Israel', 'Jordan', 'Lebanon', 'Syria', 'Iraq', 'Iran', 'Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Oman', 'Yemen'],
        'coastal_cities': ['Istanbul', 'Antalya', 'Tel Aviv', 'Beirut', 'Dubai'],
        'coastal_climate': {'hiver': 'tempéré', 'printemps': 'tempéré', 'été': 'chaud', 'automne': 'tempéré'},
        'default_climate': {'hiver': 'tempéré', 'printemps': 'chaud', 'été': 'chaud', 'automne': 'chaud'}
    },
    
    # Asie du Sud (Tropical)
    'south_asia': {
        'countries': ['India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Bhutan', 'Maldives'],
        'climate': {'hiver': 'chaud', 'printemps': 'chaud', 'été': 'chaud', 'automne': 'chaud'}
    },
    
    # Asie du Sud-Est (Tropical)
    'southeast_asia': {
        'countries': ['Thailand', 'Vietnam', 'Cambodia', 'Laos', 'Myanmar', 'Malaysia', 'Singapore', 'Indonesia', 'Philippines', 'Brunei'],
        'climate': {'hiver': 'chaud', 'printemps': 'chaud', 'été': 'chaud', 'automne': 'chaud'}
    },
    
    # Asie de l'Est
    'east_asia': {
        'countries': ['China', 'Japan', 'South Korea', 'Taiwan', 'Mongolia'],
        'northern_cities': ['Beijing', 'Seoul', 'Sapporo', 'Harbin'],
        'northern_climate': {'hiver': 'froid', 'printemps': 'tempéré', 'été': 'chaud', 'automne': 'tempéré'},
        'southern_cities': ['Hong Kong', 'Guangzhou', 'Taipei', 'Okinawa'],
        'southern_climate': {'hiver': 'tempéré', 'printemps': 'chaud', 'été': 'chaud', 'automne': 'chaud'},
        'default_climate': {'hiver': 'froid', 'printemps': 'tempéré', 'été': 'chaud', 'automne': 'tempéré'}
    },
    
    # Amérique du Nord
    'north_america': {
        'countries': ['United States', 'Canada'],
        'very_cold_cities': ['Edmonton', 'Winnipeg', 'Quebec City', 'Halifax'],
        'very_cold_climate': {'hiver': 'froid', 'printemps': 'froid', 'été': 'froid', 'automne': 'froid'},
        'cold_cities': ['Montreal', 'Ottawa', 'Calgary', 'Minneapolis', 'Chicago', 'Boston'],
        'cold_climate': {'hiver': 'froid', 'printemps': 'tempéré', 'été': 'tempéré', 'automne': 'froid'},
        'northern_cities': ['Toronto', 'New York', 'Detroit', 'Milwaukee'],
        'northern_climate': {'hiver': 'froid', 'printemps': 'tempéré', 'été': 'tempéré', 'automne': 'froid'},
        'southern_cities': ['Miami', 'Los Angeles', 'San Diego', 'Phoenix', 'Houston', 'New Orleans', 'Tampa', 'Las Vegas', 'Orlando', 'Dallas'],
        'southern_climate': {'hiver': 'tempéré', 'printemps': 'chaud', 'été': 'chaud', 'automne': 'chaud'},
        'moderate_cities': ['Seattle', 'Portland', 'San Francisco', 'Vancouver', 'Victoria'],
        'moderate_climate': {'hiver': 'tempéré', 'printemps': 'tempéré', 'été': 'tempéré', 'automne': 'tempéré'},
        'default_climate': {'hiver': 'froid', 'printemps': 'tempéré', 'été': 'tempéré', 'automne': 'tempéré'}
    },
    
    # Amérique Centrale & Caraïbes
    'central_america': {
        'countries': ['Mexico', 'Guatemala', 'Belize', 'Honduras', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama', 'Cuba', 'Jamaica', 'Dominican Republic', 'Haiti', 'Puerto Rico'],
        'climate': {'hiver': 'chaud', 'printemps': 'chaud', 'été': 'chaud', 'automne': 'chaud'}
    },
    
    # Amérique du Sud (Hémisphère Sud)
    'south_america': {
        'countries': ['Brazil', 'Argentina', 'Chile', 'Uruguay', 'Paraguay', 'Colombia', 'Venezuela', 'Ecuador', 'Peru', 'Bolivia'],
        'tropical_cities': ['Manaus', 'Belém', 'Fortaleza', 'Recife', 'Salvador', 'Bogota', 'Caracas', 'Guayaquil'],
        'tropical_climate': {'hiver': 'chaud', 'printemps': 'chaud', 'été': 'chaud', 'automne': 'chaud'},
        'southern_cities': ['Buenos Aires', 'Montevideo', 'Santiago', 'São Paulo', 'Rio de Janeiro'],
        'southern_climate': {'hiver': 'tempéré', 'printemps': 'tempéré', 'été': 'chaud', 'automne': 'tempéré'},
        'default_climate': {'hiver': 'tempéré', 'printemps': 'tempéré', 'été': 'chaud', 'automne': 'tempéré'},
        'hemisphere': 'south'
    },
    
    # Océanie (Hémisphère Sud)
    'oceania': {
        'countries': ['Australia', 'New Zealand', 'Fiji', 'Papua New Guinea', 'Samoa', 'Tonga', 'Vanuatu'],
        'northern_australia': ['Darwin', 'Cairns', 'Brisbane'],
        'northern_climate': {'hiver': 'chaud', 'printemps': 'chaud', 'été': 'chaud', 'automne': 'chaud'},
        'southern_australia': ['Sydney', 'Melbourne', 'Adelaide', 'Perth', 'Auckland', 'Wellington'],
        'southern_climate': {'hiver': 'tempéré', 'printemps': 'tempéré', 'été': 'chaud', 'automne': 'tempéré'},
        'default_climate': {'hiver': 'tempéré', 'printemps': 'tempéré', 'été': 'chaud', 'automne': 'tempéré'},
        'hemisphere': 'south'
    }
}

def get_city_climate(city_name, country):
    """Détermine le climat saisonnier d'une ville"""
    
    # Parcourir les règles climatiques
    for region, rules in climate_rules.items():
        # Vérifier si le pays correspond
        if 'countries' in rules and country in rules['countries']:
            
            # Cas spéciaux avec sous-catégories de villes
            if 'very_cold_cities' in rules and city_name in rules['very_cold_cities']:
                climate = rules['very_cold_climate']
            elif 'cold_cities' in rules and city_name in rules['cold_cities']:
                climate = rules['cold_climate']
            elif 'mountain_cities' in rules and city_name in rules['mountain_cities']:
                climate = rules['mountain_climate']
            elif 'northern_cities' in rules and city_name in rules['northern_cities']:
                climate = rules['northern_climate']
            elif 'southern_cities' in rules and city_name in rules['southern_cities']:
                climate = rules['southern_climate']
            elif 'coastal_cities' in rules and city_name in rules['coastal_cities']:
                climate = rules['coastal_climate']
            elif 'moderate_cities' in rules and city_name in rules['moderate_cities']:
                climate = rules['moderate_climate']
            elif 'tropical_cities' in rules and city_name in rules['tropical_cities']:
                climate = rules['tropical_climate']
            elif 'northern_australia' in rules and city_name in rules['northern_australia']:
                climate = rules['northern_climate']
            elif 'southern_australia' in rules and city_name in rules['southern_australia']:
                climate = rules['southern_climate']
            elif 'default_climate' in rules:
                climate = rules['default_climate']
            else:
                climate = rules['climate']
            
            # Inverser les saisons pour l'hémisphère sud
            if rules.get('hemisphere') == 'south':
                climate = {
                    'hiver': climate['été'],
                    'printemps': climate['automne'],
                    'été': climate['hiver'],
                    'automne': climate['printemps']
                }
            
            return climate
    
    # Climat par défaut si non trouvé
    return {'hiver': 'tempéré', 'printemps': 'tempéré', 'été': 'tempéré', 'automne': 'tempéré'}

# Générer les données climatiques pour toutes les villes
city_climate_data = {}

for city in cities_data:
    city_name = city.get('city', '')
    country = city.get('country', '')
    
    if city_name:
        climate = get_city_climate(city_name, country)
        city_climate_data[city_name] = climate

# Sauvegarder dans un fichier JSON
output_file = 'city_seasonal_climate.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(city_climate_data, f, ensure_ascii=False, indent=2)

print(f"✅ Données climatiques générées pour {len(city_climate_data)} villes")
print(f"📁 Fichier sauvegardé : {output_file}")

# Afficher quelques exemples
print("\n🌡️ Exemples de climats générés :")
for city_name in list(city_climate_data.keys())[:10]:
    print(f"  {city_name}: {city_climate_data[city_name]}")

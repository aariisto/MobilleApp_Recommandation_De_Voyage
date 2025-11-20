import psycopg2
import json
import logging
import numpy as np
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer

# Configuration du logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def get_all_city_embeddings(conn_params: dict) -> List[Dict[str, Any]]:
    """
    Récupère tous les embeddings des villes stockés dans la base de données PostgreSQL.
    
    Args:
        conn_params: Dictionnaire contenant les paramètres de connexion :
                    {"host": str, "dbname": str, "user": str, "password": str, "port": int (optionnel)}
    
    Returns:
        Une liste de dictionnaires contenant id, name et embedding :
        [{"id": 1, "name": "Paris", "embedding": [0.1, 0.2, ...]}, ...]
    
    Raises:
        psycopg2.Error: En cas d'erreur de connexion ou de requête SQL
        Exception: En cas d'autre erreur
    """
    conn = None
    cursor = None
    
    try:
        # Ajout du port par défaut s'il n'est pas fourni
        if 'port' not in conn_params:
            conn_params['port'] = 5432
        
        logger.info(f"Connexion à PostgreSQL : {conn_params['host']}:{conn_params['port']}/{conn_params['dbname']}")
        
        # Connexion à la base de données
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()
        
        # Requête SQL
        query = """
            SELECT id, name, embedding 
            FROM cities 
            WHERE embedding IS NOT NULL
            ORDER BY id;
        """
        
        logger.info("Exécution de la requête SQL...")
        cursor.execute(query)
        
        # Récupération de tous les résultats
        results = cursor.fetchall()
        logger.info(f"{len(results)} villes trouvées avec embeddings")
        
        # Construction de la liste de dictionnaires
        cities = []
        for row in results:
            city_id, name, embedding = row
            
            # Conversion de l'embedding float8[] en liste Python
            if embedding is not None:
                # PostgreSQL retourne les arrays comme des listes Python
                if isinstance(embedding, list):
                    embedding_list = embedding
                else:
                    # En cas de chaîne, la parser
                    embedding_list = list(embedding) if embedding else []
            else:
                embedding_list = []
            
            city_dict = {
                "id": city_id,
                "name": name,
                "embedding": embedding_list
            }
            cities.append(city_dict)
        
        logger.info(f"✓ {len(cities)} embeddings récupérés avec succès")
        
        return cities
        
    except psycopg2.Error as e:
        logger.error(f"Erreur PostgreSQL: {e}")
        raise
    except Exception as e:
        logger.error(f"Erreur inattendue: {e}")
        raise
    finally:
        # Fermeture propre du curseur et de la connexion
        if cursor is not None:
            cursor.close()
            logger.debug("Curseur fermé")
        if conn is not None:
            conn.close()
            logger.debug("Connexion fermée")


def save_embeddings_to_json(cities: List[Dict[str, Any]], filename: str = "cities_embeddings.json"):
    """
    Sauvegarde la liste des embeddings dans un fichier JSON au dossier /algorithme.
    
    Args:
        cities: Liste de dictionnaires contenant les embeddings
        filename: Nom du fichier de sortie
    """
    try:
        # Chemin du dossier algorithme
        import os
        algorithme_dir = os.path.dirname(os.path.abspath(__file__))
        filepath = os.path.join(algorithme_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(cities, f, ensure_ascii=False, indent=2)
        logger.info(f"✓ Embeddings sauvegardés dans '{filepath}'")
    except IOError as e:
        logger.error(f"Erreur lors de l'écriture du fichier: {e}")
        raise


def get_user_embedding(likes_text: str, dislikes_text: str = "") -> List[float]:
    """
    Génère un embedding pour un utilisateur en tenant compte de ses préférences (likes) et aversions (dislikes).
    
    La logique fonctionne ainsi :
    - On calcule un vecteur pour ce que l'utilisateur AIME
    - On calcule un vecteur pour ce que l'utilisateur N'AIME PAS
    - Le vecteur final = embedding_likes - embedding_dislikes
    
    Cela permet de "repousser" les résultats qui contiendraient les dislikes.
    
    Exemple :
        - likes_text = "plage restaurant"
        - dislikes_text = "montagne froid"
        - final = embedding(plage restaurant) - embedding(montagne froid)
        → Le système recommandera des destinations avec plage/restaurant
          ET évitera montagne/froid
    
    Args:
        likes_text: Le texte représentant ce que l'utilisateur AIME (obligatoire)
                   (ex: "plage restaurant shopping")
        dislikes_text: Le texte représentant ce que l'utilisateur N'AIME PAS (optionnel)
                      (ex: "montagne froid humidité")
    
    Returns:
        Une liste de floats représentant le vecteur d'embedding final (likes - dislikes)
    """
    try:
        logger.info("Chargement du modèle sentence-transformers...")
        # Chargement du modèle "all-MiniLM-L6-v2"
        model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Génération de l'embedding pour les préférences (likes)
        logger.info(f"Génération de l'embedding pour les préférences (likes): '{likes_text}'")
        embedding_likes = model.encode(likes_text)
        
        # Si dislikes_text est fourni, générer son embedding
        if dislikes_text and dislikes_text.strip():
            logger.info(f"Génération de l'embedding pour les aversions (dislikes): '{dislikes_text}'")
            embedding_dislikes = model.encode(dislikes_text)
            
            # Calcul du vecteur final : likes - dislikes
            # Cette soustraction "repousse" les résultats qui correspondent aux dislikes
            embedding_final = embedding_likes - embedding_dislikes
            logger.info("Calcul du vecteur final : embedding_likes - embedding_dislikes")
        else:
            # Si pas de dislikes, on utilise juste le embedding des likes
            logger.info("Pas de dislikes fourni, utilisation directe de l'embedding des likes")
            embedding_final = embedding_likes
        
        # Conversion en liste Python
        return embedding_final.tolist()
    
    except Exception as e:
        logger.error(f"Erreur lors de la génération de l'embedding utilisateur: {e}")
        raise


def cosine_similarity(vec1: list, vec2: list) -> float:
    """
    Calcule la similarité cosinus entre deux vecteurs.
    
    Args:
        vec1: Premier vecteur (liste de floats)
        vec2: Deuxième vecteur (liste de floats)
    
    Returns:
        Un float entre -1 et 1 représentant la similarité cosinus
        - 1.0 : vecteurs identiques
        - 0.0 : vecteurs orthogonaux
        - -1.0 : vecteurs opposés
    """
    try:
        # Conversion en arrays numpy
        v1 = np.array(vec1)
        v2 = np.array(vec2)
        
        # Calcul du produit scalaire
        dot_product = np.dot(v1, v2)
        
        # Calcul des normes
        norm_v1 = np.linalg.norm(v1)
        norm_v2 = np.linalg.norm(v2)
        
        # Vérification pour éviter la division par zéro
        if norm_v1 == 0 or norm_v2 == 0:
            logger.warning("Un des vecteurs a une norme nulle")
            return 0.0
        
        # Calcul de la similarité cosinus
        similarity = dot_product / (norm_v1 * norm_v2)
        
        return float(similarity)
    
    except Exception as e:
        logger.error(f"Erreur lors du calcul de la similarité cosinus: {e}")
        raise


def load_embeddings_from_json(filename: str = "cities_embeddings.json") -> List[Dict[str, Any]]:
    """
    Charge les embeddings des villes depuis un fichier JSON.
    
    Args:
        filename: Nom du fichier JSON à charger
    
    Returns:
        Liste de dictionnaires contenant id, name et embedding
    """
    try:
        import os
        algorithme_dir = os.path.dirname(os.path.abspath(__file__))
        filepath = os.path.join(algorithme_dir, filename)
        
        logger.info(f"Chargement des embeddings depuis '{filepath}'...")
        with open(filepath, 'r', encoding='utf-8') as f:
            cities = json.load(f)
        
        logger.info(f"✓ {len(cities)} villes chargées avec succès")
        return cities
    
    except IOError as e:
        logger.error(f"Erreur lors de la lecture du fichier: {e}")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Erreur de décodage JSON: {e}")
        raise


def rank_cities_by_similarity(user_text: str, cities: List[Dict[str, Any]], dislikes_text: str = "", output_filename: str = "ranked_cities.json") -> List[Dict[str, Any]]:
    """
    Classe les villes par similarité avec le texte utilisateur (likes et dislikes).
    
    Args:
        user_text: Texte utilisateur (ex: "plage restaurant shopping")
        cities: Liste des villes avec leurs embeddings
        dislikes_text: Texte des préférences à ÉVITER (optionnel)
        output_filename: Nom du fichier de sortie pour les résultats
    
    Returns:
        Liste des villes triées par similarité décroissante
    """
    try:
        logger.info(f"Calcul de la similarité pour: '{user_text}'")
        
        # Génération de l'embedding utilisateur (avec likes et optionnellement dislikes)
        user_embedding = get_user_embedding(user_text, dislikes_text)
        logger.info(f"✓ Embedding utilisateur généré (dimension: {len(user_embedding)})")
        
        # Calcul de la similarité pour chaque ville
        ranked_cities = []
        for city in cities:
            city_id = city["id"]
            city_name = city["name"]
            city_embedding = city["embedding"]
            
            # Calcul de la similarité
            similarity = cosine_similarity(user_embedding, city_embedding)
            
            ranked_cities.append({
                "id": city_id,
                "name": city_name,
                "similarity": similarity
            })
        
        # Tri par similarité décroissante
        ranked_cities.sort(key=lambda x: x["similarity"], reverse=True)
        
        logger.info(f"✓ {len(ranked_cities)} villes classées par similarité")
        
        # Sauvegarde dans un fichier JSON
        import os
        algorithme_dir = os.path.dirname(os.path.abspath(__file__))
        output_filepath = os.path.join(algorithme_dir, output_filename)
        
        with open(output_filepath, 'w', encoding='utf-8') as f:
            json.dump(ranked_cities, f, ensure_ascii=False, indent=2)
        
        logger.info(f"✓ Résultats sauvegardés dans '{output_filepath}'")
        
        return ranked_cities
    
    except Exception as e:
        logger.error(f"Erreur lors du classement des villes: {e}")
        raise


# Exemple d'utilisation
if __name__ == "__main__":
    
    """
    try:
        # Chargement des embeddings depuis le fichier JSON
        cities = load_embeddings_from_json("cities_embeddings.json")
        print(f"✓ {len(cities)} villes chargées")
        
        # Classement des villes par similarité
        dislikes_text = "adult"
        user_text = "accommodation.hotel activity.sport_club building.tourism catering.restaurant.arab halal tourism.sights.archaeological_site vegan vegetarian beach catering no_fee.no internet_access.free wheelchair building catering.cafe.ice_cream catering.cafe.coffee_shop catering.bar catering.ice_cream catering.restaurant.pizza internet_access entertainment.museum accommodation.hotel catering.restaurant.sushi building.accommodation no_fee building.commercial catering.cafe.coffee commercial.shopping_mall wheelchair.yes internet_access.for_customers commercial building.tourism catering.restaurant.argentinian entertainment building.catering"
        ranked_cities = rank_cities_by_similarity(user_text, cities,dislikes_text)
        
        # Affichage des top 10
        print(f"\nTop 10 villes les plus similaires à '{user_text}':")
        for i, city in enumerate(ranked_cities[:10], 1):
            print(f"  {i}. {city['name']} (ID: {city['id']}) - Similarité: {city['similarity']:.4f}")
    
    except Exception as e:
        print(f"Erreur lors du traitement: {e}")
    *
    # Paramètres de connexion
    conn_params = {
        "host": "localhost",
        "dbname": "cities",
        "user": "postgres",
        "password": "postgres",
        "port": 5432
    }
    
    try:
        # Récupération de tous les embeddings
        cities = get_all_city_embeddings(conn_params)
        print(f"\n{len(cities)} embeddings chargés avec succès")
        
        # Sauvegarde dans un fichier JSON
        save_embeddings_to_json(cities)
        
        # Affichage d'un exemple
        if cities:
            print(f"\nExemple (première ville):")
            print(f"  ID: {cities[0]['id']}")
            print(f"  Nom: {cities[0]['name']}")
            print(f"  Dimension embedding: {len(cities[0]['embedding'])}")
            print(f"  Premiers éléments: {cities[0]['embedding'][:5]}")
    
    except Exception as e:
        print(f"Erreur lors du traitement: {e}")
"""
    print(cosine_similarity([
    0.059121512802643064,
    -0.04477230083019289,
    -0.008754708303524858,
    0.07004484859580712,
    -0.04046078317945797,
    0.07305277136938135,
    0.03837402532820125,
    -0.06924532951758458,
    -0.023076362260188048,
    -0.0725602990286525,
    0.06068441478700671,
    -0.14821762343330058,
    0.012990456086506001,
    0.03755500375169033,
    0.0663827804965177,
    -0.1631489346032799,
    0.0789326559087001,
    -0.015763816609202175,
    0.047512388101790565,
    -0.00177098473591289,
    -0.014135663322355678,
    0.01796431659099089,
    0.013024022140580783,
    0.005727625735083937,
    -0.02223856799032921,
    0.00019615664031929909,
    0.03956266004379445,
    0.04476176004792248,
    0.03841763067193846,
    -0.046221029666742165,
    -0.017170004139101438,
    0.03842341895424048,
    0.06188415665523767,
    0.02035113821040906,
    0.04602188374498715,
    0.023568129994390157,
    -0.00858323322457425,
    -0.05578902534124268,
    0.022241545352351733,
    0.0277316859735388,
    -0.010084899122191689,
    -0.038582263013390614,
    0.0064018740065514435,
    -0.02868965437088451,
    0.06398282942103092,
    -0.00027823732224587427,
    -0.09300198828510894,
    -0.030217033725439102,
    -0.008860164322117064,
    0.022309478124761025,
    -0.043276437613859534,
    0.021478770384672965,
    -0.07907337247517943,
    -0.031075544030647155,
    0.03968767926913731,
    -0.07475048761911965,
    -0.056315153837194605,
    -0.03971815669668296,
    -0.03862629522852735,
    0.054461823866449564,
    0.0406238699947875,
    -0.057093537935171836,
    -0.019649914999587886,
    0.06644323557292398,
    -0.10749787879557374,
    0.007567043658958687,
    -0.07833583127361665,
    0.10483029331840385,
    -0.013082562899287617,
    -0.1108284104890314,
    -0.048336292900797065,
    0.009526386966714996,
    0.012271285653992414,
    0.015689736413486595,
    0.002902697105915021,
    -0.007125659668321527,
    0.0024042444025395428,
    -0.007272794141061267,
    0.042496326349828265,
    -0.039914670616573805,
    -0.04664023793878455,
    -0.01960039064946051,
    -0.021468442531574088,
    -0.01510489546058613,
    -0.06439377461450978,
    -0.022708509063985135,
    -0.03169109488960095,
    -0.020200014855937438,
    -0.009495070469299063,
    0.006643840595032498,
    0.022668145789710055,
    -0.014373829475558172,
    -0.030954085639070688,
    0.0205383474884249,
    -0.043456548981999576,
    0.01435327527793035,
    -0.06413049709239237,
    -0.08546619691545432,
    0.02510580424102621,
    -0.0105902090486804,
    0.004237708186164494,
    0.06618535561252754,
    0.048067709135647875,
    0.049387947166250175,
    -0.11757570167933713,
    0.006627716570200727,
    0.02632986557864587,
    0.13118566823013356,
    0.09931463337717569,
    -0.022252111746687578,
    -0.12035652154126587,
    0.09767488750257476,
    0.023925157080735296,
    -0.10241738994763423,
    -0.06336024850903353,
    0.06546801692346536,
    -0.010543650209844147,
    -0.11081810661602488,
    0.15160710469277225,
    0.0044626090689527135,
    -0.033017591223242,
    0.016785673841742964,
    0.020480261642021023,
    -0.04809187147826188,
    -0.061106640762260016,
    -0.08889704512903972,
    -0.0009514621850293517,
    1.7781020624554794e-33,
    -0.008439353014656542,
    -0.01982952210599489,
    -0.0006202930028002783,
    -0.02660255480818975,
    0.10175628359876146,
    0.0012415346994191412,
    -0.0821373759816871,
    -0.0011977918750222807,
    -0.033725859464420756,
    0.007477888127849196,
    0.07033376491306854,
    0.03618111032806094,
    -0.034409950202259905,
    0.05994549662317569,
    0.08354354074981539,
    0.030522502645440257,
    0.03003575259707728,
    0.12372947596615823,
    0.06568578610727646,
    -0.04554414175724373,
    -0.025873447839441188,
    -0.0138339970167191,
    0.08378505733830272,
    0.08589981470596811,
    0.010774072977766546,
    -0.026153353988800723,
    0.007537920628589984,
    0.008864270382014133,
    0.0019563871715300935,
    0.013699819845228426,
    0.05676315101672544,
    -0.07491175289024422,
    -0.05042923729900757,
    -0.0301629003742452,
    0.009134765786272788,
    0.05251671449684063,
    -0.008741003710013961,
    -0.039258367998824574,
    -0.04523030523123206,
    -0.012545689945204578,
    -0.13417249663313424,
    0.0032386689125541756,
    -0.06628118748544048,
    0.07546205922279854,
    -0.05053085704915604,
    0.027861846924041127,
    0.049304849157100254,
    -0.05232556626875729,
    0.0417345679507512,
    0.0985807204911933,
    -0.0073466289897984515,
    -0.033347535235431346,
    -0.10283638619429507,
    -0.013490677937682221,
    -0.010664030058036053,
    0.006322989250847948,
    0.007554852493758264,
    0.04025146035470013,
    0.01787565531124294,
    -0.06780274148357274,
    0.05103645045662843,
    -0.004548204685305045,
    -0.047193614363149276,
    -0.04526347871890258,
    0.04710554799105417,
    -0.008528008404160167,
    0.011676918401994224,
    -0.06603557527200594,
    0.07579720836163839,
    0.028737686510692972,
    0.02956525901584978,
    0.04947656323308519,
    0.05732613275859212,
    0.02364332134134281,
    -0.02583680985787896,
    0.04224425544251327,
    -0.09387254984445884,
    -0.009510277551983755,
    0.024812136489144692,
    0.09297006971371932,
    0.0028062226071117664,
    0.032568495769530026,
    0.021913727913483488,
    0.029804190110974266,
    -0.052710469508082065,
    -0.0012767212582825106,
    0.09716291022535384,
    -0.11755903800877048,
    0.00841762795399586,
    0.0471143288835175,
    -0.09173746914052924,
    0.10721920249676212,
    -0.008885450280152848,
    0.012774404712415425,
    -0.024999401837260272,
    -2.7575979131358584e-33,
    -0.0006817064306219729,
    -0.014362916562839171,
    -0.04107495004718626,
    -0.06629374060681825,
    -0.011287237105268874,
    -0.021057841677392376,
    -0.06076197976115754,
    -0.07479982274309925,
    0.03648220439728057,
    -0.026982051016291177,
    -0.07705371910013771,
    -0.009751969166657916,
    0.056022972487337536,
    -0.020437281146125835,
    -0.10067796480054311,
    0.025679709026176535,
    0.03176493435250594,
    -0.007458353542675323,
    -0.04790177772956971,
    0.09402969324950797,
    -0.054987964809415736,
    0.10239790940722765,
    -0.07403532435096327,
    0.017659631124996692,
    0.006816644448167963,
    0.09160894438704452,
    -0.07131085190400918,
    0.04879816264921507,
    -0.06765826987189558,
    0.017179731728928473,
    -0.055341679958182635,
    -0.016747259850444375,
    0.030703777149130838,
    0.01578203936586296,
    -0.016703821089716152,
    0.04103287587039382,
    0.07476196474341233,
    0.03947305587071762,
    -0.03819031612670984,
    0.015393803957488707,
    0.08027271289207948,
    -0.008747071911992534,
    0.01078401114597461,
    0.049351901193656886,
    0.008051153235743508,
    -0.010581566934026053,
    0.00396451130840683,
    -0.12786753874463994,
    -0.03189693678678686,
    -0.021777597747077534,
    0.04256288695052446,
    -0.06127976987832428,
    -0.07674660501702289,
    -0.05105320066001198,
    0.016329389499753072,
    0.09469052683643982,
    -0.0021094887778663357,
    -0.01605334398214282,
    0.014886857821494785,
    -0.013213607344293481,
    0.07381976322908068,
    0.0317509293635586,
    -0.03217705553751845,
    0.08761856020969525,
    0.07514445370216057,
    -0.000940749548422248,
    0.03890221291370909,
    -0.03972753046756431,
    -0.02580033040014156,
    -0.03657694565013005,
    -0.0548357980216147,
    0.01930884719113281,
    -0.08565089020530257,
    -0.008748445760165787,
    -0.057697862978078884,
    -0.019480619858932003,
    0.0535232773146735,
    0.051960571134300367,
    -0.050925277128222333,
    -0.041534454324369155,
    0.027309387567089706,
    -0.013392218097180046,
    0.03606682919997849,
    -0.01655452657454871,
    0.005046552397631434,
    -0.06799554232440297,
    0.01951009439804059,
    -0.010091355919518066,
    -0.02480426948600073,
    0.07027629147880933,
    -0.08159958087734774,
    0.031102950707661562,
    0.04396823225743471,
    0.0026777044533230964,
    0.05656472523607025,
    -4.3132980080085834e-8,
    -0.011908822710362713,
    -0.021332136505434078,
    -0.05630720165926013,
    0.05095493967749875,
    0.04453498381498733,
    -0.09109094522122763,
    -0.008373764560270225,
    0.003184806141873766,
    0.03499254740562527,
    0.03336221688053709,
    -0.04836824102096769,
    -0.022405282624857074,
    -0.04324068113502881,
    0.04221183822412728,
    0.04073597154515466,
    0.01584837571737918,
    -0.02361693716610056,
    0.010864852140247211,
    -0.027454228077268748,
    0.0697454293930162,
    -0.01882298005347812,
    0.07011942853898873,
    0.02868887637083639,
    -0.03549502452926852,
    0.01223424195346233,
    -0.00547509603962746,
    -0.007163759640213218,
    -0.004750128704466204,
    0.10809516094038073,
    -0.003765187628802714,
    0.0074765859241529955,
    0.01606376760010147,
    0.008543602638314036,
    -0.08090496289730759,
    0.005847426879843582,
    -0.0032182477070746545,
    -0.04303443130544813,
    -0.028312809811542772,
    -0.02583566337298067,
    0.021713472524756305,
    -0.07129969170561205,
    -0.04423765525167107,
    -0.04387795449234408,
    0.013463247902613988,
    0.03888202599509767,
    0.06937134104812441,
    -0.023010470268953673,
    0.021204791992388557,
    0.021478013753248072,
    0.04920603840023867,
    -0.07314734732388357,
    0.017668797134231046,
    0.053618915078787466,
    -0.06717828754334135,
    -0.004812841927438452,
    0.02841802906994181,
    0.0316964826345082,
    0.01497344940191056,
    0.09089183139572381,
    0.05727296493996351,
    0.042314381296415175,
    0.03528453767609682,
    -0.029192121306598203,
    -0.024029760926844022
],[0.06823402643203735, 0.00040539709152653813, 0.005606549326330423, 0.07303989678621292, -0.02343008480966091, 0.036112431436777115, 0.03665050491690636, -0.11640513688325882, -0.030778124928474426, -0.04825500026345253, 0.04981730133295059, -0.16583797335624695, -0.018319645896553993, 0.05829988047480583, 0.048835087567567825, -0.09311925619840622, 0.047295767813920975, 0.010779419913887978, 0.036991365253925323, 0.005133470986038446, -0.031987786293029785, -0.007210759911686182, 0.017581582069396973, -0.005511539056897163, -0.05937810242176056, -0.006009391043335199, 0.03349616378545761, 0.048927031457424164, 0.026509087532758713, -0.04810718074440956, -0.018393799662590027, 0.09229544550180435, 0.03571447357535362, 0.019057612866163254, 0.04191984236240387, 0.09604393690824509, -0.0029882066883146763, -0.07128815352916718, 0.03243914991617203, -0.004060829523950815, -0.028349870815873146, -0.03940315172076225, 0.0707961916923523, -0.037364326417446136, 0.06279619038105011, 0.04934719204902649, -0.07223290950059891, -0.06363698095083237, 0.04607914388179779, -0.00988657958805561, -0.04661983251571655, 0.022848181426525116, -0.032639868557453156, -0.0806131511926651, 0.002549112541601062, -0.044679515063762665, -0.06832032650709152, -0.05168655887246132, -0.03506862744688988, 0.011342433281242847, 0.08382189273834229, -0.04157835990190506, -0.04815301299095154, 0.054998528212308884, -0.07583771646022797, -0.04363637790083885, -0.09542099386453629, 0.07399081438779831, 0.012011339887976646, -0.09080673009157181, -0.0015904043102636933, -0.00909329578280449, 0.004732567351311445, 0.02253112755715847, -0.03177366033196449, -0.0378282256424427, -0.052274856716394424, 0.01686309278011322, 0.006464357953518629, -0.033731818199157715, -0.04659764841198921, -0.021188529208302498, -0.021683119237422943, -0.001698663574643433, -0.056890152394771576, -0.003310041269287467, -0.012345267459750175, -0.006956415716558695, -0.004424544982612133, 0.0016449320828542113, -0.0019601848907768726, -0.015512587502598763, -0.026531850919127464, -0.004325471818447113, -0.020932728424668312, -0.0015202771173790097, -0.05028736591339111, -0.002230947371572256, -0.029753196984529495, 0.030720554292201996, 0.015288329683244228, 0.09205950051546097, 0.04572984576225281, 0.03622565418481827, -0.1016315370798111, 0.05399169400334358, 0.008942917920649052, 0.1687117964029312, 0.1149551048874855, -0.02872328832745552, -0.11713044345378876, 0.0923856869339943, 0.013899631798267365, -0.06825894117355347, -0.0409204438328743, 0.05954815074801445, 0.005090849939733744, -0.1315564662218094, 0.11214631795883179, 0.00420497776940465, -0.018494976684451103, -0.012425967492163181, -0.03421333432197571, -0.021233897656202316, -0.05614592507481575, -0.07534366846084595, 0.00980892963707447, 1.5053165761569204e-33, 0.023984061554074287, -0.013506177812814713, 0.015814494341611862, 0.008170642890036106, 0.07370183616876602, 0.027765614911913872, -0.08825612813234329, -0.023047173395752907, -0.03310611471533775, 0.013681720942258835, 0.08671633899211884, 0.0046305605210363865, -0.04884973540902138, 0.023539206013083458, 0.06495670229196548, -0.006217959802597761, 0.0018450100906193256, 0.055175069719552994, 0.025809133425354958, -0.06238656863570213, -0.01052148174494505, -0.02823210507631302, 0.05476167052984238, 0.07286892831325531, -0.0035788603127002716, -0.02835112065076828, 0.01471626479178667, -0.005661020055413246, 0.02165927365422249, 0.015832604840397835, 0.02386280708014965, -0.0641457810997963, -0.037737227976322174, -0.0662289559841156, -0.032381944358348846, 0.0207806508988142, 0.012099099345505238, -0.0264140497893095, -0.03847302868962288, 0.005994666833430529, -0.10130851715803146, -0.010432973504066467, -0.05281011387705803, 0.07304327189922333, -0.07803741842508316, 0.04273788258433342, 0.09782584756612778, -0.04449337720870972, 0.006886190734803677, 0.09286797791719437, -0.0248944703489542, -0.020119555294513702, -0.10171137750148773, 0.011211782693862915, -0.007273854222148657, -0.02193618007004261, -0.012111121788620949, 0.06995757669210434, 0.037507545202970505, -0.069085031747818, 0.06347072124481201, 0.03323142230510712, -0.03900153562426567, -0.012808372266590595, 0.043131761252880096, -0.010745097883045673, 0.017204243689775467, -0.023890066891908646, 0.11036112159490585, -0.004023658111691475, 0.028719332069158554, 0.019664503633975983, 0.0646011084318161, 0.035647083073854446, 0.011043011210858822, 0.05413592979311943, -0.09108275920152664, -0.021566858515143394, 0.033911462873220444, 0.10102878510951996, -0.008941258303821087, 0.04616081342101097, -0.010590330697596073, 0.012491432949900627, 0.005445860791951418, -0.013611821457743645, 0.12861929833889008, -0.14521989226341248, -0.007503692992031574, 0.018764976412057877, -0.09455712884664536, 0.1097307950258255, -0.004125488456338644, -0.020508073270320892, -0.0662011057138443, -2.253148266063805e-33, -0.0007233491633087397, -0.04215320944786072, 0.0045712837018072605, -0.0551767572760582, 0.02905656024813652, -0.019611282274127007, -0.05357460677623749, -0.06558817625045776, 0.050524063408374786, -0.017962047830224037, -0.048897530883550644, -0.0010493193985894322, 0.059677816927433014, 0.01331540010869503, -0.08500046283006668, 0.0015148079255595803, 0.04063219577074051, 0.010142700746655464, -0.0673677921295166, 0.10029713809490204, -0.036971669644117355, 0.1886315941810608, -0.09350500255823135, 0.041687507182359695, -0.014997558668255806, 0.10396259278059006, -0.03670842573046684, 0.010654120706021786, -0.06636153161525726, 0.00819171778857708, -0.014322572387754917, -0.037088099867105484, -0.016140272840857506, 0.011848552152514458, -0.03621179983019829, -0.023096343502402306, 0.06707155704498291, 0.039596766233444214, -0.029035838320851326, 0.08453343063592911, 0.07057631760835648, -0.010406090877950191, -0.0010550860315561295, 0.04577000066637993, -0.012284545227885246, -0.059245094656944275, -0.008403192274272442, -0.12191764265298843, -0.010680010542273521, -0.042536988854408264, 0.05815357342362404, -0.029769273474812508, -0.06064750254154205, -0.06852765381336212, 0.05354410782456398, 0.04389815777540207, -0.008616196922957897, 0.0041518122889101505, -0.007348963525146246, -0.021994277834892273, 0.04120146483182907, 0.0832100659608841, -0.02013593167066574, 0.057959627360105515, 0.09116223454475403, 0.0006701993988826871, -0.005788667593151331, 0.011643493548035622, -0.042597632855176926, -0.029209446161985397, -0.0587262287735939, 0.022935383021831512, -0.06846366077661514, -0.002972652669996023, 0.002421471057459712, -0.018221048638224602, 0.10247431695461273, 0.03876860439777374, 0.026893751695752144, -0.07467972487211227, -0.0041681635193526745, -0.061291784048080444, 0.05709325149655342, -0.021379748359322548, 0.03947484493255615, -0.057839568704366684, -0.05818168446421623, -0.015234622173011303, 0.02259853482246399, 0.08287447690963745, -0.04011675715446472, -0.007331510540097952, 0.015687091276049614, 0.024545859545469284, 0.041672952473163605, -4.559913691082329e-08, -0.0139324264600873, -0.02253154292702675, -0.037850428372621536, 0.021399468183517456, 0.016711890697479248, -0.10755107551813126, 0.02770739607512951, -0.002732774242758751, 0.002239977242425084, 0.006560121662914753, -0.04628508538007736, 0.002995806746184826, -0.06598100066184998, 0.05284078046679497, 0.050105225294828415, -0.031316228210926056, 0.005402515642344952, 0.05536258593201637, -0.043717168271541595, 0.03666023910045624, -0.007543016690760851, 0.0491214245557785, 0.019710641354322433, -0.015166651457548141, -0.008230657316744328, -0.021702926605939865, -0.024367770180106163, -0.06421870738267899, 0.08102221041917801, -0.018189813941717148, 0.03147080913186073, 0.029803140088915825, 0.011995519511401653, -0.045371171087026596, 0.03810042515397072, -0.037408553063869476, -0.049681007862091064, -0.02810928039252758, -0.035045135766267776, 0.013319598510861397, -0.0777115747332573, -0.0033253999426960945, -0.010466505773365498, 0.039632685482501984, 0.02074308879673481, 0.07753361761569977, 0.0019088563276454806, 0.019690033048391342, -0.025591343641281128, 0.011227445676922798, -0.09608013927936554, 0.02221863344311714, 0.10038210451602936, -0.03946835547685623, 0.0026399672497063875, 0.005224448163062334, 0.03656857833266258, 0.03993207588791847, 0.08773013204336166, 0.03606817498803139, 0.10894488543272018, 0.012390553951263428, -0.022074103355407715, -0.041311077773571014]))


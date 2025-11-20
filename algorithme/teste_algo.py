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
    0.09399071993586766,
    -0.051307770363961974,
    0.005357995580508383,
    0.06597202291802964,
    -0.055503073489031364,
    0.08810760151846277,
    0.03302662445091581,
    -0.11859234326400685,
    -0.016997383947488287,
    -0.0536946956314209,
    0.04968421375466821,
    -0.1349542598250498,
    0.045114651461539854,
    0.06218091574636687,
    0.09804820236524181,
    -0.12549436169779182,
    0.03391436146484463,
    0.017070759292364207,
    0.08238293972596114,
    0.010962850746575591,
    -0.017312442850586078,
    -0.017220221614401444,
    0.040003389856584505,
    0.029171147965247814,
    -0.013586463687892314,
    0.015772430235100315,
    0.022938728856827285,
    0.056853519350126856,
    0.0186799912593473,
    -0.04837103596201596,
    -0.0025863649055416355,
    0.0765542724542022,
    0.05636501192963355,
    0.006212633042539673,
    0.05342390541142641,
    0.09074305014608705,
    0.023157756518780742,
    -0.07435945961065987,
    0.06438825348593319,
    0.04728992408004336,
    0.0013308231198966795,
    -0.014760229693736937,
    0.04134513063985157,
    -0.05020448517747739,
    0.03851740358889129,
    -0.012434827702813395,
    -0.09413178107217701,
    -0.055310117738323575,
    -0.05044285122188363,
    -0.0005093589351435187,
    -0.06329851684633866,
    0.03500979431099747,
    -0.027919326566197736,
    -0.01412335037152293,
    0.021587876797861033,
    -0.09022895899937033,
    -0.05718524043413003,
    -0.05514841192345295,
    0.008741281151981941,
    0.02610658340821382,
    0.028034083155101946,
    -0.03087045309918047,
    0.04369377802874041,
    0.10675701976901396,
    -0.12014253402638177,
    0.011751719724324872,
    -0.09639017443553387,
    0.07961693413652163,
    -0.014761664464489031,
    -0.10340030119914721,
    -0.0020526763293811016,
    -0.04556433226144906,
    0.08707862182482727,
    -0.014405501767104072,
    0.023158859699823307,
    0.015576297198520803,
    -0.04979585167902727,
    -0.06392498191157162,
    -0.01801723074756397,
    -0.06067585839911715,
    -0.038231736042853945,
    -0.01595083858216318,
    0.0014470582490485704,
    -0.01414730330276845,
    -0.06799189567668217,
    0.005587313896956526,
    -0.05223291996866845,
    -0.04010238987433438,
    -0.0788273876906249,
    0.06136398785600925,
    -0.005788179557171296,
    -0.032599926543445776,
    -0.013996810914674827,
    0.009668773544675107,
    0.04526286029960002,
    -0.0016356602877117313,
    -0.0963600177428583,
    -0.04858427065908133,
    0.04163242412703974,
    -0.03491045240198666,
    0.003535385753490377,
    0.1338221710425694,
    0.04188463325472159,
    0.02118083920915646,
    -0.0927023099689702,
    -0.039012994471613986,
    -0.019292460425671454,
    0.09242698626862673,
    0.01828308548474636,
    -0.04517979745203183,
    -0.07895624423803807,
    0.0799299908520836,
    0.031975211864304305,
    -0.07894583879126639,
    -0.013461632696420306,
    0.09537846361452718,
    0.021922995556413926,
    -0.07505332176873093,
    0.12215140498585074,
    -0.03390958660264898,
    -0.030006749421389027,
    0.03900048749845642,
    0.019232864490218535,
    -0.011706950865340118,
    -0.05801066049674367,
    -0.0886514484464032,
    -0.058971207846614866,
    1.3634302057237533e-34,
    -0.05905923351386654,
    -0.07547294065023753,
    -0.005015265012217666,
    0.021240399324538733,
    0.08772085796257284,
    0.005780462887171803,
    -0.06259597231197903,
    -0.008108105270494041,
    -0.004241585202036731,
    -0.031910942401660515,
    0.0821164854604829,
    0.048777961109103596,
    -0.010865857224682961,
    0.05810770377549621,
    0.039355604999702136,
    0.009447428058950073,
    0.036504327300044354,
    0.07714500601573605,
    -0.016049440498108535,
    -0.06388429425010335,
    -0.003912964477345087,
    0.015012555313268464,
    0.06452240282235298,
    0.02335429896320909,
    -0.01864122672962296,
    0.012594158323802784,
    0.01525841525827468,
    0.014112016172070056,
    -0.034195695823487075,
    0.01364548521617069,
    0.015159760966455776,
    -0.02263060358264315,
    0.0056437528240968525,
    -0.043089821752155325,
    0.00421448547311242,
    0.05233271715052787,
    0.035137928292197425,
    -0.028403555100569976,
    -0.03206342391558264,
    0.036149320769603324,
    -0.09388603130024681,
    0.023830265750133955,
    -0.0788778313362731,
    0.11379603393632635,
    -0.0319477455907835,
    0.06159661935815502,
    -0.0037736549977740756,
    -0.028677364330614154,
    0.061561875913278566,
    0.058005762590764995,
    0.019683542405517142,
    -0.031037234936419873,
    -0.0253626973681521,
    -0.01538102656969858,
    0.030747672323203242,
    -0.021264992129501305,
    0.016711712764746672,
    0.021995721142482674,
    -0.0017497007699520443,
    -0.09088665612779864,
    0.025451628689147205,
    0.007807428125027329,
    -0.053141720141704686,
    -0.010152224390735612,
    0.05120063993071408,
    0.007702623326033319,
    0.038481355716849734,
    -0.05872402980234183,
    0.041529295889773735,
    0.008553246404724183,
    0.03660678731343055,
    0.06367297071151966,
    0.0033899506180455766,
    0.017241316156213733,
    0.01713204561635342,
    0.026984509862469634,
    -0.08313744151108461,
    -0.038955669545430435,
    -0.0018178527304159892,
    0.07404387982299607,
    0.02695577901742298,
    0.031102088933286472,
    0.01090464412747063,
    0.05873558797365289,
    -0.017273638459356828,
    -0.008966632667259075,
    0.09955513828507645,
    -0.10087061134110269,
    0.015514776207390096,
    0.025693795072651775,
    -0.07476481775466846,
    0.030776271981475423,
    0.04801501095494718,
    0.01981495281897219,
    -0.046942953009358766,
    -1.1992835055578674e-33,
    0.009422242837794755,
    0.0018254070010400474,
    -0.034999260963682874,
    -0.07674367056523043,
    -0.05621958324933883,
    -0.023273614473308214,
    -0.027027780208661485,
    -0.10835010753029427,
    0.03145967340020576,
    0.0055599120737540135,
    -0.027907989422187533,
    -0.02710660319282528,
    0.0389630616571708,
    -0.006387910715868022,
    -0.10920401151746595,
    0.022414711774528175,
    0.09339091621245624,
    0.024558791641802948,
    -0.028949034372020455,
    0.09357569560787915,
    -0.05244504755617079,
    0.07871993868208296,
    -0.09016578168887684,
    0.015476252521338855,
    -0.03972451474148471,
    0.1297464219425618,
    -0.07354606351738531,
    0.02063699321385469,
    -0.05741133284871586,
    0.01127592475994546,
    -0.026013458058019422,
    0.0017135142859537296,
    0.055361800608548714,
    0.013438138129222035,
    0.01287882986892462,
    0.06081969296235623,
    0.06801534328053732,
    -0.04067536773024997,
    -0.05122886364761518,
    -0.029700756433436722,
    0.05780095707031908,
    -0.010441209924973192,
    -0.03645668898460737,
    0.08543723449995685,
    0.03074200387730966,
    0.007371303873490786,
    0.016880021725963257,
    -0.11641517577557081,
    -0.03745077386434965,
    -0.019548403652376253,
    -0.018389321356198845,
    -0.06737399161859846,
    -0.05902136352980706,
    -0.09459769175590206,
    0.06168502102396788,
    0.09642526888689454,
    -0.031634380585348336,
    -0.00712328372468182,
    -0.01865419746506067,
    -0.04322698650884575,
    0.05752523754844332,
    0.05949786246628269,
    0.0009529584704336376,
    0.02935013534601828,
    -0.0012531371351923325,
    -0.02272059385913079,
    0.019297577767159665,
    0.013652775731884746,
    0.002556330653953334,
    -0.07315999167250535,
    -0.041069379151638566,
    0.051744802794405145,
    -0.10921766494881349,
    -0.015737179695805813,
    -0.10931868546079922,
    0.037633232059951637,
    0.06671290587658643,
    0.009880810458361868,
    0.001236885991320647,
    -0.030555347751849763,
    0.024368935119802256,
    -0.012949033818509882,
    -0.003666854645296724,
    -0.053040186690178646,
    -0.0075756075727398476,
    0.030226106408910325,
    0.022644874750003714,
    -0.0016967253644381284,
    -0.028007361759268337,
    0.044740865160352826,
    -0.01693943785828451,
    0.022801867366079052,
    0.04127119657988675,
    -0.05768237294548761,
    0.06386910670145497,
    -4.06531431474087e-8,
    -0.049078435072782596,
    -0.05747915798751218,
    -0.0422569857735189,
    0.054847884026569774,
    -0.006589571637521463,
    -0.11431896234773965,
    -0.008663124684793215,
    -0.04052492530174786,
    0.0471051549704079,
    0.01447889680004109,
    -0.06701839251065925,
    -0.004913088378746817,
    -0.02956302738048947,
    0.025884504624698542,
    0.03620405427747399,
    0.010128559757754679,
    0.00781551823029806,
    0.028122218989563984,
    0.002193835498333145,
    0.06472071882586443,
    -0.012340329610404106,
    0.05814855245791167,
    0.053707828327776555,
    -0.043895198185173845,
    -0.042614379976282694,
    -0.015803451442768672,
    -0.042751004936078495,
    -0.0459593076030357,
    0.056037218015523325,
    -0.027796064290575167,
    0.025248207823322277,
    -0.02017337637401584,
    -0.034141331986605454,
    -0.05580896396444923,
    0.034372627733138525,
    -0.061648244486901385,
    -0.008193145749045748,
    -0.06961826563599992,
    -0.015716853929813576,
    0.022768432463122615,
    -0.03923034489765606,
    -0.0941663067224601,
    -0.029969417477461388,
    0.025360958284438916,
    0.015026771706436995,
    0.06606591837738013,
    0.0019477092864514372,
    0.04641855118721051,
    0.01629656464070528,
    0.03559674397778852,
    -0.09777739695100889,
    0.03396618203858366,
    0.03881081823886378,
    -0.12435119951741277,
    0.022118887325526974,
    -0.005589476382497923,
    0.012747485543037994,
    0.07842535993187215,
    0.07087979505579313,
    0.022997165211526782,
    0.04552082891102807,
    0.0615209962162279,
    0.008378269469975207,
    0.0007670815968483541
],[0.06145508587360382, 0.054708704352378845, 0.007868346758186817, 0.06346480548381805, -0.027123304083943367, 0.019526399672031403, 0.01845930889248848, -0.12458686530590057, -0.03433224558830261, -0.06896930187940598, 0.06766196340322495, -0.16204455494880676, 0.03555559739470482, 0.04423680156469345, 0.06709631532430649, -0.10814443975687027, 0.0099543621763587, 0.04658675566315651, 0.04567497596144676, -0.028650859370827675, -0.035756826400756836, -0.03267338126897812, 0.06133819371461868, -0.009185899049043655, -0.027283135801553726, 0.03532014042139053, 0.0008355022291652858, 0.031151778995990753, 0.03940696269273758, -0.04838653653860092, -0.04717413708567619, 0.09587571769952774, 0.04018617421388626, -0.00043971158447675407, 0.07472360879182816, 0.11478407680988312, 0.07776403427124023, -0.05461398884654045, 0.04616621136665344, 0.0022616744972765446, -0.00396782997995615, 0.0001049805068760179, 0.07559961825609207, -0.02875392884016037, 0.031203892081975937, 0.052541401237249374, -0.09571537375450134, -0.08133284747600555, 0.028464460745453835, -0.04313809797167778, -0.10411462932825089, 0.03830349072813988, 0.013118118047714233, -0.055925652384757996, -0.008644056506454945, -0.03937667980790138, -0.04269109293818474, -0.07061750441789627, 0.012214861810207367, 0.0037106534000486135, 0.07010393589735031, 0.01226240023970604, -0.019627543166279793, 0.09874037653207779, -0.09801977127790451, -0.04597940295934677, -0.0662589892745018, 0.06186791509389877, -0.004172589164227247, -0.07503347843885422, 0.01668938435614109, -0.026733504608273506, 0.027608586475253105, 0.018257396295666695, -0.07591048628091812, -0.042460910975933075, -0.05923883244395256, -0.032390985637903214, -0.03989230468869209, -0.04548623412847519, -0.036685336381196976, -0.044336576014757156, -0.021174218505620956, -0.001717770704999566, -0.034148503094911575, 0.0033787176944315434, 0.0019824316259473562, -0.02680610865354538, -0.022260047495365143, -0.0026346445083618164, -0.01123702060431242, -0.005635165609419346, -0.02811102755367756, 0.04048405587673187, 0.03035251423716545, -0.01461866870522499, -0.05079929158091545, 0.03753626346588135, -0.03077448159456253, 0.04334631189703941, 0.02445622719824314, 0.11979073286056519, 0.037417590618133545, 0.02942902036011219, -0.09829996526241302, 0.03272111341357231, -0.013565359637141228, 0.1523621827363968, 0.05934276059269905, -0.053825411945581436, -0.10588131844997406, 0.044965147972106934, 0.007858025841414928, -0.10124668478965759, -0.002325949491932988, 0.09109965711832047, 0.01016322709619999, -0.11352165788412094, 0.09061487019062042, -0.04292081668972969, -0.02692916803061962, -0.0214239414781332, -0.05507935583591461, 0.017746128141880035, -0.03713168948888779, -0.10204798728227615, -0.046273842453956604, -1.121333724114639e-33, 0.012637147679924965, -0.029632020741701126, -0.005289955995976925, 0.021086344495415688, 0.05859905108809471, 0.03128346428275108, -0.048312339931726456, 0.00739647401496768, -0.049604631960392, -0.0009919656440615654, 0.09463983029127121, 0.010582100600004196, -0.07654288411140442, 0.009699598886072636, 0.05355270951986313, -0.03772983327507973, 0.03265715390443802, 0.024756161496043205, 0.021386222913861275, -0.03471026569604874, -0.01367657445371151, -0.04450713098049164, 0.04892344027757645, 0.04768580570816994, 0.011774241924285889, 0.019568780437111855, 0.007725145202130079, 0.007750286720693111, -0.010598255321383476, 0.028177008032798767, 0.045582566410303116, -0.04435212165117264, -0.029767252504825592, -0.07700672745704651, -0.02752692438662052, 0.023786276578903198, -0.006620114203542471, -0.023879703134298325, -0.04170236736536026, 0.016848722472786903, -0.050569627434015274, 0.0021649023983627558, -0.034315530210733414, 0.09865108877420425, -0.055078327655792236, 0.062320053577423096, 0.03669741004705429, -0.03606127202510834, 0.042458631098270416, 0.030506769195199013, -0.018795114010572433, -0.021151578053832054, -0.08219701051712036, 0.0009612151188775897, 0.0198663379997015, -0.014314182102680206, -0.0319436751306057, 0.07664225995540619, 0.03228912129998207, -0.044279392808675766, 0.019176315516233444, 0.051353588700294495, -0.06753818690776825, 0.008514493703842163, 0.0221888218075037, -0.010098530910909176, -0.0016733333468437195, -0.003540156641975045, 0.08080632984638214, -0.009803714230656624, 0.0214131660759449, 0.034815095365047455, 0.04042055830359459, 0.04583759978413582, 0.010865590535104275, 0.05517690256237984, -0.09383785724639893, -0.06199798732995987, -0.002286638366058469, 0.08415558189153671, 0.03512462601065636, 0.03605646267533302, -0.00990804098546505, 0.0002192032552557066, 0.019170137122273445, 0.00783036183565855, 0.1297847479581833, -0.1168021708726883, 0.0062314597889781, 0.021923325955867767, -0.08720248192548752, 0.06304724514484406, 0.04997199773788452, -0.04543460160493851, -0.09901198744773865, -6.06275847718795e-35, 0.01922939158976078, -0.03660820424556732, -0.004042509477585554, -0.06757200509309769, -0.014368253760039806, -0.026583202183246613, -0.02461259439587593, -0.049045342952013016, 0.04939829185605049, 0.027777573093771935, -0.023390335962176323, -0.011635683476924896, 0.05108797177672386, -0.018680471926927567, -0.08122528344392776, 0.020207947120070457, 0.06407709419727325, 0.012427926994860172, -0.0747542753815651, 0.06459537893533707, -0.07349824160337448, 0.17317883670330048, -0.1079576313495636, 0.042694784700870514, -0.04066900536417961, 0.12451829761266708, -0.03317625820636749, -0.002878971630707383, -0.05845547839999199, 0.011277393437922001, -0.011539081111550331, -0.01864473894238472, -0.05126936733722687, 0.026167262345552444, -0.001177691388875246, -0.0069192019291222095, 0.06409486383199692, 0.030554689466953278, -0.006995926611125469, 0.026596838608384132, 0.058017078787088394, 0.016157381236553192, -0.023834897205233574, 0.08033815026283264, 0.002728230319917202, -0.03238861262798309, 0.0295607578009367, -0.11691508442163467, 0.0005119909183122218, -0.03449482098221779, 0.01822696253657341, -0.06822849065065384, -0.017850670963525772, -0.1228971928358078, 0.0818096175789833, 0.039882592856884, -0.04414216801524162, 0.008098685182631016, -0.013195439241826534, -0.0422932431101799, 0.05759506672620773, 0.08858627825975418, -0.014539986848831177, 0.07123436033725739, 0.05163590982556343, 0.006053152494132519, -0.013736063614487648, 0.07075921446084976, -0.03683096542954445, -0.03144640848040581, -0.05720854178071022, 0.05173379182815552, -0.09069991111755371, -0.0029880369547754526, -0.015170922502875328, 0.04361620545387268, 0.080128014087677, 0.046323321759700775, -0.0001811248657759279, -0.049805112183094025, 0.03083922155201435, -0.05342768877744675, -0.023412110283970833, -0.043776266276836395, 0.03539003059267998, -0.04124695807695389, -0.03757019713521004, 0.014415446668863297, 0.008081858046352863, 0.025960523635149002, -0.017345210537314415, -0.009752476587891579, 0.02716335840523243, 0.0003140943590551615, 0.07300561666488647, -4.3386872761175255e-08, -0.024389546364545822, -0.056744612753391266, -0.013802694156765938, 0.03827648237347603, 0.02939949743449688, -0.11373084038496017, 0.05546166002750397, -0.06749792397022247, 0.020962631329894066, -0.031784359365701675, -0.08917779475450516, 0.000803516071755439, -0.046496324241161346, 0.04494648426771164, 0.04704175144433975, -0.023837115615606308, -0.005411234684288502, 0.02075028419494629, -0.0005583963356912136, 0.03611331805586815, 0.016760515049099922, 0.05183134600520134, 0.0494699701666832, -0.02063460275530815, -0.038101375102996826, -0.010603995993733406, -0.026913709938526154, -0.05763893947005272, 0.060137789696455, -0.005322289653122425, 0.03984194993972778, -0.010462284088134766, -0.01914227567613125, -0.05646507814526558, 0.06543166935443878, -0.046467382460832596, -0.04892508313059807, -0.07232633978128433, -0.03755652904510498, -0.015084856189787388, -0.02000562474131584, -0.0515081025660038, 0.008068256080150604, 0.04993468523025513, 0.018438326194882393, 0.06910674273967743, 0.014736694283783436, 0.0206147450953722, -0.004046447109431028, 0.013207505457103252, -0.10210434347391129, 0.03178903087973595, 0.11023005098104477, -0.052166275680065155, 0.04057241976261139, -0.011222757399082184, 0.015123043209314346, 0.06181643530726433, 0.06332474201917648, 0.027011467143893242, 0.10289604961872101, 0.029668189585208893, -0.009335658513009548, -0.0020905407145619392]))


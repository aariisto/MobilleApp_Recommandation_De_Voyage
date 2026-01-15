import psycopg2
import json
import logging
import numpy as np
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer

# Build a MiniLM-friendly query from raw category tags
from user_query import generate_user_query
from user_query import generate_user_query_with_weights


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
    
    
    try:
        # Paramètres de connexion à PostgreSQL
        conn_params = {
            "host": "localhost",
            "dbname": "cities",
            "user": "postgres",
            "password": "postgres",
            "port": 5432
        }
        
        # Chargement des embeddings directement depuis la base de données
        cities = get_all_city_embeddings(conn_params)
        print(f"✓ {len(cities)} villes chargées depuis la base de données")
        
        # Classement des villes par similarité
        user_categories = [
      "building",
      "building.commercial",
      "building.entertainment",
      "building.historic",
      "building.place_of_worship",
      "building.public_and_civil",
      "building.tourism",
      "commercial",
      "commercial.shopping_mall",
      "education",
      "education.library",
      "entertainment",
      "entertainment.culture",
      "entertainment.culture.theatre",
      "entertainment.museum",
      "fee",
      "heritage",
      "internet_access",
      "leisure",
      "leisure.park",
      "no_fee",
      "no_fee.no",
      "religion",
      "religion.place_of_worship",
      "religion.place_of_worship.christianity",
      "tourism",
      "tourism.attraction",
      "tourism.sights",
      "tourism.sights.memorial",
      "tourism.sights.memorial.ship",
      "tourism.sights.place_of_worship",
      "wheelchair",
      "wheelchair.limited",
      "wheelchair.yes"
    ]

        
        print(cosine_similarity([
    0.06145508587360382,
    0.054708704352378845,
    0.007868346758186817,
    0.06346480548381805,
    -0.027123304083943367,
    0.019526399672031403,
    0.01845930889248848,
    -0.12458686530590057,
    -0.03433224558830261,
    -0.06896930187940598,
    0.06766196340322495,
    -0.16204455494880676,
    0.03555559739470482,
    0.04423680156469345,
    0.06709631532430649,
    -0.10814443975687027,
    0.0099543621763587,
    0.04658675566315651,
    0.04567497596144676,
    -0.028650859370827675,
    -0.035756826400756836,
    -0.03267338126897812,
    0.06133819371461868,
    -0.009185899049043655,
    -0.027283135801553726,
    0.03532014042139053,
    0.0008355022291652858,
    0.031151778995990753,
    0.03940696269273758,
    -0.04838653653860092,
    -0.04717413708567619,
    0.09587571769952774,
    0.04018617421388626,
    -0.00043971158447675407,
    0.07472360879182816,
    0.11478407680988312,
    0.07776403427124023,
    -0.05461398884654045,
    0.04616621136665344,
    0.0022616744972765446,
    -0.00396782997995615,
    0.0001049805068760179,
    0.07559961825609207,
    -0.02875392884016037,
    0.031203892081975937,
    0.052541401237249374,
    -0.09571537375450134,
    -0.08133284747600555,
    0.028464460745453835,
    -0.04313809797167778,
    -0.10411462932825089,
    0.03830349072813988,
    0.013118118047714233,
    -0.055925652384757996,
    -0.008644056506454945,
    -0.03937667980790138,
    -0.04269109293818474,
    -0.07061750441789627,
    0.012214861810207367,
    0.0037106534000486135,
    0.07010393589735031,
    0.01226240023970604,
    -0.019627543166279793,
    0.09874037653207779,
    -0.09801977127790451,
    -0.04597940295934677,
    -0.0662589892745018,
    0.06186791509389877,
    -0.004172589164227247,
    -0.07503347843885422,
    0.01668938435614109,
    -0.026733504608273506,
    0.027608586475253105,
    0.018257396295666695,
    -0.07591048628091812,
    -0.042460910975933075,
    -0.05923883244395256,
    -0.032390985637903214,
    -0.03989230468869209,
    -0.04548623412847519,
    -0.036685336381196976,
    -0.044336576014757156,
    -0.021174218505620956,
    -0.001717770704999566,
    -0.034148503094911575,
    0.0033787176944315434,
    0.0019824316259473562,
    -0.02680610865354538,
    -0.022260047495365143,
    -0.0026346445083618164,
    -0.01123702060431242,
    -0.005635165609419346,
    -0.02811102755367756,
    0.04048405587673187,
    0.03035251423716545,
    -0.01461866870522499,
    -0.05079929158091545,
    0.03753626346588135,
    -0.03077448159456253,
    0.04334631189703941,
    0.02445622719824314,
    0.11979073286056519,
    0.037417590618133545,
    0.02942902036011219,
    -0.09829996526241302,
    0.03272111341357231,
    -0.013565359637141228,
    0.1523621827363968,
    0.05934276059269905,
    -0.053825411945581436,
    -0.10588131844997406,
    0.044965147972106934,
    0.007858025841414928,
    -0.10124668478965759,
    -0.002325949491932988,
    0.09109965711832047,
    0.01016322709619999,
    -0.11352165788412094,
    0.09061487019062042,
    -0.04292081668972969,
    -0.02692916803061962,
    -0.0214239414781332,
    -0.05507935583591461,
    0.017746128141880035,
    -0.03713168948888779,
    -0.10204798728227615,
    -0.046273842453956604,
    -1.121333724114639e-33,
    0.012637147679924965,
    -0.029632020741701126,
    -0.005289955995976925,
    0.021086344495415688,
    0.05859905108809471,
    0.03128346428275108,
    -0.048312339931726456,
    0.00739647401496768,
    -0.049604631960392,
    -0.0009919656440615654,
    0.09463983029127121,
    0.010582100600004196,
    -0.07654288411140442,
    0.009699598886072636,
    0.05355270951986313,
    -0.03772983327507973,
    0.03265715390443802,
    0.024756161496043205,
    0.021386222913861275,
    -0.03471026569604874,
    -0.01367657445371151,
    -0.04450713098049164,
    0.04892344027757645,
    0.04768580570816994,
    0.011774241924285889,
    0.019568780437111855,
    0.007725145202130079,
    0.007750286720693111,
    -0.010598255321383476,
    0.028177008032798767,
    0.045582566410303116,
    -0.04435212165117264,
    -0.029767252504825592,
    -0.07700672745704651,
    -0.02752692438662052,
    0.023786276578903198,
    -0.006620114203542471,
    -0.023879703134298325,
    -0.04170236736536026,
    0.016848722472786903,
    -0.050569627434015274,
    0.0021649023983627558,
    -0.034315530210733414,
    0.09865108877420425,
    -0.055078327655792236,
    0.062320053577423096,
    0.03669741004705429,
    -0.03606127202510834,
    0.042458631098270416,
    0.030506769195199013,
    -0.018795114010572433,
    -0.021151578053832054,
    -0.08219701051712036,
    0.0009612151188775897,
    0.0198663379997015,
    -0.014314182102680206,
    -0.0319436751306057,
    0.07664225995540619,
    0.03228912129998207,
    -0.044279392808675766,
    0.019176315516233444,
    0.051353588700294495,
    -0.06753818690776825,
    0.008514493703842163,
    0.0221888218075037,
    -0.010098530910909176,
    -0.0016733333468437195,
    -0.003540156641975045,
    0.08080632984638214,
    -0.009803714230656624,
    0.0214131660759449,
    0.034815095365047455,
    0.04042055830359459,
    0.04583759978413582,
    0.010865590535104275,
    0.05517690256237984,
    -0.09383785724639893,
    -0.06199798732995987,
    -0.002286638366058469,
    0.08415558189153671,
    0.03512462601065636,
    0.03605646267533302,
    -0.00990804098546505,
    0.0002192032552557066,
    0.019170137122273445,
    0.00783036183565855,
    0.1297847479581833,
    -0.1168021708726883,
    0.0062314597889781,
    0.021923325955867767,
    -0.08720248192548752,
    0.06304724514484406,
    0.04997199773788452,
    -0.04543460160493851,
    -0.09901198744773865,
    -6.06275847718795e-35,
    0.01922939158976078,
    -0.03660820424556732,
    -0.004042509477585554,
    -0.06757200509309769,
    -0.014368253760039806,
    -0.026583202183246613,
    -0.02461259439587593,
    -0.049045342952013016,
    0.04939829185605049,
    0.027777573093771935,
    -0.023390335962176323,
    -0.011635683476924896,
    0.05108797177672386,
    -0.018680471926927567,
    -0.08122528344392776,
    0.020207947120070457,
    0.06407709419727325,
    0.012427926994860172,
    -0.0747542753815651,
    0.06459537893533707,
    -0.07349824160337448,
    0.17317883670330048,
    -0.1079576313495636,
    0.042694784700870514,
    -0.04066900536417961,
    0.12451829761266708,
    -0.03317625820636749,
    -0.002878971630707383,
    -0.05845547839999199,
    0.011277393437922001,
    -0.011539081111550331,
    -0.01864473894238472,
    -0.05126936733722687,
    0.026167262345552444,
    -0.001177691388875246,
    -0.0069192019291222095,
    0.06409486383199692,
    0.030554689466953278,
    -0.006995926611125469,
    0.026596838608384132,
    0.058017078787088394,
    0.016157381236553192,
    -0.023834897205233574,
    0.08033815026283264,
    0.002728230319917202,
    -0.03238861262798309,
    0.0295607578009367,
    -0.11691508442163467,
    0.0005119909183122218,
    -0.03449482098221779,
    0.01822696253657341,
    -0.06822849065065384,
    -0.017850670963525772,
    -0.1228971928358078,
    0.0818096175789833,
    0.039882592856884,
    -0.04414216801524162,
    0.008098685182631016,
    -0.013195439241826534,
    -0.0422932431101799,
    0.05759506672620773,
    0.08858627825975418,
    -0.014539986848831177,
    0.07123436033725739,
    0.05163590982556343,
    0.006053152494132519,
    -0.013736063614487648,
    0.07075921446084976,
    -0.03683096542954445,
    -0.03144640848040581,
    -0.05720854178071022,
    0.05173379182815552,
    -0.09069991111755371,
    -0.0029880369547754526,
    -0.015170922502875328,
    0.04361620545387268,
    0.080128014087677,
    0.046323321759700775,
    -0.0001811248657759279,
    -0.049805112183094025,
    0.03083922155201435,
    -0.05342768877744675,
    -0.023412110283970833,
    -0.043776266276836395,
    0.03539003059267998,
    -0.04124695807695389,
    -0.03757019713521004,
    0.014415446668863297,
    0.008081858046352863,
    0.025960523635149002,
    -0.017345210537314415,
    -0.009752476587891579,
    0.02716335840523243,
    0.0003140943590551615,
    0.07300561666488647,
    -4.3386872761175255e-8,
    -0.024389546364545822,
    -0.056744612753391266,
    -0.013802694156765938,
    0.03827648237347603,
    0.02939949743449688,
    -0.11373084038496017,
    0.05546166002750397,
    -0.06749792397022247,
    0.020962631329894066,
    -0.031784359365701675,
    -0.08917779475450516,
    0.000803516071755439,
    -0.046496324241161346,
    0.04494648426771164,
    0.04704175144433975,
    -0.023837115615606308,
    -0.005411234684288502,
    0.02075028419494629,
    -0.0005583963356912136,
    0.03611331805586815,
    0.016760515049099922,
    0.05183134600520134,
    0.0494699701666832,
    -0.02063460275530815,
    -0.038101375102996826,
    -0.010603995993733406,
    -0.026913709938526154,
    -0.05763893947005272,
    0.060137789696455,
    -0.005322289653122425,
    0.03984194993972778,
    -0.010462284088134766,
    -0.01914227567613125,
    -0.05646507814526558,
    0.06543166935443878,
    -0.046467382460832596,
    -0.04892508313059807,
    -0.07232633978128433,
    -0.03755652904510498,
    -0.015084856189787388,
    -0.02000562474131584,
    -0.0515081025660038,
    0.008068256080150604,
    0.04993468523025513,
    0.018438326194882393,
    0.06910674273967743,
    0.014736694283783436,
    0.0206147450953722,
    -0.004046447109431028,
    0.013207505457103252,
    -0.10210434347391129,
    0.03178903087973595,
    0.11023005098104477,
    -0.052166275680065155,
    0.04057241976261139,
    -0.011222757399082184,
    0.015123043209314346,
    0.06181643530726433,
    0.06332474201917648,
    0.027011467143893242,
    0.10289604961872101,
    0.029668189585208893,
    -0.009335658513009548,
    -0.0020905407145619392
], [0.045412011444568634,0.020253941416740417,-0.0023682434111833572,0.030075514689087868,-0.10076529532670975,-0.0018661828944459558,0.001719559310004115,-0.08892148733139038,-0.05437144637107849,-0.11568920314311981,-0.0035294960252940655,-0.0966091901063919,-0.015543686226010323,0.04994058236479759,0.010369968600571156,-0.08756536990404129,0.10508599877357483,0.024425404146313667,0.06895355135202408,-0.045640986412763596,-0.03749040886759758,-0.00776314502581954,-0.0030159265734255314,0.019916020333766937,-0.056039709597826004,0.08805292844772339,-0.04209096357226372,0.006627276539802551,-0.0443389005959034,-0.02065206505358219,0.008623133413493633,0.05602302402257919,-0.043947163969278336,0.051939431577920914,-0.014851253479719162,0.12910929322242737,0.01832982897758484,-0.09989922493696213,0.03719586133956909,-0.011034888215363026,-0.001703844522126019,0.008924555964767933,0.03774986043572426,0.011388196609914303,0.02529248036444187,-0.008174384012818336,-0.024014145135879517,-0.015369592234492302,0.029756395146250725,0.02131938934326172,0.03445880860090256,0.05476433411240578,0.014609916135668755,-0.032387625426054,0.002728388411924243,0.04825778305530548,-0.03614501655101776,-0.11656321585178375,-0.005429978482425213,-0.048181552439928055,0.06472276151180267,-0.017393771559000015,0.002979920245707035,0.04309779033064842,-0.032802652567625046,-0.0726812407374382,-0.09144672006368637,0.06734407693147659,-0.042329732328653336,-0.1235741525888443,0.013838935643434525,-0.03672989085316658,0.0687321126461029,-0.021319478750228882,0.0514981709420681,-0.0764685645699501,-0.05583779513835907,-0.06781934946775436,-0.06932222843170166,-0.033560819923877716,0.018896667286753654,-0.030174627900123596,-0.0022884435020387173,0.023844880983233452,0.0091929966583848,-0.004635334946215153,-0.004822321701794863,-0.049394745379686356,0.01956798881292343,0.0009488593204878271,0.021460412070155144,-0.09758991748094559,-0.008842005394399166,-0.023073261603713036,0.015709826722741127,0.013290425762534142,-0.0062281284481287,0.0003673862374853343,0.031987227499485016,0.06286203861236572,0.045996543020009995,0.026424836367368698,0.10173343867063522,0.0030878917314112186,-0.06814887374639511,-0.0458146408200264,-0.01851358637213707,0.06486569344997406,0.032515887171030045,-0.04105127602815628,-0.04840525612235069,-0.038462672382593155,-0.0235885176807642,-0.04020952060818672,-0.035974133759737015,0.05058710649609566,0.060763657093048096,-0.0829392746090889,0.020342117175459862,-0.037199147045612335,0.011967284604907036,0.0005924987490288913,-0.004171198233962059,0.0038991898763924837,-0.04397495090961456,0.013147708028554916,0.033121250569820404,-3.242367904583039e-33,-0.03040020912885666,-0.013884066604077816,-0.06576606631278992,-0.006467707920819521,0.08188530057668686,0.02106957696378231,-0.06258699297904968,-0.044357553124427795,-0.039448242634534836,-0.00909433700144291,0.06838859617710114,0.005319974850863218,-0.06215732917189598,0.09227950125932693,0.06969304382801056,-0.0032231684308499098,0.010869580321013927,0.015345715917646885,0.03692884370684624,-0.07695280015468597,-0.011490603908896446,-0.03694196417927742,0.011723660863935947,-0.006450968328863382,-0.024607185274362564,-0.0011201838497072458,-0.040249209851026535,0.033114101737737656,-0.03541462868452072,0.021684471517801285,0.040604181587696075,-0.01498547662049532,-0.032220132648944855,-0.06917336583137512,0.02140374481678009,0.028714166954159737,0.02968703769147396,-0.07656923681497574,0.04996794834733009,0.04185368865728378,-0.04148528724908829,-0.009190527722239494,-0.07995469868183136,0.09662773460149765,-0.003927923273295164,0.05060717463493347,0.06789351254701614,-0.02148240990936756,0.10859651863574982,0.03293894603848457,0.01601986587047577,-0.08813893049955368,-0.07044994831085205,-0.0007613335037603974,-0.05326398089528084,0.042298007756471634,-0.06251922994852066,0.033475544303655624,0.024092786014080048,-0.0497182197868824,0.042439769953489304,-0.016045257449150085,-0.03807584196329117,0.011012798175215721,0.07183399796485901,0.021743418648838997,0.02935905009508133,0.052343882620334625,0.0784451812505722,0.05988738685846329,-0.010073290206491947,-0.03430052474141121,0.1073753759264946,0.02534230425953865,0.016730742529034615,0.07030993700027466,-0.023849256336688995,-0.034603867679834366,-0.013328969478607178,0.039120472967624664,-0.03979445621371269,0.005533396732062101,0.015458296053111553,0.057452037930488586,0.06133188679814339,-0.01126384362578392,0.0804423838853836,-0.14305460453033447,-0.005445700604468584,-0.04252283275127411,-0.04657723009586334,0.045654408633708954,-0.015393326058983803,-0.021691331639885902,-0.034243520349264145,1.1096735548384513e-33,0.03771430253982544,-0.051519203931093216,-0.05226903781294823,-0.0006496591959148645,-0.06439178436994553,-0.03747154399752617,-0.079686738550663,-0.010242852382361889,0.011128300800919533,0.0026430145371705294,-0.16031549870967865,0.015354105271399021,0.08351507782936096,-0.0332217700779438,-0.05230803042650223,0.03529120609164238,0.08889132738113403,-0.008555074222385883,-0.06416912376880646,0.09385012090206146,-0.034654807299375534,0.024659693241119385,-0.049209967255592346,-0.02130875177681446,-0.052216786891222,0.0993741825222969,-0.07092492282390594,-0.10384289920330048,-0.05972003564238548,-0.04174621030688286,-0.03521908074617386,-0.008954678662121296,0.07948944717645645,-0.02705915831029415,-0.016574082896113396,0.12388000637292862,0.07833216339349747,-0.012850846163928509,0.026017824187874794,0.029701897874474525,0.05269409716129303,-0.07762838900089264,0.002577737206593156,0.10954295098781586,0.044472526758909225,0.06911531090736389,-0.03952996805310249,0.05728401988744736,0.009904244914650917,-0.03785804659128189,0.03221585601568222,0.03388947620987892,-0.02492344193160534,-0.042773179709911346,0.034983500838279724,0.01442849449813366,-0.07765644788742065,0.013142060488462448,0.013329669833183289,0.0031860528979450464,0.01595505326986313,0.03617337346076965,0.0022418485023081303,0.10779216885566711,0.04798424243927002,-0.01088903658092022,-0.06979123502969742,-0.014893589541316032,-0.08411817252635956,0.03773519769310951,-0.04008079320192337,-0.018909966573119164,-0.07766134291887283,0.07815302908420563,-0.05835150182247162,-0.0283475611358881,0.0424802228808403,0.07823310792446136,0.0468912199139595,0.06579587608575821,-0.0004954562755301595,-0.017609160393476486,-0.008364864625036716,-0.03992730379104614,0.08652834594249725,-0.010427705943584442,-0.037701092660427094,0.01606817916035652,0.024475349113345146,-0.03989224135875702,-0.01774250529706478,0.023707378655672073,-0.07947073131799698,-0.014085902832448483,0.046100009232759476,-3.30130482950608e-08,0.04203874617815018,-0.017492225393652916,-0.04941316321492195,0.040229301899671555,-0.07367504388093948,-0.16566656529903412,0.08193028718233109,0.03997482359409332,0.04537032172083855,0.024826623499393463,-0.08278481662273407,0.02067676931619644,-0.07666124403476715,0.010918495245277882,0.07310526818037033,0.062269944697618484,0.026764292269945145,-0.07188281416893005,-0.006453510839492083,0.035116031765937805,0.047241538763046265,0.012909391894936562,0.04959079623222351,-0.07538792490959167,-0.06143654137849808,-0.027299482375383377,-0.005261027254164219,0.008450395427644253,0.10255931317806244,-0.023739730939269066,0.04176756367087364,0.0028171013109385967,-0.015895219519734383,-0.02381655015051365,0.03997928649187088,0.03008766658604145,-0.0866563618183136,-0.09014196693897247,0.016585959121584892,-0.09884891659021378,0.013398736715316772,-0.007845747284591198,-0.0060643344186246395,0.02965075708925724,-0.008894861675798893,0.06671861559152603,0.0392790287733078,0.012425633147358894,0.04872273653745651,-0.007789199706166983,-0.1101204976439476,0.0595744363963604,0.09848510473966599,0.010712684132158756,0.03670961409807205,0.0067650205455720425,0.010898665525019169,-0.02099463902413845,0.09107644110918045,0.028599664568901062,0.048757027834653854,0.025322075933218002,-0.027760537341237068,-0.022497475147247314]))
        # ranked_cities = rank_cities_by_similarity(user_text, cities, dislikes_text="")
        
        # Affichage des top 10
        # print(f"\nTop 10 villes les plus similaires à '{user_text}':")
        # for i, city in enumerate(ranked_cities[:10], 1):
        #    print(f"  {i}. {city['name']} (ID: {city['id']}) - Similarité: {city['similarity']:.4f}")
        
    except Exception as e:
        logger.error(f"Erreur dans l'exécution principale: {e}")
    
    
/**
 * Service de gestion de l'inférence ONNX et de la tokenisation
 * Sépare la logique du modèle ML des utilitaires mathématiques
 */

import { InferenceSession, Tensor } from "onnxruntime-react-native";
import { Asset } from "expo-asset";
import { Logger } from "../utils/Logger";

// Import du vocabulaire JSON directement (généré à partir de vocab.txt)
const VOCAB_LIST = require("../../../assets/models/vocab.json");

// Création de la map token -> ID au chargement
const vocabMap = new Map();
VOCAB_LIST.forEach((token, index) => {
  vocabMap.set(token, index);
});

Logger.info(`Vocabulaire chargé: ${vocabMap.size} tokens`);

// IDs des tokens spéciaux
const CLS_TOKEN_ID = vocabMap.get("[CLS]") || 101;
const SEP_TOKEN_ID = vocabMap.get("[SEP]") || 102;
const PAD_TOKEN_ID = vocabMap.get("[PAD]") || 0;
const UNK_TOKEN_ID = vocabMap.get("[UNK]") || 100;

// Configuration du modèle
const MODEL_CONFIG = {
  maxLength: 128,
  embeddingSize: 384,
};

class InferenceService {
  constructor() {
    this.session = null;
  }

  /**
   * Tokenize un texte en utilisant WordPiece
   * @param {string} text - Le texte à tokenizer
   * @returns {number[]} - Liste des IDs de tokens
   */
  tokenizeText(text) {
    const tokens = [];

    // Ajouter [CLS] au début
    tokens.push(CLS_TOKEN_ID);

    // Nettoyer et découper le texte
    const normalizedText = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
      .replace(/([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, " $1 ") // Sépare la ponctuation
      .trim();

    const words = normalizedText.split(/\s+/).filter((w) => w.length > 0);

    for (const word of words) {
      // Essayer de trouver le mot complet d'abord
      if (vocabMap.has(word)) {
        tokens.push(vocabMap.get(word));
        continue;
      }

      // Sinon, faire du WordPiece (découper en sous-parties)
      let start = 0;
      const wordTokens = [];
      let isBad = false;

      while (start < word.length) {
        let end = word.length;
        let foundToken = null;
        let foundEnd = start;

        // Chercher la plus longue sous-chaîne présente dans le vocab (greedy)
        while (end > start) {
          let substr = word.substring(start, end);

          // Ajouter "##" pour les sous-mots (sauf le premier)
          if (start > 0) {
            substr = "##" + substr;
          }

          if (vocabMap.has(substr)) {
            foundToken = substr;
            foundEnd = end;
            break;
          }

          end--;
        }

        if (foundToken !== null) {
          wordTokens.push(vocabMap.get(foundToken));
          start = foundEnd;
        } else {
          // Aucune correspondance trouvée, utiliser [UNK]
          isBad = true;
          break;
        }
      }

      if (isBad) {
        wordTokens.push(UNK_TOKEN_ID);
      } else {
        tokens.push(...wordTokens);
      }
    }

    // Ajouter [SEP] à la fin
    tokens.push(SEP_TOKEN_ID);

    return tokens;
  }

  /**
   * Charge le modèle ONNX
   * @returns {Promise<InferenceSession>}
   */
  async loadModel() {
    if (this.session) {
      return this.session;
    }

    try {
      Logger.debug("Chargement du modèle ONNX...");
      const asset = Asset.fromModule(
        require("../../../assets/models/model_qint8_arm64.onnx")
      );
      await asset.downloadAsync();
      this.session = await InferenceSession.create(asset.localUri);
      Logger.success("Modèle ONNX chargé avec succès");
      return this.session;
    } catch (error) {
      Logger.error("Erreur lors du chargement du modèle ONNX:", error);
      throw error;
    }
  }

  /**
   * Prépare les inputs pour l'inférence
   * @param {number[]} inputIds - IDs des tokens
   * @returns {Object} - Tensors d'input
   */
  prepareInputs(inputIds) {
    const { maxLength } = MODEL_CONFIG;

    // Padding
    const paddedIds = [...inputIds];
    while (paddedIds.length < maxLength) {
      paddedIds.push(PAD_TOKEN_ID);
    }
    if (paddedIds.length > maxLength) {
      paddedIds.length = maxLength;
    }

    // Créer le masque d'attention
    const attentionMask = paddedIds.map((id) => (id !== PAD_TOKEN_ID ? 1 : 0));

    // Créer les tensors ONNX
    return {
      input_ids: new Tensor(
        "int64",
        BigInt64Array.from(paddedIds.map(BigInt)),
        [1, maxLength]
      ),
      attention_mask: new Tensor(
        "int64",
        BigInt64Array.from(attentionMask.map(BigInt)),
        [1, maxLength]
      ),
      token_type_ids: new Tensor(
        "int64",
        BigInt64Array.from(new Array(maxLength).fill(0n)),
        [1, maxLength]
      ),
      attentionMask: attentionMask, // Pour le mean pooling
      inputIds: inputIds, // Pour le mean pooling
    };
  }

  /**
   * Extrait l'embedding depuis la sortie du modèle
   * @param {Object} output - Sortie du modèle ONNX
   * @param {number[]} attentionMask - Masque d'attention
   * @param {number[]} inputIds - IDs des tokens
   * @returns {number[]} - Embedding
   */
  extractEmbedding(output, attentionMask, inputIds) {
    const { embeddingSize } = MODEL_CONFIG;
    let embedding;

    if (output.sentence_embedding) {
      // Embedding poolé direct
      embedding = Array.from(output.sentence_embedding.data);
      Logger.debug(`Embedding direct: ${embedding.length} dimensions`);
    } else if (output.last_hidden_state) {
      // Mean pooling sur last_hidden_state
      const outputData = output.last_hidden_state.data;
      const seqLength = inputIds.length;

      embedding = new Array(embeddingSize).fill(0);
      let validTokens = 0;

      for (let i = 0; i < seqLength; i++) {
        if (attentionMask[i] === 1) {
          for (let j = 0; j < embeddingSize; j++) {
            embedding[j] += outputData[i * embeddingSize + j];
          }
          validTokens++;
        }
      }

      // Moyenne
      for (let i = 0; i < embeddingSize; i++) {
        embedding[i] /= validTokens;
      }

      Logger.debug(`Mean pooling: ${embedding.length} dimensions`);
    } else {
      throw new Error("Format de sortie ONNX non reconnu");
    }

    return embedding;
  }

  /**
   * Normalise un vecteur avec L2
   * @param {number[]} vector - Vecteur à normaliser
   * @returns {number[]} - Vecteur normalisé
   */
  normalizeL2(vector) {
    let norm = 0;
    for (let i = 0; i < vector.length; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);

    const normalized = new Array(vector.length);
    for (let i = 0; i < vector.length; i++) {
      normalized[i] = vector[i] / norm;
    }

    return normalized;
  }

  /**
   * Génère un embedding à partir d'un texte
   * @param {string} text - Le texte à encoder
   * @returns {Promise<number[]>} - L'embedding (384 dimensions, normalisé)
   */
  async generateEmbedding(text) {
    try {
      Logger.debug("Tokenization du texte:", text);

      // Tokenization
      const inputIds = this.tokenizeText(text);
      Logger.debug(`Tokens générés: ${inputIds.length}`);

      // Charger le modèle
      const session = await this.loadModel();

      // Préparer les inputs
      const inputs = this.prepareInputs(inputIds);

      Logger.debug("Exécution de l'inférence ONNX...");

      // Exécuter l'inférence
      const output = await session.run({
        input_ids: inputs.input_ids,
        attention_mask: inputs.attention_mask,
        token_type_ids: inputs.token_type_ids,
      });

      Logger.debug("Inférence terminée");

      // Extraire l'embedding
      let embedding = this.extractEmbedding(
        output,
        inputs.attentionMask,
        inputs.inputIds
      );

      // Normalisation L2
      embedding = this.normalizeL2(embedding);

      Logger.success(
        `Embedding généré: ${embedding.length} dimensions (normalisé)`
      );

      return embedding;
    } catch (error) {
      Logger.error("Erreur lors de la génération de l'embedding:", error);
      throw error;
    }
  }
}

// Export singleton
export default new InferenceService();
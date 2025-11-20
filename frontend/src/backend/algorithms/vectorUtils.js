/**
 * Convertit un BLOB SQLite en array de nombres (vecteur)
 * @param {Uint8Array|ArrayBuffer} blob - Les données BLOB du vecteur
 * @returns {number[]} - Le vecteur sous forme d'array
 */
export function blobToVector(blob) {
  if (!blob) return [];

  // Convertir en Uint8Array si nécessaire
  const uint8Array = blob instanceof Uint8Array ? blob : new Uint8Array(blob);

  // Créer un DataView pour lire les float64
  const dataView = new DataView(
    uint8Array.buffer,
    uint8Array.byteOffset,
    uint8Array.byteLength
  );

  // Lire les valeurs float64 (8 octets chacun)
  const vector = [];
  for (let i = 0; i < uint8Array.length; i += 8) {
    vector.push(dataView.getFloat64(i, true)); // true = little-endian
  }

  return vector;
}

/**
 * Convertit un array de nombres en BLOB SQLite
 * @param {number[]} vector - Le vecteur sous forme d'array
 * @returns {Uint8Array} - Les données BLOB
 */
export function vectorToBlob(vector) {
  if (!Array.isArray(vector) || vector.length === 0) {
    return new Uint8Array(0);
  }

  // Créer un ArrayBuffer pour 8 octets par nombre (float64)
  const buffer = new ArrayBuffer(vector.length * 8);
  const dataView = new DataView(buffer);

  // Écrire chaque nombre en float64 (little-endian)
  for (let i = 0; i < vector.length; i++) {
    dataView.setFloat64(i * 8, vector[i], true); // true = little-endian
  }

  return new Uint8Array(buffer);
}

/**
 * Calcule la similitude cosinus entre deux vecteurs
 * @param {number[]} vec1 - Premier vecteur
 * @param {number[]} vec2 - Deuxième vecteur
 * @returns {number} - Similitude cosinus (0-1)
 */
export function cosineSimilarity(vec1, vec2) {
  if (!vec1 || !vec2 || vec1.length !== vec2.length || vec1.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (norm1 * norm2);
}

import { InferenceSession, Tensor } from "onnxruntime-react-native";
import { Asset } from "expo-asset";

// Import du vocabulaire JSON directement (généré à partir de vocab.txt)
const VOCAB_LIST = require("../../../assets/models/vocab.json");

// Création de la map token -> ID au chargement
const vocabMap = new Map();
VOCAB_LIST.forEach((token, index) => {
  vocabMap.set(token, index);
});

console.log(`📚 Vocabulaire chargé: ${vocabMap.size} tokens`);

// IDs des tokens spéciaux
const CLS_TOKEN_ID = vocabMap.get("[CLS]") || 101;
const SEP_TOKEN_ID = vocabMap.get("[SEP]") || 102;
const PAD_TOKEN_ID = vocabMap.get("[PAD]") || 0;
const UNK_TOKEN_ID = vocabMap.get("[UNK]") || 100;

/**
 * Tokenize un texte en utilisant WordPiece
 * @param {string} text - Le texte à tokenizer
 * @returns {number[]} - Liste des IDs de tokens
 */
function tokenizeText(text) {
  const tokens = [];

  // Ajouter [CLS] au début
  tokens.push(CLS_TOKEN_ID);

  // Nettoyer et découper le texte
  // On sépare la ponctuation pour matcher le comportement du tokenizer BERT (BasicTokenizer)
  // On remplace les points, underscores, tirets et autres signes par " . " pour qu'ils soient traités comme des tokens séparés
  const normalizedText = text
    .toLowerCase()
    .replace(/([.,!?;:_\\-])/g, " $1 ") // Ajoute des espaces autour de la ponctuation (y compris _ et -)
    .trim();

  const words = normalizedText
    .split(/\s+/) // Sépare par espaces
    .filter((w) => w.length > 0);

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
 * Génère un embedding à partir d'un texte en utilisant ONNX Runtime et le modèle MiniLM local
 * @param {string} text - Le texte à encoder
 * @returns {Promise<number[]>} - L'embedding sous forme de tableau (384 dimensions)
 */
export async function generateEmbeddingLocal(text) {
  try {
    console.log("📝 Tokenization du texte:", text);

    // Tokenization avec notre implémentation WordPiece
    const inputIds = tokenizeText(text);

    console.log(`🔢 Tokens générés: ${inputIds.length}`);
    console.log(`🔢 Input IDs complets: [${inputIds.slice(0, 20).join(", ")}]`);

    // Décoder les tokens pour vérification
    const decodedTokens = inputIds.slice(0, 10).map((id) => {
      for (const [token, tokenId] of vocabMap.entries()) {
        if (tokenId === id) return token;
      }
      return `ID:${id}`;
    });
    console.log(`🔤 Tokens décodés: [${decodedTokens.join(", ")}]`);

    // Padding à une longueur fixe (128 tokens max pour MiniLM)
    const maxLength = 128;
    const paddedIds = [...inputIds];

    while (paddedIds.length < maxLength) {
      paddedIds.push(PAD_TOKEN_ID);
    }
    if (paddedIds.length > maxLength) {
      paddedIds.length = maxLength;
    }

    // Créer le masque d'attention (1 pour tokens réels, 0 pour padding)
    const attentionMask = paddedIds.map((id) => (id !== PAD_TOKEN_ID ? 1 : 0));

    console.log("🔧 Chargement du modèle ONNX...");
    const asset = Asset.fromModule(
      require("../../../assets/models/model_qint8_arm64.onnx")
    );
    await asset.downloadAsync();
    const session = await InferenceSession.create(asset.localUri);
    console.log("✅ Modèle chargé!");

    // Créer les tensors ONNX avec BigInt64Array (requis pour int64)
    const inputIdsTensor = new Tensor(
      "int64",
      BigInt64Array.from(paddedIds.map(BigInt)),
      [1, maxLength]
    );

    const attentionMaskTensor = new Tensor(
      "int64",
      BigInt64Array.from(attentionMask.map(BigInt)),
      [1, maxLength]
    );

    // Créer le tensor token_type_ids (tous à 0 pour une seule phrase)
    const tokenTypeIdsTensor = new Tensor(
      "int64",
      BigInt64Array.from(new Array(maxLength).fill(0n)),
      [1, maxLength]
    );

    console.log("🚀 Exécution de l'inférence ONNX...");

    // Exécuter l'inférence
    const output = await session.run({
      input_ids: inputIdsTensor,
      attention_mask: attentionMaskTensor,
      token_type_ids: tokenTypeIdsTensor,
    });

    console.log("✅ Inférence terminée!");

    // Le modèle peut retourner directement sentence_embedding ou last_hidden_state
    let embedding;

    if (output.sentence_embedding) {
      // Si le modèle retourne directement l'embedding poolé
      embedding = Array.from(output.sentence_embedding.data);
      console.log(`📊 Embedding direct: ${embedding.length} dimensions`);
    } else if (output.last_hidden_state) {
      // Sinon, faire mean pooling sur last_hidden_state
      const outputData = output.last_hidden_state.data;
      const embeddingSize = 384;
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

      console.log(`📊 Mean pooling: ${embedding.length} dimensions`);
    } else {
      throw new Error("Format de sortie ONNX non reconnu");
    }

    // Normalisation L2 (comme sentence-transformers en Python)
    let norm = 0;
    for (let i = 0; i < embedding.length; i++) {
      norm += embedding[i] * embedding[i];
    }
    norm = Math.sqrt(norm);

    // Diviser chaque valeur par la norme pour normaliser
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= norm;
    }

    console.log(
      `✅ Embedding généré: ${embedding.length} dimensions (normalisé)`
    );
    console.log(
      `📊 Premières valeurs: ${embedding
        .slice(0, 5)
        .map((v) => v.toFixed(4))
        .join(", ")}`
    );

    return embedding;
  } catch (error) {
    console.error("❌ Erreur génération embedding:", error);
    throw error;
  }
}

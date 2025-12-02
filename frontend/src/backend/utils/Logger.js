/**
 * Logger utilitaire pour gérer les logs de manière propre
 * En production, les logs de debug sont désactivés
 */

const isDev = __DEV__ || process.env.NODE_ENV === "development";

export const Logger = {
  /**
   * Logs de debug (uniquement en dev)
   */
  debug: (...args) => {
    if (isDev) {
      console.log("🐛", ...args);
    }
  },

  /**
   * Logs d'information (toujours affichés)
   */
  info: (...args) => {
    console.log("ℹ️", ...args);
  },

  /**
   * Logs d'erreur (toujours affichés)
   */
  error: (...args) => {
    console.error("❌", ...args);
  },

  /**
   * Logs de succès (toujours affichés)
   */
  success: (...args) => {
    console.log("✅", ...args);
  },

  /**
   * Logs d'avertissement (toujours affichés)
   */
  warn: (...args) => {
    console.warn("⚠️", ...args);
  },
};

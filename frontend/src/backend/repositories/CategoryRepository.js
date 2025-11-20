/**
 * Repository pour la gestion des catégories
 * Accès aux données de la table categories
 */

import dbConnection from '../database/connection';

class CategoryRepository {
  /**
   * Récupère toutes les catégories
   * @returns {Promise<Array>}
   */
  async getAllCategories() {
    try {
      const result = await dbConnection.executeSql(
        'SELECT id, name, parent_id FROM categories ORDER BY name;',
        []
      );
      return result.rows._array;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Récupère une catégorie par son ID
   * @param {number} categoryId
   * @returns {Promise<Object|null>}
   */
  async getCategoryById(categoryId) {
    try {
      const result = await dbConnection.executeSql(
        'SELECT id, name, parent_id FROM categories WHERE id = ?;',
        [categoryId]
      );
      return result.rows._array[0] || null;
    } catch (error) {
      console.error('Error fetching category by ID:', error);
      throw error;
    }
  }

  /**
   * Récupère les catégories racines (sans parent)
   * @returns {Promise<Array>}
   */
  async getRootCategories() {
    try {
      const result = await dbConnection.executeSql(
        'SELECT id, name, parent_id FROM categories WHERE parent_id IS NULL ORDER BY name;',
        []
      );
      return result.rows._array;
    } catch (error) {
      console.error('Error fetching root categories:', error);
      throw error;
    }
  }

  /**
   * Récupère les sous-catégories d'une catégorie
   * @param {number} parentId
   * @returns {Promise<Array>}
   */
  async getSubCategories(parentId) {
    try {
      const result = await dbConnection.executeSql(
        'SELECT id, name, parent_id FROM categories WHERE parent_id = ? ORDER BY name;',
        [parentId]
      );
      return result.rows._array;
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      throw error;
    }
  }

  /**
   * Récupère l'arbre hiérarchique des catégories
   * @returns {Promise<Array>}
   */
  async getCategoryTree() {
    try {
      // Récupérer toutes les catégories
      const allCategories = await this.getAllCategories();
      
      // Construire l'arbre hiérarchique
      const categoryMap = new Map();
      const tree = [];
      
      // Première passe : créer tous les nœuds
      allCategories.forEach(category => {
        categoryMap.set(category.id, { ...category, children: [] });
      });
      
      // Deuxième passe : construire la hiérarchie
      allCategories.forEach(category => {
        const node = categoryMap.get(category.id);
        if (category.parent_id === null) {
          tree.push(node);
        } else {
          const parent = categoryMap.get(category.parent_id);
          if (parent) {
            parent.children.push(node);
          }
        }
      });
      
      return tree;
    } catch (error) {
      console.error('Error building category tree:', error);
      throw error;
    }
  }

  /**
   * Recherche des catégories par nom
   * @param {string} searchTerm
   * @returns {Promise<Array>}
   */
  async searchCategoriesByName(searchTerm) {
    try {
      const result = await dbConnection.executeSql(
        'SELECT id, name, parent_id FROM categories WHERE name LIKE ? ORDER BY name;',
        [`%${searchTerm}%`]
      );
      return result.rows._array;
    } catch (error) {
      console.error('Error searching categories:', error);
      throw error;
    }
  }

  /**
   * Récupère les catégories d'un lieu
   * @param {number} placeId
   * @returns {Promise<Array>}
   */
  async getCategoriesByPlace(placeId) {
    try {
      const result = await dbConnection.executeSql(
        `SELECT c.id, c.name, c.parent_id
         FROM categories c
         INNER JOIN place_categories pc ON c.id = pc.category_id
         WHERE pc.place_id = ?
         ORDER BY c.name;`,
        [placeId]
      );
      return result.rows._array;
    } catch (error) {
      console.error('Error fetching categories by place:', error);
      throw error;
    }
  }

  /**
   * Insère une nouvelle catégorie
   * @param {Object} categoryData - {name, parent_id}
   * @returns {Promise<number>} - ID de la catégorie insérée
   */
  async insertCategory(categoryData) {
    try {
      const { name, parent_id } = categoryData;
      
      const result = await dbConnection.executeSql(
        'INSERT INTO categories (name, parent_id) VALUES (?, ?);',
        [name, parent_id || null]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error inserting category:', error);
      throw error;
    }
  }

  /**
   * Met à jour une catégorie
   * @param {number} categoryId
   * @param {Object} categoryData - {name, parent_id}
   * @returns {Promise<boolean>}
   */
  async updateCategory(categoryId, categoryData) {
    try {
      const { name, parent_id } = categoryData;
      
      await dbConnection.executeSql(
        'UPDATE categories SET name = ?, parent_id = ? WHERE id = ?;',
        [name, parent_id || null, categoryId]
      );
      
      return true;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  /**
   * Supprime une catégorie
   * @param {number} categoryId
   * @returns {Promise<boolean>}
   */
  async deleteCategory(categoryId) {
    try {
      await dbConnection.executeSql(
        'DELETE FROM categories WHERE id = ?;',
        [categoryId]
      );
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  /**
   * Compte le nombre total de catégories
   * @returns {Promise<number>}
   */
  async countCategories() {
    try {
      const result = await dbConnection.executeSql(
        'SELECT COUNT(*) as count FROM categories;',
        []
      );
      return result.rows._array[0].count;
    } catch (error) {
      console.error('Error counting categories:', error);
      throw error;
    }
  }
}

export default new CategoryRepository();

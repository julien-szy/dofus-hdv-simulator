// Utilitaire pour peupler la BDD avec les objets craftables
import { DOFUS_PROFESSIONS } from '../data/professions.js'

// Données d'exemple d'objets craftables par métier
const CRAFTABLE_ITEMS_DATA = {
  'Alchimiste': [
    { id: 311, name: 'Potion de Soin Mineure', type: 'Consommable', level: 1 },
    { id: 312, name: 'Potion de Soin Légère', type: 'Consommable', level: 10 },
    { id: 313, name: 'Potion de Soin', type: 'Consommable', level: 20 },
    { id: 314, name: 'Potion de Soin Majeure', type: 'Consommable', level: 40 },
    { id: 315, name: 'Potion de Rappel', type: 'Consommable', level: 30 },
    { id: 316, name: 'Potion de Vitalité', type: 'Consommable', level: 50 }
  ],
  'Forgeron d\'Épées': [
    { id: 1, name: 'Épée de Boisaille', type: 'Épée', level: 1 },
    { id: 2, name: 'Épée du Bouftou', type: 'Épée', level: 13 },
    { id: 3, name: 'Épée de Kokoko', type: 'Épée', level: 25 },
    { id: 4, name: 'Épée Royale', type: 'Épée', level: 50 },
    { id: 5, name: 'Épée Légendaire', type: 'Épée', level: 100 }
  ],
  'Forgeron de Dagues': [
    { id: 21, name: 'Dague de Boisaille', type: 'Dague', level: 1 },
    { id: 22, name: 'Dague du Bouftou', type: 'Dague', level: 13 },
    { id: 23, name: 'Dague de Kokoko', type: 'Dague', level: 25 },
    { id: 24, name: 'Dague Royale', type: 'Dague', level: 50 }
  ],
  'Forgeron de Marteaux': [
    { id: 41, name: 'Marteau de Boisaille', type: 'Marteau', level: 1 },
    { id: 42, name: 'Marteau du Bouftou', type: 'Marteau', level: 13 },
    { id: 43, name: 'Marteau de Kokoko', type: 'Marteau', level: 25 },
    { id: 44, name: 'Marteau Royal', type: 'Marteau', level: 50 }
  ],
  'Sculpteur d\'Arcs': [
    { id: 61, name: 'Arc de Boisaille', type: 'Arc', level: 1 },
    { id: 62, name: 'Arc du Bouftou', type: 'Arc', level: 13 },
    { id: 63, name: 'Arc de Kokoko', type: 'Arc', level: 25 },
    { id: 64, name: 'Arc Royal', type: 'Arc', level: 50 }
  ],
  'Sculpteur de Bâtons': [
    { id: 81, name: 'Bâton de Boisaille', type: 'Bâton', level: 1 },
    { id: 82, name: 'Bâton du Bouftou', type: 'Bâton', level: 13 },
    { id: 83, name: 'Bâton de Kokoko', type: 'Bâton', level: 25 },
    { id: 84, name: 'Bâton Royal', type: 'Bâton', level: 50 }
  ],
  'Sculpteur de Baguettes': [
    { id: 101, name: 'Baguette de Boisaille', type: 'Baguette', level: 1 },
    { id: 102, name: 'Baguette du Bouftou', type: 'Baguette', level: 13 },
    { id: 103, name: 'Baguette de Kokoko', type: 'Baguette', level: 25 },
    { id: 104, name: 'Baguette Royale', type: 'Baguette', level: 50 }
  ],
  'Cordonnier': [
    { id: 121, name: 'Bottes de Boisaille', type: 'Bottes', level: 1 },
    { id: 122, name: 'Bottes du Bouftou', type: 'Bottes', level: 13 },
    { id: 123, name: 'Bottes de Kokoko', type: 'Bottes', level: 25 },
    { id: 124, name: 'Bottes Royales', type: 'Bottes', level: 50 }
  ],
  'Joaillomage': [
    { id: 141, name: 'Anneau de Boisaille', type: 'Anneau', level: 1 },
    { id: 142, name: 'Anneau du Bouftou', type: 'Anneau', level: 13 },
    { id: 143, name: 'Amulette de Kokoko', type: 'Amulette', level: 25 },
    { id: 144, name: 'Amulette Royale', type: 'Amulette', level: 50 }
  ],
  'Tailleur': [
    { id: 161, name: 'Cape de Boisaille', type: 'Cape', level: 1 },
    { id: 162, name: 'Cape du Bouftou', type: 'Cape', level: 13 },
    { id: 163, name: 'Chapeau de Kokoko', type: 'Chapeau', level: 25 },
    { id: 164, name: 'Chapeau Royal', type: 'Chapeau', level: 50 }
  ],
  'Forgeron de Boucliers': [
    { id: 181, name: 'Bouclier de Boisaille', type: 'Bouclier', level: 1 },
    { id: 182, name: 'Bouclier du Bouftou', type: 'Bouclier', level: 13 },
    { id: 183, name: 'Bouclier de Kokoko', type: 'Bouclier', level: 25 },
    { id: 184, name: 'Bouclier Royal', type: 'Bouclier', level: 50 }
  ],
  'Bricoleur': [
    { id: 201, name: 'Idole de Boisaille', type: 'Idole', level: 1 },
    { id: 202, name: 'Idole du Bouftou', type: 'Idole', level: 13 },
    { id: 203, name: 'Idole de Kokoko', type: 'Idole', level: 25 },
    { id: 204, name: 'Idole Royale', type: 'Idole', level: 50 }
  ]
}

// Fonction pour formater les données pour la BDD
export function formatCraftableItems() {
  const formattedItems = []

  for (const [profession, items] of Object.entries(CRAFTABLE_ITEMS_DATA)) {
    for (const item of items) {
      formattedItems.push({
        item_id: item.id,
        item_name: item.name,
        item_type: item.type,
        profession: profession,
        level_required: item.level,
        item_data: {
          ankama_id: item.id,
          name: item.name,
          type: { name: item.type },
          level: item.level,
          profession: profession,
          description: `${item.name} - Niveau ${item.level} ${profession}`,
          craftable: true
        }
      })
    }
  }

  return formattedItems
}

// Fonction pour peupler la BDD
export async function populateCraftableItems() {
  const baseUrl = import.meta.env.DEV 
    ? 'http://localhost:8888/.netlify/functions/database'
    : '/.netlify/functions/database'

  try {
    const items = formatCraftableItems()
    
    console.log(`📦 Ajout de ${items.length} objets craftables...`)
    
    const response = await fetch(`${baseUrl}?action=save_craftable_items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log(`✅ ${result.length} objets craftables ajoutés avec succès !`)
    
    return result
  } catch (error) {
    console.error('❌ Erreur lors du peuplement:', error)
    throw error
  }
}

// Fonction pour obtenir les statistiques
export async function getCraftableStats() {
  const baseUrl = import.meta.env.DEV 
    ? 'http://localhost:8888/.netlify/functions/database'
    : '/.netlify/functions/database'

  try {
    const response = await fetch(`${baseUrl}?action=get_craftable_items`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const items = await response.json()
    
    // Calculer les statistiques par métier
    const statsByProfession = {}
    for (const item of items) {
      if (!statsByProfession[item.profession]) {
        statsByProfession[item.profession] = 0
      }
      statsByProfession[item.profession]++
    }

    return {
      totalItems: items.length,
      byProfession: statsByProfession,
      lastUpdate: new Date().toISOString()
    }
  } catch (error) {
    console.error('❌ Erreur récupération stats:', error)
    return null
  }
}

// Fonction pour vider les objets craftables (admin)
export async function clearCraftableItems() {
  console.warn('⚠️ Cette fonction n\'est pas implémentée pour des raisons de sécurité')
  // Cette fonction pourrait être implémentée côté serveur avec authentification admin
}

export default {
  formatCraftableItems,
  populateCraftableItems,
  getCraftableStats,
  clearCraftableItems
}

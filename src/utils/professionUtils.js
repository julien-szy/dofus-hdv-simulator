import { ITEM_TYPE_TO_PROFESSION } from '../data/professions.js'

// Enrichir un objet avec les informations de métier manquantes
export const enrichItemWithProfession = (item) => {
  // Si l'objet a déjà une profession, on la garde
  if (item.recipe_profession && item.recipe_profession.name) {
    return item
  }

  // Si l'objet n'a pas de recette, pas besoin de métier
  if (!item.recipe || item.recipe.length === 0) {
    return item
  }

  // Deviner le métier selon le type d'objet
  const guessedProfession = ITEM_TYPE_TO_PROFESSION[item.type.name]
  
  if (guessedProfession) {
    return {
      ...item,
      recipe_profession: {
        name: guessedProfession,
        level: item.level // Utiliser le niveau de l'objet comme niveau requis
      }
    }
  }

  return item
}

// Obtenir le statut de craft avec plus de détails
export const getCraftStatus = (item, playerProfessions, checkProfessionLevels) => {
  if (!item.recipe_profession || !item.recipe_profession.name) {
    return { canCraft: true, status: 'no_profession', message: 'Aucun métier requis' }
  }
  
  const requiredProfession = item.recipe_profession.name
  const requiredLevel = item.recipe_profession.level || item.level || 1
  const playerLevel = playerProfessions[requiredProfession] || 0
  
  if (!checkProfessionLevels) {
    return { 
      canCraft: true, 
      status: 'check_disabled', 
      message: `${requiredProfession} Niv.${requiredLevel} (vérification désactivée)`,
      requiredLevel,
      playerLevel
    }
  }
  
  if (playerLevel >= requiredLevel) {
    return { 
      canCraft: true, 
      status: 'can_craft', 
      message: `${requiredProfession} Niv.${requiredLevel} ✅`,
      requiredLevel,
      playerLevel
    }
  }
  
  return { 
    canCraft: false, 
    status: 'level_too_low', 
    message: `${requiredProfession} Niv.${requiredLevel} (vous: ${playerLevel})`,
    requiredLevel,
    playerLevel
  }
}

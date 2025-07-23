// Fonctions de sauvegarde et chargement des données

export const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde de ${key}:`, error)
  }
}

export const loadFromLocalStorage = (key, defaultValue = null) => {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : defaultValue
  } catch (error) {
    console.error(`Erreur lors du chargement de ${key}:`, error)
    return defaultValue
  }
}

// Clés de stockage
export const STORAGE_KEYS = {
  CALCULATIONS: 'dofus-craft-calculations',
  PROFESSIONS: 'dofus-player-professions',
  CHECK_LEVELS: 'dofus-check-profession-levels'
}

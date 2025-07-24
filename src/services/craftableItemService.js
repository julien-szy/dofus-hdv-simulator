// Service d'images d'items craftables pour Dofus
export class CraftableItemService {
  static getCraftableItemImage(itemId, iconId) {
    return `/images/craftable-items/${iconId}.png`
  }
  
  static getCraftableItemImageUrl(imagePath) {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) {
      // Convertir URL externe en URL locale
      const iconId = imagePath.split('/').pop()
      return `/images/craftable-items/${iconId}`
    }
    return imagePath
  }
  
  static isCraftableItem(item) {
    // Un item est craftable s'il a une recette
    return item.hasRecipe || item.craftable
  }
}

export default CraftableItemService

// Service d'images de matériaux pour Dofus
export class MaterialService {
  static getMaterialImage(materialId, iconId) {
    return `/images/materials/${iconId}.png`
  }
  
  static getMaterialImageUrl(imagePath) {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) {
      // Convertir URL externe en URL locale
      const iconId = imagePath.split('/').pop()
      return `/images/materials/${iconId}`
    }
    return imagePath
  }
  
  static isMaterial(item) {
    // Considérer comme matériau si pas d'équipement
    return !item.level || item.level === 0 || item.type?.includes('Ressource')
  }
}

export default MaterialService

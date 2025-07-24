// Service d'images 100% local - pas d'appels API
class LocalImageService {
  constructor() {
    // Toutes les images sont maintenant locales
    this.baseUrl = '/images/items'
    this.cache = new Map()
    
    // Images par défaut statiques
    this.defaultImages = {
      item: '/images/defaults/default-item.svg',
      resource: '/images/defaults/default-resource.svg',
      equipment: '/images/defaults/default-equipment.svg',
      loading: '/images/defaults/loading.svg',
      error: '/images/defaults/error.svg'
    }
    
    // Statistiques
    this.stats = {
      requests: 0,
      hits: 0,
      misses: 0,
      errors: 0
    }
  }

  // Obtenir l'URL d'une image locale
  getImageUrl(iconId, type = 'item') {
    this.stats.requests++

    if (!iconId) {
      return this.defaultImages[type] || this.defaultImages.item
    }

    // Construire l'URL locale
    const imageUrl = `${this.baseUrl}/${iconId}.png`
    
    // Mettre en cache
    this.cache.set(iconId, imageUrl)
    this.stats.hits++
    
    return imageUrl
  }

  // Vérifier si une image existe localement (optionnel)
  async checkImageExists(iconId) {
    if (!iconId) return false
    
    try {
      const imageUrl = `${this.baseUrl}/${iconId}.png`
      const response = await fetch(imageUrl, { method: 'HEAD' })
      return response.ok
    } catch (error) {
      return false
    }
  }

  // Obtenir l'URL avec vérification d'existence
  async getImageUrlWithCheck(iconId, type = 'item') {
    if (!iconId) {
      return this.defaultImages[type] || this.defaultImages.item
    }

    const exists = await this.checkImageExists(iconId)
    
    if (exists) {
      this.stats.hits++
      return `${this.baseUrl}/${iconId}.png`
    } else {
      this.stats.misses++
      return this.defaultImages[type] || this.defaultImages.item
    }
  }

  // Obtenir les statistiques
  getStats() {
    const hitRate = this.stats.requests > 0 ? (this.stats.hits / this.stats.requests * 100).toFixed(1) : 0
    
    return {
      cached: this.cache.size,
      requests: this.stats.requests,
      hits: this.stats.hits,
      misses: this.stats.misses,
      errors: this.stats.errors,
      hitRate: `${hitRate}%`,
      mode: 'local'
    }
  }

  // Nettoyer le cache
  clearCache() {
    this.cache.clear()
  }

  // Pré-charger des images (simulation pour compatibilité)
  async preloadImages(iconIds, type = 'item') {
    // En mode local, pas besoin de pré-charger
    return { loaded: iconIds.length, failed: 0 }
  }

  // Créer un composant React optimisé pour les images locales
  createImageComponent() {
    return ({ iconId, type = 'item', alt = '', className = '', style = {}, size = 'medium' }) => {
      const [imageSrc, setImageSrc] = React.useState(this.getImageUrl(iconId, type))
      const [hasError, setHasError] = React.useState(false)

      // Tailles prédéfinies
      const sizes = {
        small: { width: 32, height: 32 },
        medium: { width: 48, height: 48 },
        large: { width: 64, height: 64 },
        xl: { width: 96, height: 96 }
      }

      const sizeStyle = typeof size === 'string' ? sizes[size] : size

      const handleError = () => {
        if (!hasError) {
          setImageSrc(this.defaultImages[type] || this.defaultImages.item)
          setHasError(true)
          this.stats.errors++
        }
      }

      const handleLoad = () => {
        if (iconId && !hasError) {
          this.cache.set(iconId, imageSrc)
        }
      }

      return React.createElement('img', {
        src: imageSrc,
        alt: alt || `Image ${iconId}`,
        className: `local-image ${className}`,
        style: {
          ...sizeStyle,
          objectFit: 'contain',
          ...style
        },
        onError: handleError,
        onLoad: handleLoad,
        loading: 'lazy'
      })
    }
  }
}

// Instance globale
const localImageService = new LocalImageService()

export default localImageService
export { LocalImageService }

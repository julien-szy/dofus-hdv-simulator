// Service optimisé pour la gestion des images avec fallback intelligent
class ImageService {
  constructor() {
    this.baseUrl = 'https://api.dofusdb.fr/img/items'
    this.cache = new Map()
    this.failedImages = new Set()
    this.loadingImages = new Map()

    // Images par défaut statiques (SVG pour rapidité)
    this.defaultImages = {
      item: '/images/defaults/default-item.svg',
      resource: '/images/defaults/default-resource.svg',
      equipment: '/images/defaults/default-equipment.svg',
      loading: '/images/defaults/loading.svg',
      error: '/images/defaults/error.svg'
    }

    // Timeout pour les images (2 secondes max pour être plus réactif)
    this.imageTimeout = 2000

    // Mode dégradé (utilise seulement les images par défaut)
    this.degradedMode = false

    // Statistiques
    this.stats = {
      requests: 0,
      hits: 0,
      misses: 0,
      errors: 0,
      timeouts: 0
    }
  }

  // Activer/désactiver le mode dégradé
  setDegradedMode(enabled) {
    this.degradedMode = enabled
    console.log(`🔧 Mode dégradé: ${enabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`)
  }

  // Obtenir l'URL d'une image avec fallback intelligent
  getImageUrl(iconId, type = 'item') {
    this.stats.requests++

    if (!iconId) {
      return this.defaultImages[type] || this.defaultImages.item
    }

    // Mode dégradé : utiliser seulement les images par défaut
    if (this.degradedMode) {
      return this.defaultImages[type] || this.defaultImages.item
    }

    // Si l'image a déjà échoué, retourner l'image par défaut
    if (this.failedImages.has(iconId)) {
      this.stats.errors++
      return this.defaultImages[type] || this.defaultImages.item
    }

    // Si l'image est en cache, la retourner
    if (this.cache.has(iconId)) {
      this.stats.hits++
      return this.cache.get(iconId)
    }

    this.stats.misses++

    // Construire l'URL DofusDB
    const imageUrl = `${this.baseUrl}/${iconId}.png`

    // Pré-charger l'image en arrière-plan (sans bloquer)
    this.preloadImage(iconId, imageUrl, type)

    // Retourner l'URL DofusDB (qui sera remplacée par défaut si échec)
    return imageUrl
  }

  // Pré-charger une image avec timeout
  async preloadImage(iconId, imageUrl, type = 'item') {
    // Éviter les doublons de chargement
    if (this.loadingImages.has(iconId)) {
      return this.loadingImages.get(iconId)
    }

    const loadPromise = new Promise((resolve, reject) => {
      const img = new Image()
      const timeoutId = setTimeout(() => {
        console.warn(`⏰ Timeout pour image: ${iconId}`)
        this.failedImages.add(iconId)
        this.stats.timeouts++
        reject(new Error('Timeout'))
      }, this.imageTimeout)

      img.onload = () => {
        clearTimeout(timeoutId)
        this.cache.set(iconId, imageUrl)
        console.log(`✅ Image chargée: ${iconId}`)
        resolve(imageUrl)
      }

      img.onerror = () => {
        clearTimeout(timeoutId)
        console.warn(`❌ Erreur chargement image: ${iconId}`)
        this.failedImages.add(iconId)
        this.stats.errors++
        reject(new Error('Load failed'))
      }

      img.src = imageUrl
    })

    this.loadingImages.set(iconId, loadPromise)
    
    try {
      await loadPromise
    } catch (error) {
      // En cas d'erreur, ne pas bloquer
    } finally {
      this.loadingImages.delete(iconId)
    }
  }

  // Composant React pour afficher une image avec fallback
  createImageComponent() {
    return ({ iconId, type = 'item', alt = '', className = '', style = {} }) => {
      const [imageSrc, setImageSrc] = React.useState(this.getImageUrl(iconId, type))
      const [hasError, setHasError] = React.useState(false)

      const handleError = () => {
        if (!hasError) {
          console.warn(`🖼️ Fallback pour image: ${iconId}`)
          this.failedImages.add(iconId)
          setImageSrc(this.defaultImages[type] || this.defaultImages.item)
          setHasError(true)
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
        className: `item-image ${className}`,
        style: {
          maxWidth: '100%',
          height: 'auto',
          ...style
        },
        onError: handleError,
        onLoad: handleLoad,
        loading: 'lazy' // Lazy loading pour les performances
      })
    }
  }

  // Pré-charger un lot d'images (non-bloquant)
  async preloadBatch(iconIds, type = 'item', maxConcurrent = 5) {
    console.log(`🚀 Pré-chargement de ${iconIds.length} images (${type})`)
    
    const chunks = []
    for (let i = 0; i < iconIds.length; i += maxConcurrent) {
      chunks.push(iconIds.slice(i, i + maxConcurrent))
    }

    let loaded = 0
    let failed = 0

    for (const chunk of chunks) {
      const promises = chunk.map(async (iconId) => {
        try {
          const imageUrl = `${this.baseUrl}/${iconId}.png`
          await this.preloadImage(iconId, imageUrl, type)
          loaded++
        } catch (error) {
          failed++
        }
      })

      await Promise.allSettled(promises)
      
      // Petit délai entre les chunks
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`📊 Pré-chargement terminé: ${loaded} réussies, ${failed} échouées`)
    return { loaded, failed }
  }

  // Nettoyer le cache (utile pour libérer la mémoire)
  clearCache() {
    this.cache.clear()
    this.failedImages.clear()
    this.loadingImages.clear()
    console.log('🧹 Cache d\'images nettoyé')
  }

  // Obtenir les statistiques du cache
  getStats() {
    const hitRate = this.stats.requests > 0 ? (this.stats.hits / this.stats.requests * 100).toFixed(1) : 0

    return {
      cached: this.cache.size,
      failed: this.failedImages.size,
      loading: this.loadingImages.size,
      requests: this.stats.requests,
      hits: this.stats.hits,
      misses: this.stats.misses,
      errors: this.stats.errors,
      timeouts: this.stats.timeouts,
      hitRate: `${hitRate}%`,
      degradedMode: this.degradedMode
    }
  }

  // Afficher les statistiques
  printStats() {
    const stats = this.getStats()
    console.log('\n📊 STATISTIQUES IMAGES:')
    console.log(`- Requêtes: ${stats.requests}`)
    console.log(`- Cache hits: ${stats.hits} (${stats.hitRate})`)
    console.log(`- Cache misses: ${stats.misses}`)
    console.log(`- Erreurs: ${stats.errors}`)
    console.log(`- Timeouts: ${stats.timeouts}`)
    console.log(`- Images en cache: ${stats.cached}`)
    console.log(`- Images échouées: ${stats.failed}`)
    console.log(`- Mode dégradé: ${stats.degradedMode ? 'OUI' : 'NON'}`)
  }

  // Détecter automatiquement si on doit passer en mode dégradé
  autoDetectDegradedMode() {
    const errorRate = this.stats.requests > 10 ? (this.stats.errors + this.stats.timeouts) / this.stats.requests : 0

    if (errorRate > 0.5 && !this.degradedMode) {
      console.warn(`⚠️ Taux d'erreur élevé (${(errorRate * 100).toFixed(1)}%), activation du mode dégradé`)
      this.setDegradedMode(true)
    } else if (errorRate < 0.1 && this.degradedMode) {
      console.log(`✅ Taux d'erreur faible (${(errorRate * 100).toFixed(1)}%), désactivation du mode dégradé`)
      this.setDegradedMode(false)
    }
  }

  // Créer les images par défaut si elles n'existent pas
  async createDefaultImages() {
    const defaultImageData = {
      item: this.createDefaultItemSVG(),
      resource: this.createDefaultResourceSVG(),
      equipment: this.createDefaultEquipmentSVG()
    }

    // En production, ces images devraient être des vraies images
    // Pour l'instant, on utilise des SVG générés
    return defaultImageData
  }

  // Générer un SVG par défaut pour les items
  createDefaultItemSVG() {
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/>
        <text x="32" y="35" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">📦</text>
        <text x="32" y="50" text-anchor="middle" font-family="Arial" font-size="8" fill="#999">Item</text>
      </svg>
    `)}`
  }

  // Générer un SVG par défaut pour les ressources
  createDefaultResourceSVG() {
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" fill="#e8f5e8" stroke="#4caf50" stroke-width="2"/>
        <text x="32" y="35" text-anchor="middle" font-family="Arial" font-size="12" fill="#2e7d32">🧱</text>
        <text x="32" y="50" text-anchor="middle" font-family="Arial" font-size="8" fill="#4caf50">Resource</text>
      </svg>
    `)}`
  }

  // Générer un SVG par défaut pour les équipements
  createDefaultEquipmentSVG() {
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" fill="#fff3e0" stroke="#ff9800" stroke-width="2"/>
        <text x="32" y="35" text-anchor="middle" font-family="Arial" font-size="12" fill="#e65100">⚔️</text>
        <text x="32" y="50" text-anchor="middle" font-family="Arial" font-size="8" fill="#ff9800">Equipment</text>
      </svg>
    `)}`
  }
}

// Instance globale
const imageService = new ImageService()

export default imageService
export { ImageService }

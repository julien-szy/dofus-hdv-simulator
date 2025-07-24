import React, { useState, useEffect } from 'react'
import imageService from '../services/imageService.js'

// Composant d'image optimisé avec fallback intelligent
const OptimizedImage = ({ 
  iconId, 
  type = 'item', 
  alt = '', 
  className = '', 
  style = {},
  size = 'medium',
  showPlaceholder = true,
  onLoad = null,
  onError = null
}) => {
  const [imageSrc, setImageSrc] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Tailles prédéfinies
  const sizes = {
    small: { width: 32, height: 32 },
    medium: { width: 48, height: 48 },
    large: { width: 64, height: 64 },
    xl: { width: 96, height: 96 }
  }

  const sizeStyle = typeof size === 'string' ? sizes[size] : size

  useEffect(() => {
    if (!iconId) {
      setImageSrc(imageService.defaultImages[type] || imageService.defaultImages.item)
      setIsLoading(false)
      return
    }

    // Réinitialiser l'état
    setIsLoading(true)
    setHasError(false)

    // Obtenir l'URL de l'image
    const imageUrl = imageService.getImageUrl(iconId, type)
    setImageSrc(imageUrl)

    // Si c'est une image par défaut, pas besoin de charger
    if (imageUrl.startsWith('data:') || imageUrl.includes('default-')) {
      setIsLoading(false)
      return
    }

    // Pré-charger l'image pour vérifier qu'elle existe
    const img = new Image()
    const timeoutId = setTimeout(() => {
      console.warn(`⏰ Timeout pour image: ${iconId}`)
      handleImageError()
    }, 3000)

    img.onload = () => {
      clearTimeout(timeoutId)
      setIsLoading(false)
      imageService.cache.set(iconId, imageUrl)
      onLoad && onLoad()
    }

    img.onerror = () => {
      clearTimeout(timeoutId)
      handleImageError()
    }

    img.src = imageUrl

    return () => {
      clearTimeout(timeoutId)
    }
  }, [iconId, type])

  const handleImageError = () => {
    if (!hasError) {
      console.warn(`🖼️ Fallback pour image: ${iconId}`)
      imageService.failedImages.add(iconId)
      setImageSrc(imageService.defaultImages[type] || imageService.defaultImages.item)
      setHasError(true)
      setIsLoading(false)
      onError && onError()
    }
  }

  const handleImageLoad = () => {
    setIsLoading(false)
    if (iconId && !hasError) {
      imageService.cache.set(iconId, imageSrc)
    }
    onLoad && onLoad()
  }

  // Placeholder pendant le chargement
  const renderPlaceholder = () => {
    if (!showPlaceholder) return null

    return (
      <div 
        className={`image-placeholder ${className}`}
        style={{
          ...sizeStyle,
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          fontSize: '12px',
          ...style
        }}
      >
        {isLoading ? '⏳' : '📦'}
      </div>
    )
  }

  // Si pas d'iconId et pas de placeholder, ne rien afficher
  if (!iconId && !showPlaceholder) {
    return null
  }

  // Afficher le placeholder pendant le chargement
  if (isLoading && showPlaceholder) {
    return renderPlaceholder()
  }

  return (
    <img
      src={imageSrc}
      alt={alt || `Image ${iconId || 'par défaut'}`}
      className={`optimized-image ${className} ${hasError ? 'has-error' : ''}`}
      style={{
        ...sizeStyle,
        objectFit: 'contain',
        ...style
      }}
      onError={handleImageError}
      onLoad={handleImageLoad}
      loading="lazy"
    />
  )
}

// Composant pour afficher une liste d'images avec lazy loading
const ImageGrid = ({ 
  items = [], 
  getIconId = (item) => item.iconId,
  getType = () => 'item',
  getAlt = (item) => item.name || '',
  className = '',
  imageSize = 'medium',
  maxImages = 50
}) => {
  const [visibleCount, setVisibleCount] = useState(Math.min(20, maxImages))

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 20, maxImages, items.length))
  }

  const visibleItems = items.slice(0, visibleCount)
  const hasMore = visibleCount < Math.min(maxImages, items.length)

  return (
    <div className={`image-grid ${className}`}>
      <div className="grid-container" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
        gap: '8px',
        padding: '8px'
      }}>
        {visibleItems.map((item, index) => (
          <div key={index} className="grid-item">
            <OptimizedImage
              iconId={getIconId(item)}
              type={getType(item)}
              alt={getAlt(item)}
              size={imageSize}
              showPlaceholder={true}
            />
          </div>
        ))}
      </div>
      
      {hasMore && (
        <div className="load-more" style={{ textAlign: 'center', padding: '16px' }}>
          <button 
            onClick={loadMore}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Charger plus ({items.length - visibleCount} restantes)
          </button>
        </div>
      )}
    </div>
  )
}

// Hook pour pré-charger des images
const useImagePreloader = () => {
  const preloadImages = async (iconIds, type = 'item') => {
    if (!iconIds || iconIds.length === 0) return

    console.log(`🚀 Pré-chargement de ${iconIds.length} images`)
    
    // Pré-charger par petits lots pour ne pas surcharger
    const batchSize = 5
    for (let i = 0; i < iconIds.length; i += batchSize) {
      const batch = iconIds.slice(i, i + batchSize)
      
      const promises = batch.map(iconId => {
        if (!iconId || imageService.cache.has(iconId) || imageService.failedImages.has(iconId)) {
          return Promise.resolve()
        }
        
        return imageService.preloadImage(iconId, `${imageService.baseUrl}/${iconId}.png`, type)
          .catch(() => {}) // Ignorer les erreurs
      })
      
      await Promise.allSettled(promises)
      
      // Petite pause entre les lots
      if (i + batchSize < iconIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }

  return { preloadImages }
}

export default OptimizedImage
export { ImageGrid, useImagePreloader }

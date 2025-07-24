import React, { useState } from 'react'

// Composant d'image local simple et rapide
const LocalImage = ({ 
  iconId, 
  type = 'item', 
  alt = '', 
  className = '', 
  style = {},
  size = 'medium',
  showPlaceholder = true
}) => {
  const [hasError, setHasError] = useState(false)

  // Tailles prédéfinies
  const sizes = {
    small: { width: 32, height: 32 },
    medium: { width: 48, height: 48 },
    large: { width: 64, height: 64 },
    xl: { width: 96, height: 96 }
  }

  const sizeStyle = typeof size === 'string' ? sizes[size] : size

  // Images par défaut
  const defaultImages = {
    item: '/images/defaults/default-item.svg',
    resource: '/images/defaults/default-resource.svg',
    equipment: '/images/defaults/default-equipment.svg'
  }

  // Obtenir l'URL de l'image
  const getImageSrc = () => {
    if (!iconId || hasError) {
      return defaultImages[type] || defaultImages.item
    }
    return `/images/items/${iconId}.png`
  }

  const handleError = () => {
    setHasError(true)
  }

  const handleLoad = () => {
    // Image chargée avec succès
  }

  // Si pas d'iconId et pas de placeholder, ne rien afficher
  if (!iconId && !showPlaceholder) {
    return null
  }

  return (
    <img
      src={getImageSrc()}
      alt={alt || `Image ${iconId || 'par défaut'}`}
      className={`local-image ${className} ${hasError ? 'has-error' : ''}`}
      style={{
        ...sizeStyle,
        objectFit: 'contain',
        ...style
      }}
      onError={handleError}
      onLoad={handleLoad}
      loading="lazy"
    />
  )
}

// Composant pour afficher une grille d'images
const LocalImageGrid = ({ 
  items = [], 
  getIconId = (item) => item.iconId,
  getType = () => 'item',
  getAlt = (item) => item.name || '',
  className = '',
  imageSize = 'medium',
  maxImages = 100
}) => {
  const visibleItems = items.slice(0, maxImages)

  return (
    <div className={`local-image-grid ${className}`}>
      <div className="grid-container" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
        gap: '8px',
        padding: '8px'
      }}>
        {visibleItems.map((item, index) => (
          <div key={index} className="grid-item">
            <LocalImage
              iconId={getIconId(item)}
              type={getType(item)}
              alt={getAlt(item)}
              size={imageSize}
              showPlaceholder={true}
            />
          </div>
        ))}
      </div>
      
      {items.length > maxImages && (
        <div className="overflow-notice" style={{ 
          textAlign: 'center', 
          padding: '8px',
          color: '#666',
          fontSize: '12px'
        }}>
          ... et {items.length - maxImages} autres images
        </div>
      )}
    </div>
  )
}

// Hook pour les utilitaires d'images locales
const useLocalImages = () => {
  const getImageUrl = (iconId, type = 'item') => {
    if (!iconId) {
      const defaultImages = {
        item: '/images/defaults/default-item.svg',
        resource: '/images/defaults/default-resource.svg',
        equipment: '/images/defaults/default-equipment.svg'
      }
      return defaultImages[type] || defaultImages.item
    }
    return `/images/items/${iconId}.png`
  }

  const checkImageExists = async (iconId) => {
    if (!iconId) return false
    
    try {
      const response = await fetch(`/images/items/${iconId}.png`, { method: 'HEAD' })
      return response.ok
    } catch (error) {
      return false
    }
  }

  const preloadImages = async (iconIds) => {
    // En mode local, les images se chargent rapidement
    // Pas besoin de pré-chargement complexe
    return { loaded: iconIds.length, failed: 0 }
  }

  return {
    getImageUrl,
    checkImageExists,
    preloadImages
  }
}

export default LocalImage
export { LocalImageGrid, useLocalImages }

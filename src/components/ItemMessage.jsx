import { useState, useEffect } from 'react'

const ItemMessage = ({ type, message, onClose, autoClose = true, duration = 4000 }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // Attendre la fin de l'animation
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [autoClose, duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'no-recipe': return '🚫'
      case 'success': return '✅'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      case 'error': return '❌'
      default: return 'ℹ️'
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'no-recipe': return 'Pas de recette de craft'
      case 'success': return 'Succès'
      case 'warning': return 'Attention'
      case 'info': return 'Information'
      case 'error': return 'Erreur'
      default: return 'Information'
    }
  }

  if (!isVisible) return null

  return (
    <div className={`item-message item-message-${type} ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="item-message-content">
        <div className="item-message-header">
          <div className="item-message-icon">{getIcon()}</div>
          <div className="item-message-title">{getTitle()}</div>
          <button 
            onClick={() => {
              setIsVisible(false)
              setTimeout(onClose, 300)
            }}
            className="item-message-close"
          >
            ✕
          </button>
        </div>
        <div className="item-message-body">
          {message}
        </div>
        {type === 'no-recipe' && (
          <div className="item-message-actions">
            <button 
              onClick={() => {
                // TODO: Ajouter à la blacklist
                console.log('Ajouter à la blacklist')
                setIsVisible(false)
                setTimeout(onClose, 300)
              }}
              className="btn btn-secondary btn-sm"
            >
              🚫 Ne plus afficher cet item
            </button>
          </div>
        )}
      </div>
      <div className="item-message-progress">
        <div 
          className="item-message-progress-bar"
          style={{ 
            animationDuration: autoClose ? `${duration}ms` : 'none'
          }}
        ></div>
      </div>
    </div>
  )
}

export default ItemMessage

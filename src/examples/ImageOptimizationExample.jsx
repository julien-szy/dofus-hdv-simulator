import React, { useState, useEffect } from 'react'
import OptimizedImage, { ImageGrid, useImagePreloader } from '../components/OptimizedImage.jsx'
import { getImageUrl, preloadImages, extractIconIds, setDegradedMode, getImageStats, printImageStats } from '../utils/imageUtils.js'

// Exemple d'utilisation du système d'images optimisé
const ImageOptimizationExample = () => {
  const [items, setItems] = useState([])
  const [stats, setStats] = useState({})
  const [degradedMode, setDegradedModeState] = useState(false)
  const { preloadImages: preloadHook } = useImagePreloader()

  // Données d'exemple
  const sampleItems = [
    { id: 1, name: 'Épée en Bois', iconId: '1234', type: 'equipment' },
    { id: 2, name: 'Minerai de Fer', iconId: '5678', type: 'resource' },
    { id: 3, name: 'Potion de Vie', iconId: '9012', type: 'item' },
    { id: 4, name: 'Armure en Cuir', iconId: '3456', type: 'equipment' },
    { id: 5, name: 'Bois de Frêne', iconId: '7890', type: 'resource' }
  ]

  useEffect(() => {
    setItems(sampleItems)
    
    // Pré-charger les images en arrière-plan
    const iconIds = extractIconIds(sampleItems)
    preloadImages(iconIds, 'item')
    
    // Mettre à jour les stats toutes les 2 secondes
    const interval = setInterval(() => {
      setStats(getImageStats())
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])

  const handleToggleDegradedMode = () => {
    const newMode = !degradedMode
    setDegradedMode(newMode)
    setDegradedModeState(newMode)
  }

  const handlePrintStats = () => {
    printImageStats()
  }

  const handlePreloadAll = async () => {
    const iconIds = extractIconIds(items)
    await preloadImages(iconIds, 'item')
    setStats(getImageStats())
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎨 Système d'Images Optimisé</h1>
      
      {/* Contrôles */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Contrôles</h3>
        <button 
          onClick={handleToggleDegradedMode}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: degradedMode ? '#f44336' : '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Mode dégradé: {degradedMode ? 'ON' : 'OFF'}
        </button>
        
        <button 
          onClick={handlePreloadAll}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Pré-charger toutes les images
        </button>
        
        <button 
          onClick={handlePrintStats}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Afficher stats dans console
        </button>
      </div>

      {/* Statistiques */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <h3>📊 Statistiques en temps réel</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
          <div><strong>Requêtes:</strong> {stats.requests || 0}</div>
          <div><strong>Cache hits:</strong> {stats.hits || 0}</div>
          <div><strong>Cache misses:</strong> {stats.misses || 0}</div>
          <div><strong>Erreurs:</strong> {stats.errors || 0}</div>
          <div><strong>Timeouts:</strong> {stats.timeouts || 0}</div>
          <div><strong>Taux de réussite:</strong> {stats.hitRate || '0%'}</div>
          <div><strong>Images en cache:</strong> {stats.cached || 0}</div>
          <div><strong>Images échouées:</strong> {stats.failed || 0}</div>
          <div><strong>Mode dégradé:</strong> {stats.degradedMode ? 'OUI' : 'NON'}</div>
        </div>
      </div>

      {/* Exemples d'images individuelles */}
      <div style={{ marginBottom: '20px' }}>
        <h3>🖼️ Images individuelles</h3>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {items.map(item => (
            <div key={item.id} style={{ textAlign: 'center', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}>
              <OptimizedImage
                iconId={item.iconId}
                type={item.type}
                alt={item.name}
                size="large"
                showPlaceholder={true}
              />
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                <div><strong>{item.name}</strong></div>
                <div>ID: {item.iconId}</div>
                <div>Type: {item.type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grille d'images */}
      <div style={{ marginBottom: '20px' }}>
        <h3>🎯 Grille d'images avec lazy loading</h3>
        <ImageGrid
          items={items}
          getIconId={(item) => item.iconId}
          getType={(item) => item.type}
          getAlt={(item) => item.name}
          imageSize="medium"
          maxImages={50}
          className="example-grid"
        />
      </div>

      {/* Exemples de différentes tailles */}
      <div style={{ marginBottom: '20px' }}>
        <h3>📏 Différentes tailles</h3>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <OptimizedImage iconId="1234" size="small" />
            <div style={{ fontSize: '12px', marginTop: '4px' }}>Small (32px)</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <OptimizedImage iconId="1234" size="medium" />
            <div style={{ fontSize: '12px', marginTop: '4px' }}>Medium (48px)</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <OptimizedImage iconId="1234" size="large" />
            <div style={{ fontSize: '12px', marginTop: '4px' }}>Large (64px)</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <OptimizedImage iconId="1234" size="xl" />
            <div style={{ fontSize: '12px', marginTop: '4px' }}>XL (96px)</div>
          </div>
        </div>
      </div>

      {/* Images par défaut */}
      <div style={{ marginBottom: '20px' }}>
        <h3>🎨 Images par défaut</h3>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ textAlign: 'center' }}>
            <OptimizedImage iconId={null} type="item" size="large" />
            <div style={{ fontSize: '12px', marginTop: '4px' }}>Item par défaut</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <OptimizedImage iconId={null} type="resource" size="large" />
            <div style={{ fontSize: '12px', marginTop: '4px' }}>Resource par défaut</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <OptimizedImage iconId={null} type="equipment" size="large" />
            <div style={{ fontSize: '12px', marginTop: '4px' }}>Equipment par défaut</div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div style={{ padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '8px', border: '1px solid #b3d9ff' }}>
        <h3>💡 Instructions d'utilisation</h3>
        <ul style={{ lineHeight: '1.6' }}>
          <li><strong>Mode normal:</strong> Tente de charger les images depuis DofusDB avec fallback automatique</li>
          <li><strong>Mode dégradé:</strong> Utilise uniquement les images par défaut (plus rapide)</li>
          <li><strong>Timeout:</strong> 2 secondes maximum par image</li>
          <li><strong>Cache intelligent:</strong> Les images réussies sont mises en cache</li>
          <li><strong>Détection automatique:</strong> Passe en mode dégradé si trop d'erreurs</li>
          <li><strong>Lazy loading:</strong> Les images se chargent seulement quand nécessaire</li>
        </ul>
      </div>
    </div>
  )
}

export default ImageOptimizationExample

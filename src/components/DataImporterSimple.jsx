import { useState } from 'react'

const DataImporterSimple = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('Interface d\'import simplifiée pour debug')

  if (!isOpen) return null

  return (
    <div className="importer-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="importer-modal">
        <div className="importer-header">
          <h2>🔧 Import de Données (Version Simple)</h2>
          <button onClick={onClose} className="modal-close-btn">✕</button>
        </div>

        <div className="importer-content">
          <div className="debug-info">
            <h3>🐛 Version de debug</h3>
            <p>{message}</p>
            <p>Cette version simplifiée permet de tester si l'erreur React #62 vient du composant DataImporter.</p>
            
            <button 
              onClick={() => setMessage('Test réussi ! Le composant simple fonctionne.')}
              className="btn btn-primary"
            >
              🧪 Test Simple
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataImporterSimple

import { useState, useEffect } from 'react'

const NetlifyExtractor = ({ isOpen, onClose }) => {
  const [jobs, setJobs] = useState([])
  const [extractionLog, setExtractionLog] = useState([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [progress, setProgress] = useState({ completed: 0, total: 0 })

  useEffect(() => {
    if (isOpen) {
      loadJobs()
    }
  }, [isOpen])

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setExtractionLog(prev => [...prev, { timestamp, message, type }])
  }

  // Charger tous les métiers
  const loadJobs = async () => {
    try {
      addLog('🔍 Chargement des métiers...', 'info')
      
      const response = await fetch('/.netlify/functions/extract-data', {
        method: 'POST',
        body: JSON.stringify({ action: 'get_jobs' })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setJobs(data.jobs)
        addLog(`✅ ${data.jobs.length} métiers chargés`, 'success')
      } else {
        addLog(`❌ Erreur: ${data.error}`, 'error')
      }
    } catch (error) {
      addLog(`❌ Erreur chargement métiers: ${error.message}`, 'error')
    }
  }

  // Extraire un métier spécifique
  const extractJob = async (jobId, jobName, limit = 100) => {
    try {
      addLog(`🔧 Extraction ${jobName} (${limit} recettes max)...`, 'info')
      
      const response = await fetch('/.netlify/functions/extract-data', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'extract_job', 
          jobId: jobId,
          limit: limit
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        const { items, resources, recipes, imageIds } = data.data
        addLog(`✅ ${jobName}: ${items.length} items, ${resources.length} ressources, ${recipes.length} recettes`, 'success')
        addLog(`📸 ${imageIds.length} images identifiées`, 'info')
        
        // TODO: Sauvegarder en base de données
        addLog(`💾 Sauvegarde en BDD à implémenter`, 'warning')
        
        return data.data
      } else {
        addLog(`❌ Erreur ${jobName}: ${data.error}`, 'error')
        return null
      }
    } catch (error) {
      addLog(`❌ Erreur extraction ${jobName}: ${error.message}`, 'error')
      return null
    }
  }

  // Extraire tous les métiers
  const extractAllJobs = async () => {
    if (isExtracting) return
    
    setIsExtracting(true)
    setExtractionLog([])
    setProgress({ completed: 0, total: jobs.length })
    
    try {
      addLog('🚀 Début extraction complète...', 'info')
      
      let allItems = []
      let allResources = []
      let allRecipes = []
      
      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i]
        
        const data = await extractJob(job.id, job.name, 200)
        
        if (data) {
          allItems.push(...data.items)
          allResources.push(...data.resources)
          allRecipes.push(...data.recipes)
        }
        
        setProgress({ completed: i + 1, total: jobs.length })
        
        // Pause entre les métiers
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      // Dédupliquer les ressources
      const uniqueResources = Array.from(
        new Map(allResources.map(r => [r.m_id, r])).values()
      )
      
      addLog(`📊 TOTAL: ${allItems.length} items, ${uniqueResources.length} ressources uniques, ${allRecipes.length} recettes`, 'success')
      addLog('✅ Extraction terminée !', 'success')
      
    } catch (error) {
      addLog(`❌ Erreur fatale: ${error.message}`, 'error')
    } finally {
      setIsExtracting(false)
    }
  }

  // Extraire un métier spécifique
  const extractSingleJob = async (job) => {
    if (isExtracting) return
    
    setIsExtracting(true)
    
    try {
      await extractJob(job.id, job.name, 500)
    } finally {
      setIsExtracting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="netlify-extractor-modal">
      <div className="netlify-extractor-content">
        <div className="netlify-extractor-header">
          <h3>🌐 Extraction Netlify</h3>
          <button onClick={onClose} className="netlify-extractor-close">✕</button>
        </div>

        <div className="netlify-extractor-body">
          {/* Informations importantes */}
          <div className="extraction-info">
            <h4>⚠️ Limitations Netlify</h4>
            <ul>
              <li>• Timeout de 10 secondes par fonction</li>
              <li>• Impossible de stocker des images directement</li>
              <li>• Extraction par petits batches recommandée</li>
              <li>• Utilise GitHub Actions pour les images</li>
            </ul>
          </div>

          {/* Actions principales */}
          <div className="extraction-actions">
            <button
              onClick={loadJobs}
              disabled={isExtracting}
              className="btn btn-secondary"
            >
              🔄 Recharger métiers
            </button>
            
            <button
              onClick={extractAllJobs}
              disabled={isExtracting || jobs.length === 0}
              className="btn btn-primary"
            >
              {isExtracting ? '🔄 Extraction...' : '🚀 Extraire tout'}
            </button>
          </div>

          {/* Progrès */}
          {isExtracting && (
            <div className="extraction-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                ></div>
              </div>
              <div className="progress-text">
                {progress.completed} / {progress.total} métiers
              </div>
            </div>
          )}

          {/* Liste des métiers */}
          <div className="jobs-list">
            <h4>📋 Métiers disponibles ({jobs.length})</h4>
            <div className="jobs-grid">
              {jobs.map(job => (
                <div key={job.id} className="job-card">
                  <div className="job-info">
                    <div className="job-name">{job.name}</div>
                    <div className="job-id">ID: {job.id}</div>
                  </div>
                  <button
                    onClick={() => extractSingleJob(job)}
                    disabled={isExtracting}
                    className="btn btn-sm btn-secondary"
                  >
                    Extraire
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Log d'extraction */}
          {extractionLog.length > 0 && (
            <div className="extraction-log">
              <h4>📝 Journal d'extraction</h4>
              <div className="log-container">
                {extractionLog.map((entry, index) => (
                  <div key={index} className={`log-entry log-${entry.type}`}>
                    <span className="log-time">{entry.timestamp}</span>
                    <span className="log-message">{entry.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommandations */}
          <div className="extraction-recommendations">
            <h4>💡 Recommandations</h4>
            <p>
              <strong>Pour les images :</strong> Utilise GitHub Actions ou exécute les scripts en local puis commit les fichiers.
            </p>
            <p>
              <strong>Pour la production :</strong> Cette méthode est idéale pour extraire les données, mais pas pour les images.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NetlifyExtractor

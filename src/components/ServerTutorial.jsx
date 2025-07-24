import { useState } from 'react'

const ServerTutorial = ({ isOpen, onClose, onOpenProfile }) => {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: "🌍 Serveur requis",
      content: "Pour saisir des prix et utiliser les tendances, vous devez d'abord définir votre serveur Dofus dans votre profil.",
      icon: "🌍"
    },
    {
      title: "👤 Accéder au profil",
      content: "Cliquez sur votre avatar en haut à droite pour ouvrir votre profil de personnage.",
      icon: "👤"
    },
    {
      title: "⚙️ Configurer le serveur",
      content: "Dans l'onglet 'Personnage', sélectionnez votre serveur Dofus dans la liste déroulante.",
      icon: "⚙️"
    },
    {
      title: "💰 Saisir les prix",
      content: "Une fois votre serveur défini, vous pourrez saisir des prix qui seront associés à ce serveur pour les tendances.",
      icon: "💰"
    }
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleOpenProfile = () => {
    onOpenProfile()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="tutorial-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tutorial-modal">
        <div className="tutorial-header">
          <h2>Configuration requise</h2>
          <button onClick={onClose} className="modal-close-btn">✕</button>
        </div>

        <div className="tutorial-content">
          <div className="tutorial-step">
            <div className="step-indicator">
              <div className="step-icon">{steps[currentStep].icon}</div>
              <div className="step-counter">{currentStep + 1} / {steps.length}</div>
            </div>

            <div className="step-content">
              <h3>{steps[currentStep].title}</h3>
              <p>{steps[currentStep].content}</p>
            </div>
          </div>

          <div className="tutorial-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
            <div className="progress-dots">
              {steps.map((_, index) => (
                <div 
                  key={index}
                  className={`progress-dot ${index <= currentStep ? 'active' : ''}`}
                  onClick={() => setCurrentStep(index)}
                ></div>
              ))}
            </div>
          </div>
        </div>

        <div className="tutorial-actions">
          <div className="tutorial-nav">
            <button 
              onClick={prevStep}
              disabled={currentStep === 0}
              className="btn btn-secondary"
            >
              ← Précédent
            </button>
            
            {currentStep < steps.length - 1 ? (
              <button 
                onClick={nextStep}
                className="btn btn-primary"
              >
                Suivant →
              </button>
            ) : (
              <button 
                onClick={handleOpenProfile}
                className="btn btn-primary btn-action"
              >
                👤 Ouvrir mon profil
              </button>
            )}
          </div>

          <div className="tutorial-skip">
            <button 
              onClick={onClose}
              className="btn btn-ghost"
            >
              Ignorer pour le moment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServerTutorial

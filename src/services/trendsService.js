// Service pour gérer les données de tendances des prix
import userService from './userService.js'

class TrendsService {
  constructor() {
    this.baseUrl = import.meta.env.DEV 
      ? 'http://localhost:8888/.netlify/functions/database'
      : '/.netlify/functions/database';
  }

  // Sauvegarder un prix anonymisé pour les tendances
  async savePriceTrend(itemId, itemName, server, priceData) {
    const user = userService.getCurrentUser()
    if (!user || !server) {
      console.log('🔄 Pas d\'utilisateur connecté ou serveur manquant, pas de sauvegarde tendance')
      return
    }

    try {
      const response = await fetch(`${this.baseUrl}?action=save_price_trend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          item_id: itemId,
          item_name: itemName,
          server: server,
          price_x1: priceData.price_1 || 0,
          price_x10: priceData.price_10 || 0,
          price_x100: priceData.price_100 || 0,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log(`📈 Tendance prix sauvegardée: ${itemName} sur ${server}`)
      return result
    } catch (error) {
      console.error('❌ Erreur sauvegarde tendance:', error)
      // Pas de throw - les tendances sont optionnelles
    }
  }

  // Récupérer l'historique des prix pour un item sur un serveur
  async getPriceHistory(itemId, server, days = 30) {
    try {
      const response = await fetch(
        `${this.baseUrl}?action=get_price_history&item_id=${itemId}&server=${encodeURIComponent(server)}&days=${days}`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const history = await response.json()
      console.log(`📊 ${history.length} points de données chargés pour ${itemId} sur ${server}`)
      
      return history
    } catch (error) {
      console.error('❌ Erreur chargement historique:', error)
      // Retourner un tableau vide en cas d'erreur
      return []
    }
  }



  // Calculer les statistiques de tendance
  calculateTrendStats(priceHistory) {
    if (priceHistory.length < 2) {
      return {
        trend: 'stable',
        percentage: 0,
        confidence: 'low',
        dataPoints: 0
      }
    }

    // Comparer les 7 derniers jours avec les 7 précédents
    const recent = priceHistory.slice(-7)
    const previous = priceHistory.slice(-14, -7)
    
    if (previous.length === 0) {
      return {
        trend: 'stable',
        percentage: 0,
        confidence: 'low',
        dataPoints: recent.reduce((sum, d) => sum + (d.data_points || 1), 0)
      }
    }

    const recentAvg = recent.reduce((sum, d) => sum + d.price_x1, 0) / recent.length
    const previousAvg = previous.reduce((sum, d) => sum + d.price_x1, 0) / previous.length
    
    const percentage = ((recentAvg - previousAvg) / previousAvg * 100)
    const totalDataPoints = recent.reduce((sum, d) => sum + (d.data_points || 1), 0)
    
    // Déterminer la confiance basée sur le nombre de points de données
    let confidence = 'low'
    if (totalDataPoints > 50) confidence = 'high'
    else if (totalDataPoints > 20) confidence = 'medium'
    
    let trend = 'stable'
    if (percentage > 5) trend = 'up'
    else if (percentage < -5) trend = 'down'
    
    return {
      trend,
      percentage: parseFloat(percentage.toFixed(1)),
      confidence,
      dataPoints: totalDataPoints
    }
  }

  // Obtenir le serveur actuel de l'utilisateur
  getCurrentUserServer() {
    try {
      const profileData = JSON.parse(localStorage.getItem('userProfile') || '{}')
      return profileData.server || null
    } catch (error) {
      console.error('Erreur lecture serveur utilisateur:', error)
      return null
    }
  }

  // Formater les prix pour l'affichage
  formatPrice(price) {
    if (!price) return '0 K'
    if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M K`
    if (price >= 1000) return `${(price / 1000).toFixed(0)}K K`
    return `${price} K`
  }

  // Obtenir les couleurs pour les graphiques
  getChartColors() {
    return {
      price_x1: {
        border: '#d4af37',
        background: 'rgba(212, 175, 55, 0.1)'
      },
      price_x10: {
        border: '#b8860b', 
        background: 'rgba(184, 134, 11, 0.1)'
      },
      price_x100: {
        border: '#8b7355',
        background: 'rgba(139, 115, 85, 0.1)'
      }
    }
  }
}

// Instance singleton
export const trendsService = new TrendsService()
export default trendsService

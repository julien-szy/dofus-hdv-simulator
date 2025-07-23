// Fonctions utilitaires de formatage

// Formater les kamas
export const formatKamas = (amount) => {
  return new Intl.NumberFormat('fr-FR').format(Math.floor(amount)) + ' K'
}

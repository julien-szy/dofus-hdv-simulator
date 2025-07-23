// Liste des métiers de craft Dofus
export const DOFUS_PROFESSIONS = {
  'Alchimiste': { id: 26, name: 'Alchimiste' },
  'Bijoutier': { id: 16, name: 'Bijoutier' },
  'Bricoleur': { id: 62, name: 'Bricoleur' },
  'Cordonnier': { id: 27, name: 'Cordonnier' },
  'Costumage': { id: 58, name: 'Costumage' },
  'Façonneur': { id: 63, name: 'Façonneur' },
  'Forgeron d\'Armes': { id: 11, name: 'Forgeron d\'Armes' },
  'Forgeron de Boucliers': { id: 13, name: 'Forgeron de Boucliers' },
  'Sculpteur': { id: 17, name: 'Sculpteur' },
  'Tailleur': { id: 15, name: 'Tailleur' }
}

// Correspondance entre types d'objets et métiers (quand l'API ne fournit pas l'info)
export const ITEM_TYPE_TO_PROFESSION = {
  'Anneau': 'Bijoutier',
  'Amulette': 'Bijoutier',
  'Épée': 'Forgeron d\'Armes',
  'Dague': 'Forgeron d\'Armes',
  'Marteau': 'Forgeron d\'Armes',
  'Pelle': 'Forgeron d\'Armes',
  'Pioche': 'Forgeron d\'Armes',
  'Hache': 'Forgeron d\'Armes',
  'Faux': 'Forgeron d\'Armes',
  'Arc': 'Sculpteur',
  'Baguette': 'Sculpteur',
  'Bâton': 'Sculpteur',
  'Bouclier': 'Forgeron de Boucliers',
  'Casque': 'Forgeron de Boucliers',
  'Cape': 'Tailleur',
  'Ceinture': 'Tailleur',
  'Bottes': 'Cordonnier',
  'Sac à dos': 'Tailleur',
  'Plastron': 'Tailleur'
}

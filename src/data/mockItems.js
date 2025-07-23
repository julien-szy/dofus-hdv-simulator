// Données d'exemple pour démonstration quand l'API n'est pas disponible
export const mockItems = [
  {
    ankama_id: 26584,
    name: "Épée du Bouftou",
    level: 1,
    type: {
      name: "Épée"
    },
    recipe: [
      {
        item_ankama_id: 289,
        item_subtype: "resource",
        quantity: 10
      },
      {
        item_ankama_id: 371,
        item_subtype: "resource", 
        quantity: 5
      }
    ]
  },
  {
    ankama_id: 26585,
    name: "Marteau du Mineur",
    level: 10,
    type: {
      name: "Marteau"
    },
    recipe: [
      {
        item_ankama_id: 442,
        item_subtype: "resource",
        quantity: 15
      },
      {
        item_ankama_id: 371,
        item_subtype: "resource",
        quantity: 8
      }
    ]
  },
  {
    ankama_id: 26586,
    name: "Baguette Magique",
    level: 20,
    type: {
      name: "Baguette"
    },
    recipe: [
      {
        item_ankama_id: 289,
        item_subtype: "resource",
        quantity: 20
      },
      {
        item_ankama_id: 442,
        item_subtype: "resource",
        quantity: 10
      }
    ]
  }
]

export const mockMaterials = {
  289: {
    ankama_id: 289,
    name: "Bois de Frêne",
    level: 1
  },
  371: {
    ankama_id: 371,
    name: "Fer",
    level: 10
  },
  442: {
    ankama_id: 442,
    name: "Cuivre",
    level: 5
  }
}

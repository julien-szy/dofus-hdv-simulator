import SearchResults from './SearchResults.jsx'

const SearchForm = ({ 
  searchTerm, 
  setSearchTerm, 
  searchResults, 
  loading, 
  selectItem, 
  playerProfessions, 
  checkProfessionLevels 
}) => {
  return (
    <div className="item-form">
      <h2 style={{ marginBottom: '20px', color: '#b8860b' }}>Rechercher un objet à crafter</h2>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="search">Nom de l'objet</label>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ex: Épée, Casque, Anneau..."
          />
        </div>
      </div>

      {/* Résultats de recherche */}
      <SearchResults 
        searchResults={searchResults}
        loading={loading}
        selectItem={selectItem}
        playerProfessions={playerProfessions}
        checkProfessionLevels={checkProfessionLevels}
      />

      {searchTerm.length >= 3 && searchResults.length === 0 && !loading && (
        <p style={{ color: '#f44336', marginTop: '15px' }}>
          Aucun objet trouvé pour "{searchTerm}"
        </p>
      )}
    </div>
  )
}

export default SearchForm

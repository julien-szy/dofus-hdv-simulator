import { execSync } from 'child_process';

console.log('🧹 Nettoyage du cache Netlify...');

try {
  // Vérifier le statut Git
  console.log('📋 Vérification du statut Git...');
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  
  if (status.trim()) {
    console.log('📝 Changements détectés, ajout au commit...');
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "fix: nettoyage cache Netlify"', { stdio: 'inherit' });
  }
  
  // Créer un fichier pour forcer le nettoyage du cache
  console.log('🗑️ Création du fichier de nettoyage...');
  execSync('echo "CACHE_CLEAR" > .netlify-cache-clear', { stdio: 'inherit' });
  execSync('git add .netlify-cache-clear', { stdio: 'inherit' });
  execSync('git commit -m "clear: force cache clear"', { stdio: 'inherit' });
  
  // Push vers GitHub
  console.log('⬆️ Push vers GitHub...');
  execSync('git push', { stdio: 'inherit' });
  
  console.log('✅ Nettoyage du cache terminé !');
  console.log('🔄 Le prochain build sera un rebuild complet');
  console.log('⏱️ Temps attendu : 5-10 minutes (rebuild complet)');
  
} catch (error) {
  console.error('❌ Erreur lors du nettoyage:', error.message);
  process.exit(1);
} 
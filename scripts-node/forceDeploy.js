import { execSync } from 'child_process';

console.log('🚀 Déploiement forcé avec configuration simplifiée...');

try {
  // Vérifier le statut Git
  console.log('📋 Vérification du statut Git...');
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  
  if (status.trim()) {
    console.log('📝 Changements détectés, ajout au commit...');
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "fix: configuration Netlify simplifiée"', { stdio: 'inherit' });
  }
  
  // Push vers GitHub
  console.log('⬆️ Push vers GitHub...');
  execSync('git push', { stdio: 'inherit' });
  
  console.log('✅ Déploiement forcé terminé !');
  console.log('📋 Le build Netlify va maintenant utiliser la configuration simplifiée');
  console.log('⏱️ Temps attendu : 3-5 minutes');
  
} catch (error) {
  console.error('❌ Erreur lors du déploiement forcé:', error.message);
  process.exit(1);
} 
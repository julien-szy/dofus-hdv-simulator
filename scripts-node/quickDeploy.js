import { execSync } from 'child_process';

console.log('🚀 Déploiement rapide sans plugins...');

try {
  // Vérifier le statut Git
  console.log('📋 Vérification du statut Git...');
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  
  if (status.trim()) {
    console.log('📝 Changements détectés, ajout au commit...');
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "fix: configuration Netlify simplifiée sans plugins"', { stdio: 'inherit' });
  }
  
  // Push vers GitHub
  console.log('⬆️ Push vers GitHub...');
  execSync('git push', { stdio: 'inherit' });
  
  console.log('✅ Déploiement rapide terminé !');
  console.log('📋 Configuration simplifiée - plus de plugins externes');
  console.log('⏱️ Temps attendu : 3-5 minutes');
  console.log('🎯 Le cache Netlify natif sera utilisé automatiquement');
  
} catch (error) {
  console.error('❌ Erreur lors du déploiement:', error.message);
  process.exit(1);
} 
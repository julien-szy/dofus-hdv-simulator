import { execSync } from 'child_process';

console.log('⚡ Déploiement ultra-rapide...');

try {
  // Vérifier le statut Git
  console.log('📋 Vérification du statut Git...');
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  
  if (status.trim()) {
    console.log('📝 Changements détectés, ajout au commit...');
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "perf: build ultra-rapide sans caches inutiles"', { stdio: 'inherit' });
  }
  
  // Push vers GitHub
  console.log('⬆️ Push vers GitHub...');
  execSync('git push', { stdio: 'inherit' });
  
  console.log('✅ Déploiement ultra-rapide terminé !');
  console.log('⚡ Configuration optimisée :');
  console.log('   - Pas de caches Python/Ruby/Go');
  console.log('   - npm ci avec cache forcé');
  console.log('   - Build optimisé');
  console.log('⏱️ Temps attendu : < 2 minutes');
  
} catch (error) {
  console.error('❌ Erreur lors du déploiement:', error.message);
  process.exit(1);
} 
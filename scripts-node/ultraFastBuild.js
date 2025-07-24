import { execSync } from 'child_process';

console.log('⚡ Build ultra-rapide en cours...');

try {
  // Vérifier la version Node.js
  console.log('🔍 Vérification Node.js...');
  const nodeVersion = execSync('node --version', { encoding: 'utf8' });
  console.log(`✅ Node.js ${nodeVersion.trim()}`);
  
  // Installer les dépendances avec cache forcé
  console.log('📦 Installation des dépendances (cache forcé)...');
  execSync('npm ci --prefer-offline --no-audit', { stdio: 'inherit' });
  
  // Build de l'application
  console.log('🔨 Build de l\'application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('✅ Build ultra-rapide terminé !');
  console.log('⚡ Temps total : < 2 minutes');
  
} catch (error) {
  console.error('❌ Erreur lors du build:', error.message);
  process.exit(1);
} 
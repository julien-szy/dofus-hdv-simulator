import { execSync } from 'child_process';

console.log('🚀 Build simple en cours...');

try {
  // Installer les dépendances si nécessaire
  console.log('📦 Installation des dépendances...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Pull Git LFS si nécessaire
  console.log('📥 Vérification Git LFS...');
  try {
    execSync('git lfs pull', { stdio: 'inherit' });
  } catch (error) {
    console.log('ℹ️ Git LFS non disponible ou pas d\'images');
  }
  
  // Build de l'application
  console.log('🔨 Build de l\'application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('✅ Build terminé avec succès !');
} catch (error) {
  console.error('❌ Erreur lors du build:', error.message);
  process.exit(1);
} 
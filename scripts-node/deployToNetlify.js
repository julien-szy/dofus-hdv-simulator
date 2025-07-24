// Script de déploiement optimisé pour Netlify
// Gère les images avec Git LFS et optimise le build

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class NetlifyDeployer {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.distDir = path.join(this.projectRoot, 'dist');
  }

  async checkGitStatus() {
    console.log('🔍 Vérification du statut Git...');
    
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        console.log('⚠️ Il y a des changements non commités :');
        console.log(status);
        return false;
      }
      console.log('✅ Aucun changement non commité');
      return true;
    } catch (error) {
      console.error('❌ Erreur vérification Git:', error.message);
      return false;
    }
  }

  async checkGitLFS() {
    console.log('🔍 Vérification de Git LFS...');
    
    try {
      const lfsStatus = execSync('git lfs status', { encoding: 'utf8' });
      console.log('✅ Git LFS configuré');
      return true;
    } catch (error) {
      console.error('❌ Git LFS non configuré:', error.message);
      return false;
    }
  }

  async buildProject() {
    console.log('🔨 Construction du projet...');
    
    try {
      // Nettoyer le dossier dist
      await fs.rm(this.distDir, { recursive: true, force: true });
      
      // Installer les dépendances si nécessaire
      console.log('📦 Installation des dépendances...');
      execSync('npm install', { stdio: 'inherit' });
      
      // Construire le projet
      console.log('🏗️ Build en cours...');
      execSync('npm run build', { stdio: 'inherit' });
      
      console.log('✅ Build terminé avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors du build:', error.message);
      return false;
    }
  }

  async optimizeBuild() {
    console.log('⚡ Optimisation du build...');
    
    try {
      // Vérifier la taille du build
      const buildSize = await this.getBuildSize();
      console.log(`📊 Taille du build: ${buildSize}`);
      
      // Optimiser les images si nécessaire
      await this.optimizeImages();
      
      console.log('✅ Optimisation terminée');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'optimisation:', error.message);
      return false;
    }
  }

  async getBuildSize() {
    try {
      const stats = await fs.stat(this.distDir);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      return `${sizeInMB} MB`;
    } catch (error) {
      return 'Taille inconnue';
    }
  }

  async optimizeImages() {
    console.log('🖼️ Optimisation des images...');
    
    try {
      // Lancer l'optimisation des images
      execSync('npm run optimize-images', { stdio: 'inherit' });
      console.log('✅ Images optimisées');
    } catch (error) {
      console.warn('⚠️ Impossible d\'optimiser les images:', error.message);
    }
  }

  async deployToNetlify() {
    console.log('🚀 Déploiement vers Netlify...');
    
    try {
      // Vérifier si Netlify CLI est installé
      try {
        execSync('netlify --version', { stdio: 'ignore' });
      } catch (error) {
        console.log('📦 Installation de Netlify CLI...');
        execSync('npm install -g netlify-cli', { stdio: 'inherit' });
      }
      
      // Déployer
      console.log('🌐 Déploiement en cours...');
      execSync('netlify deploy --prod --dir=dist', { stdio: 'inherit' });
      
      console.log('✅ Déploiement terminé avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors du déploiement:', error.message);
      return false;
    }
  }

  async runPreDeploymentChecks() {
    console.log('🔍 Vérifications pré-déploiement...\n');
    
    const checks = [
      { name: 'Git Status', check: () => this.checkGitStatus() },
      { name: 'Git LFS', check: () => this.checkGitLFS() }
    ];
    
    for (const check of checks) {
      console.log(`\n📋 ${check.name}:`);
      const result = await check.check();
      if (!result) {
        console.log(`❌ Échec de la vérification: ${check.name}`);
        return false;
      }
    }
    
    console.log('\n✅ Toutes les vérifications passent');
    return true;
  }

  async commitChanges(message = 'feat: Optimized deployment with new architecture') {
    console.log('💾 Commit des changements...');
    
    try {
      execSync('git add .', { stdio: 'inherit' });
      execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
      console.log('✅ Changements commités');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors du commit:', error.message);
      return false;
    }
  }

  async pushToGitHub() {
    console.log('📤 Push vers GitHub...');
    
    try {
      execSync('git push', { stdio: 'inherit' });
      console.log('✅ Push vers GitHub terminé');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors du push:', error.message);
      return false;
    }
  }

  async run() {
    console.log('🚀 Déploiement optimisé vers Netlify\n');
    
    try {
      // 1. Vérifications pré-déploiement
      const checksPassed = await this.runPreDeploymentChecks();
      if (!checksPassed) {
        console.log('\n❌ Vérifications échouées. Arrêt du déploiement.');
        return { success: false, error: 'Vérifications échouées' };
      }
      
      // 2. Commit des changements si nécessaire
      const hasChanges = !(await this.checkGitStatus());
      if (hasChanges) {
        console.log('\n💾 Changements détectés, commit en cours...');
        await this.commitChanges();
      }
      
      // 3. Build du projet
      console.log('\n🔨 Build du projet...');
      const buildSuccess = await this.buildProject();
      if (!buildSuccess) {
        return { success: false, error: 'Échec du build' };
      }
      
      // 4. Optimisation
      console.log('\n⚡ Optimisation...');
      await this.optimizeBuild();
      
      // 5. Déploiement
      console.log('\n🌐 Déploiement...');
      const deploySuccess = await this.deployToNetlify();
      if (!deploySuccess) {
        return { success: false, error: 'Échec du déploiement' };
      }
      
      // 6. Push vers GitHub si nécessaire
      if (hasChanges) {
        console.log('\n📤 Push vers GitHub...');
        await this.pushToGitHub();
      }
      
      console.log('\n🎉 Déploiement terminé avec succès !');
      console.log('\n📊 Résumé:');
      console.log('   ✅ Vérifications passées');
      console.log('   ✅ Build optimisé');
      console.log('   ✅ Déploiement Netlify');
      console.log('   ✅ Images avec Git LFS');
      console.log('   ✅ Architecture optimisée');
      
      return { success: true };
      
    } catch (error) {
      console.error('\n❌ Erreur lors du déploiement:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Exécuter le déploiement
if (require.main === module) {
  const deployer = new NetlifyDeployer();
  deployer.run().then(result => {
    if (result.success) {
      console.log('\n✅ Déploiement réussi !');
      process.exit(0);
    } else {
      console.log('\n❌ Déploiement échoué !');
      process.exit(1);
    }
  });
}

module.exports = NetlifyDeployer; 
import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SmartPusher {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
  }

  async checkGitStatus() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      return status.trim().split('\n').filter(line => line.length > 0);
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du statut Git:', error.message);
      return [];
    }
  }

  async checkIfImagesChanged() {
    const changes = await this.checkGitStatus();
    return changes.some(change => change.includes('public/images/'));
  }

  async checkIfCodeChanged() {
    const changes = await this.checkGitStatus();
    return changes.some(change => 
      !change.includes('public/images/') && 
      !change.includes('node_modules/') &&
      !change.includes('.git/')
    );
  }

  async smartPush() {
    try {
      console.log('🤖 Push intelligent en cours...');
      
      // Vérifier s'il y a des changements
      const changes = await this.checkGitStatus();
      if (changes.length === 0) {
        console.log('ℹ️ Aucun changement détecté');
        return true;
      }

      console.log(`📝 ${changes.length} fichiers modifiés détectés`);

      // Vérifier les types de changements
      const hasImageChanges = await this.checkIfImagesChanged();
      const hasCodeChanges = await this.checkIfCodeChanged();

      if (hasImageChanges && hasCodeChanges) {
        console.log('⚠️ Changements détectés dans le code ET les images');
        console.log('💡 Recommandation: Déployez séparément pour optimiser');
        console.log('   1. npm run deploy-images (pour les images)');
        console.log('   2. git push (pour le code)');
        return false;
      }

      if (hasImageChanges) {
        console.log('🖼️ Changements d\'images détectés');
        console.log('💡 Utilisez: npm run deploy-images');
        return false;
      }

      if (hasCodeChanges) {
        console.log('💻 Changements de code détectés');
        console.log('🚀 Push rapide en cours...');
        
        // Ajouter tous les changements sauf les images
        execSync('git add .', { stdio: 'inherit' });
        
        // Créer un commit
        const commitMessage = 'feat: mise à jour du code (push rapide)';
        execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
        
        // Push
        execSync('git push', { stdio: 'inherit' });
        
        console.log('✅ Push rapide terminé !');
        console.log('⚡ Déploiement Netlify en cours (2-3 minutes)');
        return true;
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur lors du push intelligent:', error.message);
      return false;
    }
  }

  async run() {
    console.log('🎯 Push Intelligent - Dofus HDV');
    console.log('================================');
    
    const success = await this.smartPush();
    
    if (success) {
      console.log('\n✅ Opération terminée avec succès !');
    } else {
      console.log('\n❌ Push annulé - Vérifiez les recommandations ci-dessus');
      process.exit(1);
    }
  }
}

// Exécuter le script
const pusher = new SmartPusher();
pusher.run().catch(console.error); 
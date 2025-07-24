import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ImagesDeployer {
  constructor() {
    this.imagesDir = path.join(__dirname, '../public/images');
    this.netlifyDir = path.join(__dirname, '../netlify');
  }

  async checkImagesExist() {
    try {
      const stats = await fs.stat(this.imagesDir);
      if (!stats.isDirectory()) {
        throw new Error('Le dossier images n\'existe pas');
      }
      
      const files = await fs.readdir(this.imagesDir, { recursive: true });
      const imageFiles = files.filter(file => 
        file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
      );
      
      console.log(`✅ ${imageFiles.length} images trouvées`);
      return imageFiles.length > 0;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des images:', error.message);
      return false;
    }
  }

  async checkGitLFS() {
    try {
      execSync('git lfs version', { stdio: 'pipe' });
      console.log('✅ Git LFS est installé');
      return true;
    } catch (error) {
      console.error('❌ Git LFS n\'est pas installé');
      return false;
    }
  }

  async checkNetlifyCLI() {
    try {
      execSync('netlify --version', { stdio: 'pipe' });
      console.log('✅ Netlify CLI est installé');
      return true;
    } catch (error) {
      console.error('❌ Netlify CLI n\'est pas installé. Installez-le avec: npm install -g netlify-cli');
      return false;
    }
  }

  async deployImages() {
    try {
      console.log('🚀 Déploiement des images vers Netlify...');
      
      // Vérifier que les images existent
      if (!(await this.checkImagesExist())) {
        throw new Error('Aucune image trouvée');
      }

      // Vérifier Git LFS
      if (!(await this.checkGitLFS())) {
        throw new Error('Git LFS requis');
      }

      // Vérifier Netlify CLI
      if (!(await this.checkNetlifyCLI())) {
        throw new Error('Netlify CLI requis');
      }

      // S'assurer que les images sont trackées par Git LFS
      console.log('📦 Vérification du tracking Git LFS...');
      execSync('git lfs track "public/images/**/*"', { stdio: 'inherit' });
      
      // Ajouter et commiter les changements
      console.log('💾 Ajout des images au commit...');
      execSync('git add .gitattributes', { stdio: 'inherit' });
      execSync('git add public/images/', { stdio: 'inherit' });
      
      // Vérifier s'il y a des changements à commiter
      try {
        execSync('git diff --cached --quiet', { stdio: 'pipe' });
        console.log('ℹ️ Aucun changement d\'images à déployer');
        return true;
      } catch (error) {
        // Il y a des changements, on peut continuer
      }

      // Commiter les images
      console.log('📝 Commit des images...');
      execSync('git commit -m "feat: mise à jour des images Dofus"', { stdio: 'inherit' });

      // Push vers GitHub
      console.log('⬆️ Push vers GitHub...');
      execSync('git push', { stdio: 'inherit' });

      console.log('✅ Images déployées avec succès !');
      console.log('ℹ️ Le déploiement Netlify se fera automatiquement via GitHub');
      
      return true;
    } catch (error) {
      console.error('❌ Erreur lors du déploiement des images:', error.message);
      return false;
    }
  }

  async run() {
    console.log('🎯 Déploiement des images uniquement');
    console.log('=====================================');
    
    const success = await this.deployImages();
    
    if (success) {
      console.log('\n✅ Déploiement terminé avec succès !');
      console.log('📋 Prochaines étapes:');
      console.log('   1. Attendez que Netlify termine le déploiement automatique');
      console.log('   2. Vérifiez que les images sont accessibles sur votre site');
      console.log('   3. Testez l\'application pour vous assurer que tout fonctionne');
    } else {
      console.log('\n❌ Déploiement échoué');
      process.exit(1);
    }
  }
}

// Exécuter le script
const deployer = new ImagesDeployer();
deployer.run().catch(console.error); 
import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OptimizedBuilder {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.imagesDir = path.join(this.projectRoot, 'public/images');
    this.distDir = path.join(this.projectRoot, 'dist');
  }

  async checkCacheExists() {
    try {
      // Vérifier si le cache Netlify existe
      const netlifyCache = process.env.NETLIFY_CACHE_DIR;
      if (netlifyCache) {
        const cacheStats = await fs.stat(netlifyCache);
        console.log(`✅ Cache Netlify trouvé: ${netlifyCache}`);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async copyImagesToCache() {
    try {
      const netlifyCache = process.env.NETLIFY_CACHE_DIR;
      if (!netlifyCache) {
        console.log('ℹ️ Pas de cache Netlify disponible');
        return;
      }

      const cacheImagesDir = path.join(netlifyCache, 'images');
      
      // Créer le dossier cache s'il n'existe pas
      await fs.mkdir(cacheImagesDir, { recursive: true });
      
      // Copier les images vers le cache
      console.log('📦 Copie des images vers le cache Netlify...');
      execSync(`cp -r "${this.imagesDir}"/* "${cacheImagesDir}/"`, { stdio: 'inherit' });
      
      console.log('✅ Images copiées vers le cache');
    } catch (error) {
      console.log('⚠️ Impossible de copier vers le cache:', error.message);
    }
  }

  async restoreImagesFromCache() {
    try {
      const netlifyCache = process.env.NETLIFY_CACHE_DIR;
      if (!netlifyCache) {
        console.log('ℹ️ Pas de cache Netlify disponible');
        return false;
      }

      const cacheImagesDir = path.join(netlifyCache, 'images');
      
      // Vérifier si les images sont en cache
      try {
        await fs.access(cacheImagesDir);
        const files = await fs.readdir(cacheImagesDir);
        
        if (files.length > 0) {
          console.log(`✅ ${files.length} images trouvées en cache`);
          
          // Restaurer les images depuis le cache
          console.log('🔄 Restauration des images depuis le cache...');
          execSync(`cp -r "${cacheImagesDir}"/* "${this.imagesDir}/"`, { stdio: 'inherit' });
          
          console.log('✅ Images restaurées depuis le cache');
          return true;
        }
      } catch (error) {
        console.log('ℹ️ Pas d\'images en cache');
      }
      
      return false;
    } catch (error) {
      console.log('⚠️ Erreur lors de la restauration du cache:', error.message);
      return false;
    }
  }

  async build() {
    try {
      console.log('🚀 Build optimisé en cours...');
      
      // Vérifier le cache
      const hasCache = await this.checkCacheExists();
      
      // Essayer de restaurer les images depuis le cache
      const restoredFromCache = await this.restoreImagesFromCache();
      
      if (!restoredFromCache) {
        console.log('📥 Téléchargement des images depuis Git LFS...');
        execSync('git lfs pull', { stdio: 'inherit' });
      }
      
      // Build de l'application
      console.log('🔨 Build de l\'application...');
      execSync('npm run build', { stdio: 'inherit' });
      
      // Copier les images vers le cache pour le prochain build
      await this.copyImagesToCache();
      
      console.log('✅ Build optimisé terminé !');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors du build:', error.message);
      return false;
    }
  }

  async run() {
    console.log('🎯 Build Optimisé - Dofus HDV');
    console.log('==============================');
    
    const success = await this.build();
    
    if (success) {
      console.log('\n✅ Build terminé avec succès !');
      console.log('📋 Prochaines étapes:');
      console.log('   1. Les images sont maintenant en cache');
      console.log('   2. Le prochain build sera plus rapide');
      console.log('   3. Déployez avec: npm run push');
    } else {
      console.log('\n❌ Build échoué');
      process.exit(1);
    }
  }
}

// Exécuter le script
const builder = new OptimizedBuilder();
builder.run().catch(console.error); 
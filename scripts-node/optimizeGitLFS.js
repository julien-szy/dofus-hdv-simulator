import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GitLFSOptimizer {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
  }

  async checkGitLFSStatus() {
    try {
      console.log('🔍 Vérification Git LFS...');
      const status = execSync('git lfs status', { encoding: 'utf8' });
      console.log('✅ Git LFS actif');
      return true;
    } catch (error) {
      console.log('❌ Git LFS non configuré');
      return false;
    }
  }

  async getLFSFileCount() {
    try {
      const files = execSync('git lfs ls-files', { encoding: 'utf8' });
      const count = files.trim().split('\n').filter(line => line.length > 0).length;
      console.log(`📊 ${count} fichiers Git LFS détectés`);
      return count;
    } catch (error) {
      console.log('❌ Impossible de compter les fichiers LFS');
      return 0;
    }
  }

  async optimizeLFS() {
    try {
      console.log('⚡ Optimisation Git LFS...');
      
      // Vérifier Git LFS
      const hasLFS = await this.checkGitLFSStatus();
      if (!hasLFS) {
        console.log('ℹ️ Pas de Git LFS à optimiser');
        return;
      }

      // Compter les fichiers
      const fileCount = await this.getLFSFileCount();
      
      // Pull LFS pour s'assurer que tout est à jour
      console.log('📥 Pull Git LFS...');
      execSync('git lfs pull', { stdio: 'inherit' });
      
      // Nettoyer les fichiers LFS orphelins
      console.log('🧹 Nettoyage des fichiers LFS...');
      execSync('git lfs prune', { stdio: 'inherit' });
      
      console.log('✅ Optimisation Git LFS terminée !');
      console.log(`📊 ${fileCount} fichiers optimisés`);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'optimisation LFS:', error.message);
    }
  }

  async run() {
    console.log('🎯 Optimisation Git LFS - Dofus HDV');
    console.log('====================================');
    
    await this.optimizeLFS();
    
    console.log('\n📋 Recommandations :');
    console.log('1. Le repo sera plus léger');
    console.log('2. Les pulls seront plus rapides');
    console.log('3. Netlify devrait être plus rapide');
  }
}

// Exécuter l'optimisation
const optimizer = new GitLFSOptimizer();
optimizer.run().catch(console.error); 
#!/usr/bin/env node

/**
 * Script de vérification de la configuration des wallets
 * Vérifie que toutes les dépendances sont installées et configurées
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la configuration des wallets XRPL...\n');

// Vérifier les dépendances requises
const requiredPackages = [
  'xrpl',
  'xrpl-connect',
  '@gemwallet/api',
  '@walletconnect/modal',
  '@walletconnect/sign-client'
];

console.log('📦 Vérification des dépendances...');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

let allPackagesInstalled = true;
requiredPackages.forEach(pkg => {
  const installed = packageJson.dependencies && packageJson.dependencies[pkg];
  if (installed) {
    console.log(`  ✅ ${pkg} (${packageJson.dependencies[pkg]})`);
  } else {
    console.log(`  ❌ ${pkg} - MANQUANT`);
    allPackagesInstalled = false;
  }
});

// Vérifier le fichier .env.local
console.log('\n🔑 Vérification de la configuration...');
const envPath = path.join(__dirname, '.env.local');

if (fs.existsSync(envPath)) {
  console.log('  ✅ Fichier .env.local trouvé');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasXamanKey = envContent.includes('NEXT_PUBLIC_XAMAN_API_KEY') && 
                      !envContent.includes('NEXT_PUBLIC_XAMAN_API_KEY=your-xaman-api-key-here');
  const hasWCId = envContent.includes('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID') && 
                  !envContent.includes('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id-here');
  
  if (hasXamanKey) {
    console.log('  ✅ Xaman API Key configurée');
  } else {
    console.log('  ⚠️  Xaman API Key non configurée (optionnel)');
  }
  
  if (hasWCId) {
    console.log('  ✅ WalletConnect Project ID configuré');
  } else {
    console.log('  ⚠️  WalletConnect Project ID non configuré (optionnel)');
  }
} else {
  console.log('  ⚠️  Fichier .env.local non trouvé (créé avec valeurs par défaut)');
}

// Vérifier les fichiers de composants
console.log('\n🧩 Vérification des composants...');
const componentsToCheck = [
  'src/components/wallet-button.tsx',
  'src/components/wallet-connector.tsx',
  'src/lib/wallet-manager.ts',
  'src/context/WalletContext.tsx'
];

let allComponentsExist = true;
componentsToCheck.forEach(component => {
  const exists = fs.existsSync(path.join(__dirname, component));
  if (exists) {
    console.log(`  ✅ ${component}`);
  } else {
    console.log(`  ❌ ${component} - MANQUANT`);
    allComponentsExist = false;
  }
});

// Résumé
console.log('\n' + '='.repeat(60));
if (allPackagesInstalled && allComponentsExist) {
  console.log('✅ TOUT EST PRÊT !');
  console.log('\n🚀 Pour démarrer l\'application :');
  console.log('   npm run dev');
  console.log('\n🌐 Puis ouvrez : http://localhost:3000');
  console.log('\n💡 Wallets disponibles sans configuration :');
  console.log('   - Crossmark (extension navigateur)');
  console.log('   - GemWallet (extension navigateur)');
  console.log('\n📖 Consultez WALLET_SETUP.md pour plus d\'infos');
} else {
  console.log('⚠️  CONFIGURATION INCOMPLÈTE');
  if (!allPackagesInstalled) {
    console.log('\n⚠️  Installez les dépendances manquantes :');
    console.log('   npm install');
  }
  if (!allComponentsExist) {
    console.log('\n⚠️  Certains fichiers sont manquants. Vérifiez le projet.');
  }
}
console.log('='.repeat(60) + '\n');

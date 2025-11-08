# Configuration des Wallets XRPL

## 🚀 Installation des dépendances

Les dépendances sont déjà installées. Tous les packages nécessaires pour les wallets sont présents :

- ✅ `xrpl@4.4.3` - Bibliothèque XRPL
- ✅ `xrpl-connect@0.3.0` - Gestionnaire de wallets unifié
- ✅ `@gemwallet/api@3.8.0` - API GemWallet
- ✅ `@walletconnect/modal@2.7.0` - Interface WalletConnect
- ✅ `@walletconnect/sign-client@2.23.0` - Client WalletConnect

## 🔑 Configuration des clés API (Optionnel mais recommandé)

### 1. Xaman (ex-XUMM) - Pour mobile iOS/Android

1. Créez un compte développeur sur : https://apps.xumm.dev/
2. Créez une nouvelle application
3. Copiez votre API Key
4. Modifiez le fichier `.env.local` :
   ```env
   NEXT_PUBLIC_XAMAN_API_KEY=votre-clé-xaman-ici
   ```

### 2. WalletConnect - Pour connexion universelle via QR Code

1. Créez un compte sur : https://cloud.walletconnect.com/
2. Créez un nouveau projet
3. Copiez votre Project ID
4. Modifiez le fichier `.env.local` :
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=votre-project-id-ici
   ```

## 📱 Wallets disponibles

### Sans configuration (prêts à l'emploi) :

1. **Crossmark** 🌐
   - Extension navigateur
   - Installation : https://crossmark.io/
   - Fonctionne immédiatement

2. **GemWallet** 💎
   - Extension navigateur
   - Installation : https://gemwallet.app/
   - Fonctionne immédiatement

### Avec configuration API :

3. **Xaman** 📱
   - Application mobile iOS/Android
   - Nécessite une API Key (voir ci-dessus)
   - Téléchargement : https://xaman.app/

4. **WalletConnect** 🔗
   - Connexion universelle via QR Code
   - Nécessite un Project ID (voir ci-dessus)
   - Compatible avec de nombreux wallets

## 🎯 Démarrer l'application

```bash
npm run dev
```

L'application sera accessible sur : http://localhost:3000

## 🔧 Utilisation

1. Cliquez sur le bouton "Connect Wallet" dans l'interface
2. Sélectionnez votre wallet préféré
3. Suivez les instructions de connexion :
   - **Crossmark/GemWallet** : Popup de l'extension
   - **Xaman** : Redirection OAuth2
   - **WalletConnect** : Scan du QR Code

## ⚠️ Dépannage

### Le bouton "Connect Wallet" ne fonctionne pas

1. Vérifiez que vous avez bien installé les dépendances :
   ```bash
   npm install
   ```

2. Redémarrez le serveur de développement :
   ```bash
   npm run dev
   ```

### Xaman ne fonctionne pas

- Vérifiez que vous avez bien configuré `NEXT_PUBLIC_XAMAN_API_KEY` dans `.env.local`
- Redémarrez le serveur après modification du fichier `.env.local`

### WalletConnect ne fonctionne pas

- Vérifiez que vous avez bien configuré `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` dans `.env.local`
- Redémarrez le serveur après modification du fichier `.env.local`

### Extension navigateur non détectée

- Vérifiez que l'extension est bien installée et activée
- Actualisez la page
- Vérifiez les autorisations de l'extension

## 📚 Documentation

- [XRPL Documentation](https://xrpl.org/)
- [xrpl-connect GitHub](https://github.com/XRPL-Labs/xrpl-connect)
- [Xaman API Docs](https://docs.xaman.dev/)
- [WalletConnect Docs](https://docs.walletconnect.com/)

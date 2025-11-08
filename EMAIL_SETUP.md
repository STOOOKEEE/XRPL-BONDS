# Configuration de l'envoi d'emails avec Resend

## Étapes pour activer l'envoi d'emails

### 1. Créer un compte Resend
1. Va sur [https://resend.com](https://resend.com)
2. Crée un compte gratuit (100 emails/jour gratuits)

### 2. Obtenir une clé API
1. Connecte-toi à [https://resend.com/api-keys](https://resend.com/api-keys)
2. Clique sur "Create API Key"
3. Donne-lui un nom (ex: "XRPL Bonds Dev")
4. Copie la clé générée

### 3. Configurer le domaine d'envoi

#### Option A : Utiliser le domaine de test Resend (pour le développement)
- Tu peux utiliser `onboarding@resend.dev` directement
- Pas besoin de configuration supplémentaire
- Limite : tu ne peux envoyer qu'à ton propre email

#### Option B : Utiliser ton propre domaine (pour la production)
1. Va sur [https://resend.com/domains](https://resend.com/domains)
2. Clique sur "Add Domain"
3. Entre ton domaine (ex: `xrplbonds.com`)
4. Ajoute les enregistrements DNS fournis dans ton hébergeur de domaine
5. Attends la vérification (quelques minutes à 24h)
6. Une fois vérifié, tu peux utiliser n'importe quel email de ce domaine (ex: `noreply@xrplbonds.com`)

### 4. Configurer les variables d'environnement

Ouvre le fichier `.env.local` et remplace les valeurs :

```bash
# Remplace par ta vraie clé API Resend
RESEND_API_KEY=re_123456789_votre_vraie_cle_ici

# Option A (dev) : Utilise l'email de test Resend
FROM_EMAIL=onboarding@resend.dev

# Option B (prod) : Utilise ton domaine vérifié
FROM_EMAIL=noreply@votredomaine.com
```

### 5. Redémarrer le serveur

```bash
# Arrête le serveur actuel (Ctrl+C)
# Puis relance :
npm run dev
```

### 6. Tester l'envoi d'email

1. Va sur [http://localhost:3000/corpo](http://localhost:3000/corpo)
2. Remplis le formulaire avec TON EMAIL dans le champ "Contact Email"
3. Soumets le formulaire
4. Tu devrais recevoir un email de confirmation !

## Notes importantes

- **En développement** : Utilise `onboarding@resend.dev` et teste avec ton propre email
- **En production** : Configure ton domaine et utilise ton email professionnel
- **Limite gratuite** : 100 emails/jour, 3000 emails/mois
- **Logs** : Tous les emails envoyés apparaissent dans le dashboard Resend

## Vérifier les emails envoyés

1. Va sur [https://resend.com/emails](https://resend.com/emails)
2. Tu verras tous les emails envoyés avec leur statut
3. Tu peux voir le contenu HTML et les erreurs éventuelles

## En cas de problème

- Vérifie que la clé API est correcte dans `.env.local`
- Vérifie que tu as redémarré le serveur après modification de `.env.local`
- Regarde les logs dans le terminal pour voir les erreurs
- Vérifie le dashboard Resend pour voir si l'email a bien été envoyé
- Si tu utilises ton domaine, vérifie qu'il est bien vérifié dans Resend

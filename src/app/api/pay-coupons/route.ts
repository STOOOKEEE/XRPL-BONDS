import { NextResponse } from 'next/server';
import { Client, Wallet } from 'xrpl';
// @ts-ignore: environnement d'exécution Node fournit 'mongodb'
import { MongoClient } from 'mongodb';

/*
=====================================================
  CONFIGURATION DE L'ENVIRONNEMENT
=====================================================
*/

// On définit le stablecoin avec lequel le Vault paie les coupons
// On suppose que tous les coupons sont payés dans la même monnaie (ex: USDC)
const PAYMENT_CURRENCY = "USDC";
// ❗️ REMPLACEZ CECI par l'adresse de l'émetteur du VRAI USDC (ex: Circle)
const PAYMENT_ISSUER = process.env.PAYMENT_ISSUER_ADDRESS || "rDxsuBd4N45CoVPJggaxHi8zTowN7YnQrg";

/*
=====================================================
  ROUTE API (POST)
=====================================================
*/

export async function POST(request: Request) {

    // --- 1. Charger les secrets (depuis .env.local) ---
    const VAULT_SEED = process.env.COUPON_VAULT_SEED;
    const CRON_SECRET = process.env.CRON_SECRET;
    const MONGODB_URI = process.env.MONGODB_URI;

    // --- 2. Sécuriser l'API Route ---
    const authHeader = request.headers.get('authorization');
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // --- 3. Vérifier les variables d'environnement ---
    if (!VAULT_SEED || !MONGODB_URI) {
        console.error('ERREUR FATALE: Variables .env manquantes');
        return NextResponse.json({ error: 'Configuration serveur manquante.' }, { status: 500 });
    }

    // --- 4. Initialiser les clients et les logs ---
    const xrplClient = new Client('wss://wasm.devnet.rippletest.net:51233'); // Testnet
    let mongoClient: MongoClient | undefined; // Pour pouvoir le fermer dans finally
    let logs: string[] = [];

    try {
        // --- ÉTAPE A : Connexion aux services ---
        const vaultWallet = Wallet.fromSeed(VAULT_SEED);

        await xrplClient.connect();

        // Connexion Mongo (utilisation directe de MongoClient pour éviter dépendances locales)
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        mongoClient = client;
        const db = client.db();

        logs.push(`Connecté à XRPL (Vault: ${vaultWallet.address}) et MongoDB.`);

        // --- ÉTAPE B : Récupérer les adresses KYC (Mongo) ---
            const kycUsers: any[] = await db
            .collection('users')
            .find({ kycStatus: 'VERIFIED' }, { projection: { xrplAddress: 1 } })
            .toArray();

        const kycAddressSet = new Set(kycUsers.map((u) => u.xrplAddress as string));
        logs.push(`[MONGO] Trouvé ${kycAddressSet.size} utilisateurs KYC vérifiés.`);

        // --- ÉTAPE C : Trouver les obligations à payer (Mongo) ---
        const today = new Date();
        const bondsToPay = await db
            .collection('bonds')
            .find({ nextPaymentDate: { $lte: today } })
            .toArray();

        logs.push(`[MONGO] Trouvé ${bondsToPay.length} obligation(s) nécessitant un paiement.`);

        // --- ÉTAPE D : Boucler sur CHAQUE obligation ---
        for (const bond of bondsToPay) {
            logs.push(`--- Traitement de l'obligation: ${bond.name} (${bond.currencyCode}) ---`);

            const BOND_ISSUER_ADDRESS = bond.issuerAddress;
            const BOND_CURRENCY_CODE = bond.currencyCode;
            const BOND_ANNUAL_RATE = bond.couponRate;
            const PAYMENT_FREQUENCY_MONTHS = bond.paymentFrequency || 12;

            const paymentRate = BOND_ANNUAL_RATE / PAYMENT_FREQUENCY_MONTHS;

            // --- ÉTAPE E : Récupérer les détenteurs (XRPL) ---
            let allHolders: any[] = [];
            try {
                const response = await xrplClient.request({ command: 'account_lines', account: BOND_ISSUER_ADDRESS });
                allHolders = response.result.lines.filter((line: any) => line.currency === BOND_CURRENCY_CODE);
                logs.push(`[XRPL] Trouvé ${allHolders.length} détenteurs pour ${bond.name}.`);
            } catch (e: any) {
                logs.push(`[XRPL] ERREUR: Impossible de lire les détenteurs pour ${BOND_ISSUER_ADDRESS}: ${e?.message || String(e)}`);
                continue;
            }

            // --- ÉTAPE F : Boucler sur les détenteurs et Payer ---
            for (const holder of allHolders) {
                const holderAddress = holder.account;

                if (kycAddressSet.has(holderAddress)) {
                    const balance = Math.abs(parseFloat(holder.balance));
                    const couponPaymentAmount = balance * paymentRate;

                    if (couponPaymentAmount <= 0.000001) {
                        continue;
                    }

                    const paymentTx: any = {
                        TransactionType: 'Payment',
                        Account: vaultWallet.address,
                        Destination: holderAddress,
                        Amount: {
                            issuer: PAYMENT_ISSUER,
                            currency: PAYMENT_CURRENCY,
                            value: couponPaymentAmount.toString(),
                        },
                    };

                    try {
                        const prepared = await xrplClient.autofill(paymentTx as any);
                        const signed = vaultWallet.sign(prepared);
                        await xrplClient.submitAndWait(signed.tx_blob);
                        logs.push(`SUCCESS: Paiement de ${couponPaymentAmount.toFixed(6)} ${PAYMENT_CURRENCY} à ${holderAddress} réussi.`);
                    } catch (paymentError: any) {
                        logs.push(`FAILED: Paiement à ${holderAddress} échoué: ${paymentError?.message || String(paymentError)}`);
                    }
                } else {
                    logs.push(`SKIPPED: ${holderAddress} détient ${holder.balance} tokens mais n'est pas KYC.`);
                }
            }

            // --- ÉTAPE G : Mettre à jour la date du prochain paiement ---
            const newPaymentDate = new Date(bond.nextPaymentDate);
            newPaymentDate.setMonth(newPaymentDate.getMonth() + Math.round(12 / PAYMENT_FREQUENCY_MONTHS));

            await db.collection('bonds').updateOne({ _id: bond._id }, { $set: { nextPaymentDate: newPaymentDate } });
            logs.push(`Obligation ${bond.name} mise à jour pour le prochain paiement le ${newPaymentDate.toISOString()}`);
        }

        logs.push('--- BATCH GLOBAL TERMINÉ ---');

        return NextResponse.json({ message: 'Batch de paiement des coupons terminé.', logs: logs });
    } catch (error: any) {
        console.error('Erreur majeure du batch:', error);
        logs.push(`ERREUR FATALE: ${error?.message || String(error)}`);
        return NextResponse.json({ error: error?.message || String(error), logs: logs }, { status: 500 });
    } finally {
        // --- ÉTAPE H : Déconnexion (TRÈS IMPORTANT) ---
        try {
            if (xrplClient && (xrplClient as any).isConnected && (xrplClient as any).isConnected()) {
                await xrplClient.disconnect();
                console.log('Déconnecté de XRPL.');
            }
        } catch (e) {
            console.warn('Erreur lors de la déconnexion XRPL:', e);
        }
        if (mongoClient) {
            await mongoClient.close();
            console.log('Déconnecté de MongoDB.');
        }
    }
}

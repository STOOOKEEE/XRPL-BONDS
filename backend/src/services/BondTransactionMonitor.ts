import { Client, Transaction as XRPLTransaction } from 'xrpl';
import { Bond } from '../models/Bond';
import { BondHolder } from '../models/BondHolder';
import { Transaction } from '../models/Transaction';

/**
 * Service de monitoring des transactions XRPL pour les obligations
 * Écoute les transferts de tokens MPT et met à jour la base de données
 */
export class BondTransactionMonitor {
  private client: Client;
  private isMonitoring: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;

  constructor(xrplUrl: string = 'wss://s.altnet.rippletest.net:51233') {
    this.client = new Client(xrplUrl);
  }

  /**
   * Démarre le monitoring des transactions
   */
  async start(): Promise<void> {
    try {
      console.log('🔗 Connexion au XRPL...');
      await this.client.connect();
      console.log('✅ Connecté au XRPL');
      
      this.isMonitoring = true;
      this.reconnectAttempts = 0;

      // Écoute les nouvelles transactions validées
      this.client.on('transaction', async (tx: any) => {
        await this.handleTransaction(tx);
      });

      // Écoute les déconnexions
      this.client.on('disconnected', async (code: number) => {
        console.warn(`⚠️  Déconnecté du XRPL (code: ${code})`);
        if (this.isMonitoring) {
          await this.reconnect();
        }
      });

      // Subscribe aux transactions de tous les bonds actifs
      await this.subscribeToActiveBonds();

      console.log('👀 Monitoring des transactions démarré');
    } catch (error) {
      console.error('❌ Erreur lors du démarrage du monitoring:', error);
      throw error;
    }
  }

  /**
   * Arrête le monitoring
   */
  async stop(): Promise<void> {
    console.log('🛑 Arrêt du monitoring...');
    this.isMonitoring = false;
    await this.client.disconnect();
    console.log('✅ Monitoring arrêté');
  }

  /**
   * Reconnexion automatique
   */
  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Nombre maximal de tentatives de reconnexion atteint');
      this.isMonitoring = false;
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`🔄 Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts} dans ${delay}ms...`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      await this.start();
    } catch (error) {
      console.error('❌ Échec de la reconnexion:', error);
      await this.reconnect();
    }
  }

  /**
   * Subscribe aux transactions des obligations actives
   */
  private async subscribeToActiveBonds(): Promise<void> {
    try {
      const activeBonds = await Bond.find({ status: 'active' });
      
      if (activeBonds.length === 0) {
        console.log('ℹ️  Aucune obligation active à surveiller');
        return;
      }

      // Subscribe aux comptes émetteurs
      const accounts = activeBonds.map(bond => bond.issuerAddress);
      
      await this.client.request({
        command: 'subscribe',
        accounts: [...new Set(accounts)] // Supprime les doublons
      });

      console.log(`✅ Abonné à ${activeBonds.length} obligation(s) active(s)`);
    } catch (error) {
      console.error('❌ Erreur lors de la souscription aux bonds:', error);
      throw error;
    }
  }

  /**
   * Traite une transaction XRPL
   */
  private async handleTransaction(txData: any): Promise<void> {
    try {
      const tx = txData.transaction;
      
      // Ignore les transactions non validées
      if (txData.validated !== true) {
        return;
      }

      // On s'intéresse principalement aux Payment et MPTokenIssuanceCreate/Authorize
      if (tx.TransactionType === 'Payment') {
        await this.handlePaymentTransaction(tx, txData);
      } else if (tx.TransactionType === 'MPTokenIssuanceCreate') {
        await this.handleTokenIssuance(tx, txData);
      } else if (tx.TransactionType === 'MPTokenAuthorize') {
        // Gère l'autorisation des holders (mint vers un nouveau holder)
        await this.handleTokenAuthorize(tx, txData);
      }
    } catch (error) {
      console.error('❌ Erreur lors du traitement de la transaction:', error, txData);
    }
  }

  /**
   * Traite une transaction de paiement (transfert de tokens)
   */
  private async handlePaymentTransaction(tx: any, txData: any): Promise<void> {
    try {
      // Vérifie si c'est un transfert de token MPT
      if (!tx.Amount || typeof tx.Amount !== 'object' || !tx.Amount.mpt_id) {
        return; // Pas un token MPT
      }

      const tokenCurrency = tx.Amount.mpt_id;
      const amount = tx.Amount.value;
      const fromAddress = tx.Account;
      const toAddress = tx.Destination;

      // Trouve l'obligation correspondante
      const bond = await Bond.findOne({ tokenCurrency });
      
      if (!bond) {
        return; // Token non surveillé
      }

      console.log(`📊 Transfert détecté pour ${bond.tokenName}: ${amount} tokens de ${fromAddress} vers ${toAddress}`);

      // Enregistre la transaction
      await Transaction.create({
        bondId: bond.bondId,
        txHash: txData.transaction.hash,
        ledgerIndex: txData.ledger_index,
        fromAddress,
        toAddress,
        amount,
        type: 'transfer',
        timestamp: this.rippleTimeToUnix(tx.date),
        memo: tx.Memos?.[0]?.Memo?.MemoData ? 
          Buffer.from(tx.Memos[0].Memo.MemoData, 'hex').toString('utf8') : undefined
      });

      // Met à jour les balances des holders
      await this.updateHolderBalances(bond.bondId, fromAddress, toAddress, amount, txData.ledger_index);

    } catch (error) {
      console.error('❌ Erreur lors du traitement du paiement:', error);
    }
  }

  /**
   * Traite l'émission d'un nouveau token
   */
  private async handleTokenIssuance(tx: any, txData: any): Promise<void> {
    console.log('🆕 Nouvelle émission de token détectée:', tx);
    // Logique pour créer automatiquement un bond si nécessaire
    // Ou simplement logger pour traitement manuel
  }

  /**
   * Traite l'autorisation d'un holder
   */
  private async handleTokenAuthorize(tx: any, txData: any): Promise<void> {
    console.log('✅ Autorisation de holder détectée:', tx);
    // Logique pour suivre les autorisations
  }

  /**
   * Met à jour les balances des détenteurs
   */
  private async updateHolderBalances(
    bondId: string,
    fromAddress: string,
    toAddress: string,
    amount: string,
    ledgerIndex: number
  ): Promise<void> {
    const timestamp = Date.now();
    const amountNum = BigInt(amount);

    // Met à jour l'expéditeur (réduit sa balance)
    const sender = await BondHolder.findOne({ bondId, holderAddress: fromAddress });
    if (sender) {
      const newBalance = BigInt(sender.balance) - amountNum;
      if (newBalance <= BigInt(0)) {
        // Supprime le holder s'il n'a plus de tokens
        await BondHolder.deleteOne({ _id: sender._id });
        console.log(`🗑️  ${fromAddress} n'a plus de tokens ${bondId}`);
      } else {
        sender.balance = newBalance.toString();
        sender.lastUpdateDate = timestamp;
        await sender.save();
        console.log(`📉 ${fromAddress} balance: ${sender.balance}`);
      }
    }

    // Met à jour le destinataire (augmente sa balance)
    const recipient = await BondHolder.findOne({ bondId, holderAddress: toAddress });
    if (recipient) {
      const newBalance = BigInt(recipient.balance) + amountNum;
      recipient.balance = newBalance.toString();
      recipient.lastUpdateDate = timestamp;
      await recipient.save();
      console.log(`📈 ${toAddress} balance: ${recipient.balance}`);
    } else {
      // Crée un nouveau holder
      await BondHolder.create({
        bondId,
        holderAddress: toAddress,
        balance: amount,
        firstAcquisitionDate: timestamp,
        lastUpdateDate: timestamp,
        totalCouponsReceived: '0'
      });
      console.log(`🆕 Nouveau holder créé: ${toAddress} avec balance: ${amount}`);
    }
  }

  /**
   * Convertit le temps Ripple en Unix timestamp
   */
  private rippleTimeToUnix(rippleTime: number): number {
    return (rippleTime + 946684800) * 1000; // Ripple epoch: 01/01/2000
  }

  /**
   * Récupère la balance actuelle d'un holder depuis le ledger XRPL
   */
  async getHolderBalanceFromLedger(holderAddress: string, mptId: string): Promise<string> {
    try {
      const response = await this.client.request({
        command: 'account_objects',
        account: holderAddress,
        type: 'mptoken'
      });

      const mptObject = response.result.account_objects?.find(
        (obj: any) => obj.mpt_id === mptId
      ) as any;

      return mptObject?.amount || '0';
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de la balance:', error);
      return '0';
    }
  }

  /**
   * Synchronise les balances depuis le ledger XRPL
   * Utile pour initialiser ou vérifier la cohérence de la DB
   */
  async syncBondHolders(bondId: string): Promise<void> {
    try {
      const bond = await Bond.findOne({ bondId });
      if (!bond) {
        throw new Error(`Obligation ${bondId} introuvable`);
      }

      console.log(`🔄 Synchronisation des holders pour ${bond.tokenName}...`);

      // Récupère tous les holders actuels depuis la DB
      const dbHolders = await BondHolder.find({ bondId });

      // Pour chaque holder, vérifie la balance réelle sur le ledger
      for (const holder of dbHolders) {
        const realBalance = await this.getHolderBalanceFromLedger(
          holder.holderAddress,
          bond.tokenCurrency
        );

        if (realBalance !== holder.balance) {
          console.log(`⚠️  Incohérence détectée pour ${holder.holderAddress}: DB=${holder.balance}, Ledger=${realBalance}`);
          holder.balance = realBalance;
          holder.lastUpdateDate = Date.now();
          await holder.save();
        }
      }

      console.log(`✅ Synchronisation terminée pour ${bond.tokenName}`);
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
      throw error;
    }
  }
}

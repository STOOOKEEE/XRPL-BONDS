const express = require('express');
const router = express.Router();
const vaultController = require('../controllers/vault');

/**
 * @POST /api/vaults
 * Créer un nouveau vault
 * 
 * Body:
 * {
 *   targetAmount: "1000",
 *   tokenSymbol: "MTP",
 *   recipientAddress: "rXXX...",
 *   signers: [
 *     { address: "rAAA...", weight: 1 },
 *     { address: "rBBB...", weight: 1 }
 *   ],
 *   requiredSignatures: 2
 * }
 */
router.post('/', vaultController.createVault);

/**
 * @GET /api/vaults
 * Lister tous les vaults
 */
router.get('/', vaultController.listVaults);

/**
 * @GET /api/vaults/:vaultId
 * Récupérer l'état d'un vault spécifique
 */
router.get('/:vaultId', vaultController.getVaultStatus);

/**
 * @POST /api/vaults/:vaultId/contribute
 * Ajouter une contribution à un vault
 * 
 * Body:
 * {
 *   investorAddress: "rXXX...",
 *   amount: "100",
 *   signedTransaction: "..." // Transaction signée (preuve de paiement USDC)
 * }
 */
router.post('/:vaultId/contribute', vaultController.contributeToVault);

/**
 * @POST /api/vaults/:vaultId/finalize
 * Finaliser un vault (minter tokens + transférer fonds)
 * 
 * Body:
 * {
 *   signatures: [
 *     "signature1",
 *     "signature2"
 *   ]
 * }
 */
router.post('/:vaultId/finalize', vaultController.finalizeVault);

module.exports = router;

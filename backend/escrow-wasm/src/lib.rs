use wasm_bindgen::prelude::*;
use std::collections::HashMap;

/// Escrow multi-party avec rollback safe pour MPTokens
#[wasm_bindgen]
pub struct MPTEscrow {
    current_amount: u64,
    contributions: HashMap<String, u64>, // suivi des contributions des parties
    temp_tokens: u64, // MPTokens temporairement stockés avant transfert
}

#[wasm_bindgen]
impl MPTEscrow {
    /// Constructeur
    #[wasm_bindgen(constructor)]
    pub fn new() -> MPTEscrow {
        MPTEscrow {
            current_amount: 0,
            contributions: HashMap::new(),
            temp_tokens: 0,
        }
    }

    /// Recevoir un paiement et stocker les MPTokens dans l'escrow temporaire
    /// Ratio 1:1 (1 token pour 1 unité reçue)
    #[wasm_bindgen]
    pub fn receive_payment(&mut self, party: &str, amount: u64) -> Result<bool, JsValue> {
        const MAX_AMOUNT: u64 = 1000;

        // Vérifier la limite maximale
        if self.current_amount + amount > MAX_AMOUNT {
            return Err(JsValue::from_str("Transaction dépasserait la limite maximale"));
        }

        // Ajouter la contribution
        *self.contributions.entry(party.to_string()).or_insert(0) += amount;
        self.current_amount += amount;

        // Stocker les MPTokens dans l'escrow temporaire
        self.temp_tokens += amount;
        log(&format!("{} MPTokens stockés dans l'escrow temporaire pour {}", amount, party));

        // Si le montant exact est atteint, finaliser le transfert
        if self.current_amount == MAX_AMOUNT {
            if !self.finalize_transfer() {
                return Err(JsValue::from_str("Transfert final échoué, rollback possible"));
            }
        }

        Ok(true)
    }

    /// Rollback manuel : réinitialise l'escrow et garde les tokens temporaires pour redistribution
    #[wasm_bindgen]
    pub fn rollback(&mut self) {
        log(&format!("Rollback : {} MPTokens restent dans l'escrow temporaire", self.temp_tokens));
        self.current_amount = 0;
        self.contributions.clear();
        // self.temp_tokens reste pour être récupéré ou redistribué
    }

    /// Finaliser le transfert des fonds et des tokens (fictif, à remplacer par xrpl-wasm-stdlib)
    fn finalize_transfer(&mut self) -> bool {
        let destination_account = "rDestinationAccount...";

        if !self.send_funds_to_destination(destination_account, self.current_amount) {
            return false; // échec, rollback possible
        }

        if !self.send_tokens_to_destination(destination_account, self.temp_tokens) {
            return false; // échec, rollback possible
        }

        // Réinitialiser l'escrow après transfert réussi
        self.current_amount = 0;
        self.temp_tokens = 0;
        self.contributions.clear();

        true
    }

    /// Simule l'envoi des fonds XRP
    fn send_funds_to_destination(&self, destination: &str, amount: u64) -> bool {
        log(&format!("Transfert de {} XRP à {}", amount, destination));
        true
    }

    /// Simule l'envoi des MPTokens
    fn send_tokens_to_destination(&self, destination: &str, amount: u64) -> bool {
        log(&format!("Envoi de {} MPTokens à {}", amount, destination));
        true
    }
}

/// Helper pour log vers JS console
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}
use wasm_bindgen::prelude::*;
use serde::Serialize;

// Simple helper crate that constructs XRPL escrow-related instructions.
// We keep network submission and signing in JS (xrpl.js). Rust/wasm provides
// deterministic escrow logic and serialization helpers.

#[derive(Serialize)]
struct EscrowCreateInstruction<'a> {
    TransactionType: &'a str,
    Account: &'a str,
    Destination: &'a str,
    Amount: &'a str,
    Memo: &'a str,
}

#[wasm_bindgen]
pub fn build_escrow_create(account: &str, destination: &str, amount: &str, campaign_id: &str) -> JsValue {
    // campaign_id will be stored in the Memo as UTF-8 hex
    let memo_hex = hex::encode(campaign_id.as_bytes());

    let instr = EscrowCreateInstruction {
        TransactionType: "EscrowCreate",
        Account: account,
        Destination: destination,
        Amount: amount,
        Memo: &memo_hex,
    };

    JsValue::from_serde(&instr).unwrap()
}

#[wasm_bindgen]
pub fn memo_from_hex(memo_hex: &str) -> String {
    match hex::decode(memo_hex) {
        Ok(bytes) => match String::from_utf8(bytes) {
            Ok(s) => s,
            Err(_) => String::from("<invalid-utf8>"),
        },
        Err(_) => String::from("<invalid-hex>"),
    }
}

// Additional helpers can be added here: finalize logic, verify signatures, etc.

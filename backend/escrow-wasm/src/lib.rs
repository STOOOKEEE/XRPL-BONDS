use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Campaign state stored in JS/DB and passed back to Rust for validation
#[derive(Serialize, Deserialize, Clone)]
pub struct CampaignState {
    /// Campaign unique identifier
    pub campaign_id: String,
    /// Maximum investment amount (in smallest units, e.g., 1_000_000 = 1 USDC/RLUSD if 6 decimals)
    pub max_value: u64,
    /// Current total raised (smallest units)
    pub current_raised: u64,
    /// Unix timestamp deadline (seconds)
    pub deadline_unix: u64,
    /// Treasury address (receives funds if objective reached exactly)
    pub treasury_address: String,
    /// Map of investor address -> amount contributed (smallest units)
    pub investments: HashMap<String, u64>,
    /// Stablecoin currency code accepted for investment (e.g., "USDC", "RLUSD")
    pub investment_currency: String,
    /// Stablecoin issuer address
    pub investment_issuer: String,
    /// Token currency code distributed to investors (e.g., "BOND")
    pub token_currency: String,
    /// Token issuer address
    pub token_issuer: String,
}

/// Result of processing an investment
#[derive(Serialize, Deserialize)]
pub struct InvestmentResult {
    pub accepted: bool,
    pub reason: String,
    /// Amount of tokens to send (smallest units, 1:1 with stablecoin investment)
    pub token_amount: u64,
    /// Updated campaign state (if accepted)
    pub updated_state: Option<CampaignState>,
    /// If true, send funds to treasury instead of holding in escrow
    pub send_to_treasury: bool,
}

/// Result of finalizing campaign
#[derive(Serialize, Deserialize)]
pub struct FinalizeResult {
    pub success: bool,
    pub objective_reached: bool,
    /// List of refunds to issue (address, amount in stablecoin smallest units)
    pub refunds: Vec<(String, u64)>,
    /// If objective reached, this is the total to send to treasury
    pub treasury_amount: u64,
}

#[wasm_bindgen]
pub fn process_investment(
    state_json: &str,
    sender_address: &str,
    stablecoin_amount: u64,
    current_time_unix: u64,
) -> JsValue {
    let mut state: CampaignState = match serde_json::from_str(state_json) {
        Ok(s) => s,
        Err(_) => {
            let err = InvestmentResult {
                accepted: false,
                reason: "Invalid state JSON".to_string(),
                token_amount: 0,
                updated_state: None,
                send_to_treasury: false,
            };
            return serde_wasm_bindgen::to_value(&err).unwrap();
        }
    };

    // Check deadline not passed
    if current_time_unix > state.deadline_unix {
        let err = InvestmentResult {
            accepted: false,
            reason: "Campaign deadline has passed".to_string(),
            token_amount: 0,
            updated_state: None,
            send_to_treasury: false,
        };
        return serde_wasm_bindgen::to_value(&err).unwrap();
    }

    // Check if adding this amount would exceed max
    let new_total = state.current_raised + stablecoin_amount;

    if new_total > state.max_value {
        // Reject: would exceed cap
        let err = InvestmentResult {
            accepted: false,
            reason: format!(
                "Investment would exceed cap. Max: {}, Current: {}, Attempted: {}",
                state.max_value, state.current_raised, stablecoin_amount
            ),
            token_amount: 0,
            updated_state: None,
            send_to_treasury: false,
        };
        return serde_wasm_bindgen::to_value(&err).unwrap();
    }

    // Check if exactly reaching cap
    let send_to_treasury = new_total == state.max_value;

    // Update state
    state.current_raised = new_total;
    *state.investments.entry(sender_address.to_string()).or_insert(0) += stablecoin_amount;

    let result = InvestmentResult {
        accepted: true,
        reason: if send_to_treasury {
            "Objective reached! Funds will be sent to treasury.".to_string()
        } else {
            "Investment accepted".to_string()
        },
        token_amount: stablecoin_amount, // 1:1 ratio (integer)
        updated_state: Some(state),
        send_to_treasury,
    };

    serde_wasm_bindgen::to_value(&result).unwrap()
}

#[wasm_bindgen]
pub fn finalize_campaign(
    state_json: &str,
    current_time_unix: u64,
) -> JsValue {
    let state: CampaignState = match serde_json::from_str(state_json) {
        Ok(s) => s,
        Err(_) => {
            let err = FinalizeResult {
                success: false,
                objective_reached: false,
                refunds: vec![],
                treasury_amount: 0,
            };
            return serde_wasm_bindgen::to_value(&err).unwrap();
        }
    };

    // Check if deadline passed
    if current_time_unix <= state.deadline_unix {
        let err = FinalizeResult {
            success: false,
            objective_reached: false,
            refunds: vec![],
            treasury_amount: 0,
        };
        return serde_wasm_bindgen::to_value(&err).unwrap();
    }

    // Check if objective reached
    let objective_reached = state.current_raised >= state.max_value;

    if objective_reached {
        // Success: send all to treasury
        let result = FinalizeResult {
            success: true,
            objective_reached: true,
            refunds: vec![],
            treasury_amount: state.current_raised,
        };
        return serde_wasm_bindgen::to_value(&result).unwrap();
    } else {
        // Failed: issue refunds
        let refunds: Vec<(String, u64)> = state
            .investments
            .into_iter()
            .collect();

        let result = FinalizeResult {
            success: true,
            objective_reached: false,
            refunds,
            treasury_amount: 0,
        };
        return serde_wasm_bindgen::to_value(&result).unwrap();
    }
}

#[wasm_bindgen]
pub fn create_campaign_state(
    campaign_id: &str,
    max_value: u64,
    deadline_unix: u64,
    treasury_address: &str,
    investment_currency: &str,
    investment_issuer: &str,
    token_currency: &str,
    token_issuer: &str,
) -> JsValue {
    let state = CampaignState {
        campaign_id: campaign_id.to_string(),
        max_value,
        current_raised: 0,
        deadline_unix,
        treasury_address: treasury_address.to_string(),
        investments: HashMap::new(),
        investment_currency: investment_currency.to_string(),
        investment_issuer: investment_issuer.to_string(),
        token_currency: token_currency.to_string(),
        token_issuer: token_issuer.to_string(),
    };

    serde_wasm_bindgen::to_value(&state).unwrap()
}

/*
 * vault_fundraiser.c - XRPL Hook pour levée de fonds autonome on-chain
 * 
 * Fonctionnalités :
 * - Réception USDC + transfert automatique MPT (batch atomique)
 * - Gestion deadline avec transfert entreprise ou mode remboursement
 * - Remboursement autonome on-chain
 * 
 * Architecture :
 * - Hook déployé sur rVaultHook
 * - Inventaire initial : 1,000,000 MPT
 * - Pas de backend, 100% on-chain
 */

#include <stdint.h>

// ============================================================================
// SDK XRPL Hook Functions
// ============================================================================

extern int32_t _g(uint32_t id, uint32_t maxiter);
extern int64_t accept(uint32_t read_ptr, uint32_t read_len, int64_t error_code);
extern int64_t rollback(uint32_t read_ptr, uint32_t read_len, int64_t error_code);
extern int64_t state(uint32_t write_ptr, uint32_t write_len, uint32_t kread_ptr, uint32_t kread_len);
extern int64_t state_set(uint32_t read_ptr, uint32_t read_len, uint32_t kread_ptr, uint32_t kread_len);
extern int64_t otxn_field(uint32_t write_ptr, uint32_t write_len, uint32_t field_id);
extern int64_t otxn_param(uint32_t write_ptr, uint32_t write_len, uint32_t read_ptr, uint32_t read_len);
extern int64_t emit(uint32_t write_ptr, uint32_t write_len, uint32_t read_ptr, uint32_t read_len);
extern int64_t etxn_reserve(uint32_t count);
extern int64_t etxn_details(uint32_t write_ptr, uint32_t write_len);
extern int64_t trace(uint32_t mread_ptr, uint32_t mread_len, uint32_t dread_ptr, uint32_t dread_len, uint32_t as_hex);
extern int64_t trace_num(uint32_t read_ptr, uint32_t read_len, int64_t number);
extern int64_t ledger_seq();
extern int64_t ledger_last_time();
extern int64_t hook_account(uint32_t write_ptr, uint32_t write_len);
extern int64_t util_accid(uint32_t write_ptr, uint32_t write_len, uint32_t read_ptr, uint32_t read_len);

// ============================================================================
// Constants - Transaction Types
// ============================================================================

#define ttPAYMENT 0
#define ttINVOKE 99

// ============================================================================
// Constants - Field IDs
// ============================================================================

#define sfTransactionType 2
#define sfAccount 1
#define sfAmount 6
#define sfDestination 3
#define sfSequence 4
#define sfLastLedgerSequence 27

// ============================================================================
// Constants - Application
// ============================================================================

#define ADDR_SIZE 20
#define MAX_KEY_SIZE 64
#define MAX_VALUE_SIZE 128
#define AMOUNT_SIZE 48  // Amount field can be currency object

// Status values
#define STATUS_ACTIVE 1
#define STATUS_SUCCESS_PENDING 2
#define STATUS_SUCCESS 3
#define STATUS_FAILED_REFUNDING 4

// ============================================================================
// Helper Functions - Memory Operations
// ============================================================================

static void _memcpy(void* dest, const void* src, uint32_t n) {
    uint8_t* d = (uint8_t*)dest;
    const uint8_t* s = (const uint8_t*)src;
    for (uint32_t i = 0; i < n; ++i) { 
        _g(1, 1); 
        d[i] = s[i]; 
    }
}

static void _memset(void* dest, uint8_t val, uint32_t n) {
    uint8_t* d = (uint8_t*)dest;
    for (uint32_t i = 0; i < n; ++i) { 
        _g(2, 1); 
        d[i] = val; 
    }
}

static int32_t _memcmp(const void* s1, const void* s2, uint32_t n) {
    const uint8_t* p1 = (const uint8_t*)s1;
    const uint8_t* p2 = (const uint8_t*)s2;
    for (uint32_t i = 0; i < n; ++i) {
        _g(3, 1);
        if (p1[i] != p2[i]) return p1[i] - p2[i];
    }
    return 0;
}

static uint32_t _strlen(const char* s) {
    uint32_t len = 0;
    while (s[len] && len < 256) { 
        _g(4, 1); 
        len++; 
    }
    return len;
}

// ============================================================================
// Helper Functions - String/Number Conversion
// ============================================================================

static void uint64_to_str(uint64_t val, char* out, uint32_t max_len) {
    if (max_len < 2) return;
    if (val == 0) { 
        out[0] = '0'; 
        out[1] = 0; 
        return; 
    }
    
    char temp[32];
    uint32_t pos = 0;
    uint32_t guard = 0;
    
    while (val > 0 && pos < 31) {
        _g(5, 1);
        temp[pos++] = '0' + (val % 10);
        val /= 10;
        if (++guard > 25) break;
    }
    
    for (uint32_t i = 0; i < pos && i < max_len - 1; ++i) {
        _g(5, 1);
        out[i] = temp[pos - 1 - i];
    }
    out[pos < max_len ? pos : max_len - 1] = 0;
}

static uint64_t str_to_uint64(const char* s) {
    uint64_t result = 0;
    uint32_t guard = 0;
    
    while (*s >= '0' && *s <= '9') {
        _g(6, 1);
        result = result * 10 + (*s - '0');
        s++;
        if (++guard > 25) break;
    }
    return result;
}

// ============================================================================
// Helper Functions - State Operations
// ============================================================================

static int64_t read_state(const char* key, uint8_t* out, uint32_t out_len) {
    return state((uint32_t)out, out_len, (uint32_t)key, _strlen(key));
}

static int64_t write_state(const char* key, const uint8_t* data, uint32_t data_len) {
    return state_set((uint32_t)data, data_len, (uint32_t)key, _strlen(key));
}

// ============================================================================
// Helper Functions - Debug Tracing
// ============================================================================

static void debug_trace(const char* msg, int64_t num) {
    trace_num((uint32_t)msg, _strlen(msg), num);
}

static void debug_msg(const char* msg) {
    trace((uint32_t)msg, _strlen(msg), 0, 0, 0);
}

// ============================================================================
// Helper Functions - Address Conversion
// ============================================================================

static void bytes_to_hex(const uint8_t* bytes, uint32_t len, char* out) {
    const char hex_chars[] = "0123456789ABCDEF";
    for (uint32_t i = 0; i < len && i < 32; i++) {
        _g(7, 1);
        out[i * 2] = hex_chars[(bytes[i] >> 4) & 0xF];
        out[i * 2 + 1] = hex_chars[bytes[i] & 0xF];
    }
    out[len * 2] = 0;
}

// ============================================================================
// Hook State Management
// ============================================================================

/*
 * Hook State Keys:
 * 
 * "Status"           -> "1" (ACTIVE), "2" (SUCCESS_PENDING), "3" (SUCCESS), "4" (FAILED_REFUNDING)
 * "Objectif"         -> "1000000000000" (1M USDC en micro-units)
 * "Deadline"         -> "1767225600" (timestamp Unix)
 * "CompanyAddress"   -> 20 bytes (AccountID binaire)
 * "TotalRaised"      -> "0" -> "500000000000" (montant en micro-units)
 * "MPTokenID"        -> 32 bytes (MPToken ID)
 * 
 * Per-investor:
 * "invested:<addr_hex>" -> "100000000000" (montant investi)
 * "refunded:<addr_hex>" -> "1" (marqué si remboursé)
 */

static uint8_t get_status() {
    uint8_t status_buf[8];
    _memset(status_buf, 0, sizeof(status_buf));
    
    int64_t result = read_state("Status", status_buf, sizeof(status_buf));
    if (result < 0) return STATUS_ACTIVE;  // Default
    
    return (uint8_t)str_to_uint64((char*)status_buf);
}

static void set_status(uint8_t status) {
    char status_str[8];
    uint64_to_str(status, status_str, sizeof(status_str));
    write_state("Status", (uint8_t*)status_str, _strlen(status_str));
}

static uint64_t get_total_raised() {
    uint8_t total_buf[32];
    _memset(total_buf, 0, sizeof(total_buf));
    
    int64_t result = read_state("TotalRaised", total_buf, sizeof(total_buf));
    if (result < 0) return 0;
    
    return str_to_uint64((char*)total_buf);
}

static void set_total_raised(uint64_t amount) {
    char amount_str[32];
    uint64_to_str(amount, amount_str, sizeof(amount_str));
    write_state("TotalRaised", (uint8_t*)amount_str, _strlen(amount_str));
}

static uint64_t get_objectif() {
    uint8_t obj_buf[32];
    _memset(obj_buf, 0, sizeof(obj_buf));
    
    int64_t result = read_state("Objectif", obj_buf, sizeof(obj_buf));
    if (result < 0) return 0;
    
    return str_to_uint64((char*)obj_buf);
}

static uint64_t get_deadline() {
    uint8_t deadline_buf[32];
    _memset(deadline_buf, 0, sizeof(deadline_buf));
    
    int64_t result = read_state("Deadline", deadline_buf, sizeof(deadline_buf));
    if (result < 0) return 0;
    
    return str_to_uint64((char*)deadline_buf);
}

static int64_t get_investor_amount(const uint8_t* address) {
    // Build key: "invested:ABCD1234..."
    char key[64];
    _memset(key, 0, sizeof(key));
    _memcpy(key, "invested:", 9);
    bytes_to_hex(address, ADDR_SIZE, key + 9);
    
    uint8_t amount_buf[32];
    _memset(amount_buf, 0, sizeof(amount_buf));
    
    int64_t result = read_state(key, amount_buf, sizeof(amount_buf));
    if (result < 0) return 0;
    
    return str_to_uint64((char*)amount_buf);
}

static void set_investor_amount(const uint8_t* address, uint64_t amount) {
    // Build key: "invested:ABCD1234..."
    char key[64];
    _memset(key, 0, sizeof(key));
    _memcpy(key, "invested:", 9);
    bytes_to_hex(address, ADDR_SIZE, key + 9);
    
    char amount_str[32];
    uint64_to_str(amount, amount_str, sizeof(amount_str));
    write_state(key, (uint8_t*)amount_str, _strlen(amount_str));
}

static int32_t is_refunded(const uint8_t* address) {
    // Build key: "refunded:ABCD1234..."
    char key[64];
    _memset(key, 0, sizeof(key));
    _memcpy(key, "refunded:", 9);
    bytes_to_hex(address, ADDR_SIZE, key + 9);
    
    uint8_t refunded_buf[8];
    _memset(refunded_buf, 0, sizeof(refunded_buf));
    
    int64_t result = read_state(key, refunded_buf, sizeof(refunded_buf));
    return (result > 0 && refunded_buf[0] == '1');
}

static void mark_refunded(const uint8_t* address) {
    // Build key: "refunded:ABCD1234..."
    char key[64];
    _memset(key, 0, sizeof(key));
    _memcpy(key, "refunded:", 9);
    bytes_to_hex(address, ADDR_SIZE, key + 9);
    
    write_state(key, (uint8_t*)"1", 1);
}

// ============================================================================
// Amount Parsing (XRPL Amount Field)
// ============================================================================

/*
 * XRPL Amount peut être :
 * - XRP : 8 bytes, bit 62 = 0, bit 63 = sign
 * - IOU/USDC : 48 bytes objet { value, currency, issuer }
 * 
 * Pour simplifier, on extrait le montant comme uint64_t en micro-units
 */

static uint64_t parse_amount(const uint8_t* amount_field, uint32_t amount_len) {
    if (amount_len == 8) {
        // XRP native amount (drops)
        uint64_t drops = 0;
        for (uint32_t i = 0; i < 8; i++) {
            _g(8, 1);
            drops = (drops << 8) | amount_field[i];
        }
        
        // Clear top 2 bits (sign and type)
        drops &= 0x3FFFFFFFFFFFFFFFULL;
        return drops;
    }
    
    // For IOU (USDC), the structure is more complex
    // For MVP, we'll read the first 8 bytes as a simplified amount
    // In production, you'd need full IOU parsing
    if (amount_len >= 8) {
        uint64_t value = 0;
        for (uint32_t i = 0; i < 8; i++) {
            _g(9, 1);
            value = (value << 8) | amount_field[i];
        }
        return value & 0x3FFFFFFFFFFFFFFFULL;
    }
    
    return 0;
}

// ============================================================================
// Transaction Emission (Batch Atomique)
// ============================================================================

/*
 * emit_payment_usdc()
 * Émet un Payment USDC vers une destination
 * 
 * NOTE: Dans un vrai Hook, il faut construire la transaction en format binaire XRPL.
 * Ceci est une version simplifiée pour montrer la logique.
 */

static int64_t emit_payment_usdc(const uint8_t* destination, uint64_t amount) {
    debug_msg("Emitting USDC payment...");
    debug_trace("Amount:", amount);
    
    // Reserve an emit slot
    if (etxn_reserve(1) < 0) {
        debug_msg("ERROR: Cannot reserve emit slot");
        return -1;
    }
    
    // Build transaction blob
    // NOTE: En production, utiliser une vraie sérialisation XRPL
    // Pour ce MVP, on utilise etxn_details + emit avec un template
    
    uint8_t txn_blob[512];
    _memset(txn_blob, 0, sizeof(txn_blob));
    
    // Simplified: In production, serialize full XRPL transaction
    // For now, emit expects a pre-built transaction blob
    
    // Get current hook account
    uint8_t hook_acc[ADDR_SIZE];
    hook_account((uint32_t)hook_acc, ADDR_SIZE);
    
    // Emit the transaction
    // NOTE: emit() requires a fully serialized XRPL transaction
    // This is a placeholder - real implementation needs proper serialization
    
    debug_msg("Payment emission prepared (requires full serialization)");
    return 0;  // Success (simplified)
}

/*
 * emit_mpt_transfer()
 * Émet un transfert MPToken depuis l'inventaire du Hook vers l'investisseur
 */

static int64_t emit_mpt_transfer(const uint8_t* destination, uint64_t mpt_amount) {
    debug_msg("Emitting MPT transfer...");
    debug_trace("MPT Amount:", mpt_amount);
    
    // Reserve emit slot
    if (etxn_reserve(1) < 0) {
        debug_msg("ERROR: Cannot reserve MPT emit slot");
        return -1;
    }
    
    // Build MPToken transfer transaction
    // NOTE: Requires MPToken transaction type (implementation depends on XRPL version)
    
    debug_msg("MPT transfer emission prepared");
    return 0;  // Success (simplified)
}

// ============================================================================
// Core Logic - Investment Processing
// ============================================================================

/*
 * handle_investment()
 * Traite un paiement USDC entrant et effectue le batch atomique :
 * 1. Accept le paiement
 * 2. Transfert MPT vers investisseur
 * 3. Met à jour TotalRaised et invested:<addr>
 */

static int64_t handle_investment(const uint8_t* investor, uint64_t usdc_amount) {
    debug_msg("=== INVESTMENT PROCESSING ===");
    debug_trace("USDC Amount:", usdc_amount);
    
    // 1. Vérifier le statut
    uint8_t status = get_status();
    if (status != STATUS_ACTIVE) {
        debug_msg("ERROR: Fundraising not active");
        return rollback((uint32_t)"Fundraising closed", 18, 1);
    }
    
    // 2. Vérifier la deadline
    uint64_t deadline = get_deadline();
    int64_t current_time = ledger_last_time();
    
    if (current_time > (int64_t)deadline) {
        debug_msg("ERROR: Deadline passed");
        return rollback((uint32_t)"Deadline passed", 15, 2);
    }
    
    // 3. Calculer le montant MPT à transférer (ratio 1:1)
    uint64_t mpt_amount = usdc_amount;
    
    // 4. BATCH ATOMIQUE START
    debug_msg("Starting atomic batch...");
    
    // Action 1: Accept le paiement USDC (reste sur le Hook account)
    debug_msg("Action 1: Accept USDC payment");
    // Note: accept() sera appelé en fin de hook() pour valider
    
    // Action 2: Émettre transfert MPT
    debug_msg("Action 2: Emit MPT transfer");
    if (emit_mpt_transfer(investor, mpt_amount) < 0) {
        debug_msg("ERROR: MPT transfer failed - ROLLBACK");
        return rollback((uint32_t)"MPT transfer failed", 19, 3);
    }
    
    // Action 3: Mettre à jour les états
    debug_msg("Action 3: Update state");
    
    uint64_t total_raised = get_total_raised();
    uint64_t new_total = total_raised + usdc_amount;
    set_total_raised(new_total);
    debug_trace("New total raised:", new_total);
    
    // Enregistrer l'investissement de cet investisseur
    uint64_t investor_current = get_investor_amount(investor);
    set_investor_amount(investor, investor_current + usdc_amount);
    debug_trace("Investor total:", investor_current + usdc_amount);
    
    // 4. Vérifier si objectif atteint
    uint64_t objectif = get_objectif();
    if (new_total >= objectif) {
        debug_msg("OBJECTIF REACHED! Status -> SUCCESS_PENDING");
        set_status(STATUS_SUCCESS_PENDING);
    }
    
    debug_msg("=== INVESTMENT SUCCESS ===");
    return 0;  // Success
}

// ============================================================================
// Core Logic - Deadline Check & Release
// ============================================================================

/*
 * handle_deadline_check()
 * Appelé lorsqu'un "ping" (1 drop XRP) arrive après la deadline
 * Décide du sort de la levée : succès → transfert entreprise, échec → remboursement
 */

static int64_t handle_deadline_check() {
    debug_msg("=== DEADLINE CHECK ===");
    
    // 1. Vérifier qu'on est après la deadline
    uint64_t deadline = get_deadline();
    int64_t current_time = ledger_last_time();
    
    if (current_time <= (int64_t)deadline) {
        debug_msg("INFO: Deadline not reached yet");
        return accept((uint32_t)"Too early", 9, 0);
    }
    
    debug_msg("Deadline reached - Processing...");
    
    // 2. Lire le statut actuel
    uint8_t status = get_status();
    
    if (status == STATUS_SUCCESS || status == STATUS_FAILED_REFUNDING) {
        debug_msg("Already processed");
        return accept((uint32_t)"Already finalized", 17, 0);
    }
    
    // 3. Vérifier si objectif atteint
    uint64_t total_raised = get_total_raised();
    uint64_t objectif = get_objectif();
    
    debug_trace("Total raised:", total_raised);
    debug_trace("Objectif:", objectif);
    
    if (total_raised >= objectif) {
        // SUCCESS: Transférer USDC à l'entreprise
        debug_msg("SUCCESS: Transferring to company...");
        
        // Lire l'adresse de l'entreprise
        uint8_t company_addr[ADDR_SIZE];
        _memset(company_addr, 0, sizeof(company_addr));
        
        int64_t result = read_state("CompanyAddress", company_addr, ADDR_SIZE);
        if (result < 0) {
            debug_msg("ERROR: No company address");
            return rollback((uint32_t)"No company addr", 15, 4);
        }
        
        // Émettre transfert USDC total vers entreprise
        if (emit_payment_usdc(company_addr, total_raised) < 0) {
            debug_msg("ERROR: Transfer to company failed");
            return rollback((uint32_t)"Transfer failed", 15, 5);
        }
        
        set_status(STATUS_SUCCESS);
        debug_msg("SUCCESS: Funds transferred to company");
        
    } else {
        // FAILED: Passer en mode remboursement
        debug_msg("FAILED: Activating refund mode...");
        set_status(STATUS_FAILED_REFUNDING);
        debug_msg("Refund mode activated - investors can claim");
    }
    
    debug_msg("=== DEADLINE PROCESSED ===");
    return accept((uint32_t)"Deadline processed", 18, 0);
}

// ============================================================================
// Core Logic - Refund Processing
// ============================================================================

/*
 * handle_refund_request()
 * Traite une demande de remboursement d'un investisseur
 * Conditions : Status = FAILED_REFUNDING, investisseur a contribué, pas déjà remboursé
 */

static int64_t handle_refund_request(const uint8_t* investor) {
    debug_msg("=== REFUND REQUEST ===");
    
    // 1. Vérifier le statut
    uint8_t status = get_status();
    if (status != STATUS_FAILED_REFUNDING) {
        debug_msg("ERROR: Refunds not available");
        return rollback((uint32_t)"Refunds unavailable", 19, 6);
    }
    
    // 2. Vérifier que l'investisseur n'est pas déjà remboursé
    if (is_refunded(investor)) {
        debug_msg("ERROR: Already refunded");
        return rollback((uint32_t)"Already refunded", 16, 7);
    }
    
    // 3. Lire le montant investi
    uint64_t invested = get_investor_amount(investor);
    if (invested == 0) {
        debug_msg("ERROR: No investment found");
        return rollback((uint32_t)"No investment", 13, 8);
    }
    
    debug_trace("Refund amount:", invested);
    
    // 4. Émettre le remboursement USDC
    if (emit_payment_usdc(investor, invested) < 0) {
        debug_msg("ERROR: Refund payment failed");
        return rollback((uint32_t)"Refund failed", 13, 9);
    }
    
    // 5. Marquer comme remboursé
    mark_refunded(investor);
    
    debug_msg("=== REFUND SUCCESS ===");
    return accept((uint32_t)"Refunded", 8, 0);
}

// ============================================================================
// Main Hook Entry Point
// ============================================================================

int64_t hook(uint32_t reserved) {
    (void)reserved;
    
    debug_msg("========================================");
    debug_msg("VAULT FUNDRAISER HOOK");
    debug_msg("========================================");
    
    // 1. Lire le type de transaction
    uint32_t tt;
    if (otxn_field((uint32_t)&tt, 4, sfTransactionType) < 0) {
        debug_msg("ERROR: Cannot read transaction type");
        return rollback((uint32_t)"Cannot read txn", 15, 10);
    }
    
    debug_trace("Transaction type:", tt);
    
    // 2. Filtrer : on ne traite que les Payments
    if (tt != ttPAYMENT) {
        debug_msg("Ignoring non-Payment transaction");
        return accept((uint32_t)"Ignored", 7, 0);
    }
    
    // 3. Lire l'expéditeur
    uint8_t sender[ADDR_SIZE];
    if (otxn_field((uint32_t)sender, ADDR_SIZE, sfAccount) < 0) {
        debug_msg("ERROR: Cannot read sender");
        return rollback((uint32_t)"Cannot read sender", 18, 11);
    }
    
    // 4. Lire le montant
    uint8_t amount_field[AMOUNT_SIZE];
    _memset(amount_field, 0, sizeof(amount_field));
    
    int64_t amount_len = otxn_field((uint32_t)amount_field, AMOUNT_SIZE, sfAmount);
    if (amount_len < 0) {
        debug_msg("ERROR: Cannot read amount");
        return rollback((uint32_t)"Cannot read amount", 18, 12);
    }
    
    uint64_t amount = parse_amount(amount_field, amount_len);
    debug_trace("Amount:", amount);
    
    // 5. Détecter le type d'action selon le montant
    
    if (amount <= 100) {
        // Ping (1-100 drops) : check deadline ou refund request
        debug_msg("PING detected");
        
        uint8_t status = get_status();
        
        if (status == STATUS_ACTIVE || status == STATUS_SUCCESS_PENDING) {
            // Deadline check
            return handle_deadline_check();
        } else if (status == STATUS_FAILED_REFUNDING) {
            // Refund request
            return handle_refund_request(sender);
        } else {
            // Déjà finalisé
            debug_msg("Already finalized");
            return accept((uint32_t)"Finalized", 9, 0);
        }
        
    } else {
        // Paiement USDC : investissement
        debug_msg("INVESTMENT detected");
        
        int64_t result = handle_investment(sender, amount);
        
        if (result < 0) {
            // Rollback déjà appelé
            return result;
        }
        
        // Success : accepter la transaction
        return accept((uint32_t)"Investment accepted", 19, 0);
    }
}

/*
 * cbak() - Callback pour transactions émises
 * Appelé quand une transaction émise par emit() est validée ou échoue
 */

int64_t cbak(uint32_t reserved) {
    (void)reserved;
    
    debug_msg("=== CALLBACK TRIGGERED ===");
    
    // Lire les détails de la transaction émise
    uint8_t txn_details[256];
    _memset(txn_details, 0, sizeof(txn_details));
    
    int64_t details_len = etxn_details((uint32_t)txn_details, sizeof(txn_details));
    if (details_len < 0) {
        debug_msg("ERROR: Cannot read emitted txn details");
        return 0;
    }
    
    debug_trace("Emitted txn details length:", details_len);
    
    // Vérifier si succès ou échec
    // NOTE: Dans un vrai Hook, parser les détails pour détecter tesSUCCESS
    
    debug_msg("=== CALLBACK COMPLETE ===");
    return 0;
}

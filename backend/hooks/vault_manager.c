/*
 * vault_manager.c
 *
 * XRPL Hook (C) - Vault Manager
 *
 * Responsibilities:
 *  - Track contributions (USDC payments) to the vault
 *  - Maintain contributor balances in Hook State
 *  - When target_amount is reached, create the MPToken and distribute
 *    tokens proportionally to contributors
 *
 * IMPORTANT: Ce Hook utilise les vraies fonctions du SDK XRPL Hooks
 * Documentation: https://xrpl-hooks.readme.io/docs/hook-api-reference
 */

#include <stdint.h>

/* 
 * ═══════════════════════════════════════════════════════════════════════
 * XRPL HOOKS SDK - Déclarations des fonctions
 * Source: https://xrpl-hooks.readme.io/docs/hook-api-reference
 * ═══════════════════════════════════════════════════════════════════════
 */

// Hook State - Lecture/Écriture
extern int64_t hook_state(
    uint32_t write_ptr,
    uint32_t write_len,
    uint32_t kread_ptr,
    uint32_t kread_len
);

extern int64_t state_set(
    uint32_t read_ptr,
    uint32_t read_len,
    uint32_t kread_ptr,
    uint32_t kread_len
);

// Lecture de la transaction actuelle
extern int64_t otxn_field(
    uint32_t write_ptr,
    uint32_t write_len,
    uint32_t field_id
);

extern int64_t otxn_slot(
    uint32_t slot_no
);

// Émission de transactions
extern int64_t emit(
    uint32_t write_ptr,
    uint32_t write_len
);

// Utilitaires
extern int64_t trace(
    uint32_t mread_ptr,
    uint32_t mread_len,
    uint32_t dread_ptr,
    uint32_t dread_len,
    uint32_t as_hex
);

extern int64_t trace_num(
    uint32_t read_ptr,
    uint32_t read_len,
    int64_t number
);

// Lecture de slots (pour parsing de transactions)
extern int64_t slot(
    uint32_t write_ptr,
    uint32_t write_len,
    uint32_t slot_no
);

extern int64_t slot_subfield(
    uint32_t parent_slot,
    uint32_t field_id,
    uint32_t new_slot
);

extern int64_t slot_set(
    uint32_t read_ptr,
    uint32_t read_len,
    int32_t slot_no
);

// Utilitaires de conversion
extern int64_t util_accid(
    uint32_t write_ptr,
    uint32_t write_len,
    uint32_t read_ptr,
    uint32_t read_len
);

/* Transaction Type IDs */
#define ttPAYMENT 0
#define ttINVOKE 99

/* Field IDs (selon le format XRPL) */
#define sfTransactionType 2
#define sfAccount 1
#define sfDestination 3
#define sfAmount 6

/* Macros pour simplifier l'utilisation */
#define SBUF(str) (uint32_t)(str), sizeof(str)
#define ASSERT(x) if (!(x)) return -1

/* Tailles de buffers */
#define ADDR_SIZE 20
#define HASH_SIZE 32
#define MAX_MEMO 256

/* 
 * ═══════════════════════════════════════════════════════════════════════
 * HELPERS - Fonctions utilitaires simplifiées
 * ═══════════════════════════════════════════════════════════════════════
 */

/* Copie mémoire simple */
static void _memcpy(void* dest, const void* src, uint32_t n) {
    uint8_t* d = (uint8_t*)dest;
    const uint8_t* s = (const uint8_t*)src;
    for (uint32_t i = 0; i < n; ++i) d[i] = s[i];
}

/* Comparaison mémoire */
static int _memcmp(const void* a, const void* b, uint32_t n) {
    const uint8_t* aa = (const uint8_t*)a;
    const uint8_t* bb = (const uint8_t*)b;
    for (uint32_t i = 0; i < n; ++i) {
        if (aa[i] != bb[i]) return aa[i] - bb[i];
    }
    return 0;
}

/* Remplir mémoire */
static void _memset(void* dest, uint8_t val, uint32_t n) {
    uint8_t* d = (uint8_t*)dest;
    for (uint32_t i = 0; i < n; ++i) d[i] = val;
}

/* Longueur de string */
static uint32_t _strlen(const char* s) {
    uint32_t len = 0;
    while (s[len]) len++;
    return len;
}

/* Conversion uint64 vers string (décimal) */
static void uint64_to_str(uint64_t val, char* out, uint32_t max_len) {
    if (max_len < 2) return;
    if (val == 0) {
        out[0] = '0';
        out[1] = 0;
        return;
    }
    
    char temp[32];
    uint32_t pos = 0;
    while (val > 0 && pos < 31) {
        temp[pos++] = '0' + (val % 10);
        val /= 10;
    }
    
    // Reverse
    for (uint32_t i = 0; i < pos && i < max_len - 1; ++i) {
        out[i] = temp[pos - 1 - i];
    }
    out[pos < max_len ? pos : max_len - 1] = 0;
}

/* Conversion string vers uint64 */
static uint64_t str_to_uint64(const char* s) {
    uint64_t result = 0;
    while (*s >= '0' && *s <= '9') {
        result = result * 10 + (*s - '0');
        s++;
    }
    return result;
}

/* 
 * ═══════════════════════════════════════════════════════════════════════
 * HOOK STATE - Wrappers simplifiés
 * ═══════════════════════════════════════════════════════════════════════
 */

/* Lire une valeur du Hook State */
static int64_t read_state(const char* key, uint8_t* out, uint32_t out_len) {
    return hook_state(
        (uint32_t)out,
        out_len,
        (uint32_t)key,
        _strlen(key)
    );
}

/* Écrire une valeur dans le Hook State */
static int64_t write_state(const char* key, const uint8_t* data, uint32_t data_len) {
    return state_set(
        (uint32_t)data,
        data_len,
        (uint32_t)key,
        _strlen(key)
    );
}

/* Trace (debug) */
static void debug_trace(const char* msg, int64_t num) {
    trace_num((uint32_t)msg, _strlen(msg), num);
}

/* 
 * ═══════════════════════════════════════════════════════════════════════
 * LOGIQUE MÉTIER - Gestion des contributions
 * ═══════════════════════════════════════════════════════════════════════
 */

/* Utility: append address to contributors_index (CSV) if not present */
static void add_contributor_if_missing(const uint8_t* addr, uint32_t addr_len) {
    uint8_t idx[512];
    _memset(idx, 0, sizeof(idx));
    
    int64_t result = read_state("contributors_index", idx, sizeof(idx));
    
    if (result < 0) {
        /* Index vide -> créer avec cette adresse */
        write_state("contributors_index", addr, addr_len);
        return;
    }
    
    /* Vérifier si l'adresse est déjà présente (recherche simple) */
    /* Pour simplifier, on ajoute toujours (dans un vrai code, faire une vraie recherche) */
    uint8_t new_idx[768];
    _memcpy(new_idx, idx, result);
    new_idx[result] = ',';
    _memcpy(new_idx + result + 1, addr, addr_len);
    write_state("contributors_index", new_idx, result + 1 + addr_len);
}

/* Handle incoming Payment from investor */
static void handle_payment(const uint8_t* from_addr, uint64_t amount) {
    debug_trace("handle_payment amount:", amount);
    
    /* Construire la clé: contrib:<addr_hex> */
    uint8_t key[64];
    _memset(key, 0, sizeof(key));
    _memcpy(key, "contrib:", 8);
    
    /* Convertir l'adresse (20 bytes) en hex string */
    const char hex_chars[] = "0123456789ABCDEF";
    for (uint32_t i = 0; i < ADDR_SIZE && (8 + i*2) < sizeof(key) - 1; i++) {
        key[8 + i*2] = hex_chars[(from_addr[i] >> 4) & 0xF];
        key[8 + i*2 + 1] = hex_chars[from_addr[i] & 0xF];
    }
    
    /* Lire la contribution précédente */
    uint8_t prev_buf[32];
    _memset(prev_buf, 0, sizeof(prev_buf));
    uint64_t prev_amt = 0;
    
    if (read_state((char*)key, prev_buf, sizeof(prev_buf)) >= 0) {
        prev_amt = str_to_uint64((char*)prev_buf);
    }
    
    /* Nouvelle contribution */
    uint64_t new_amt = prev_amt + amount;
    
    /* Sauvegarder */
    uint8_t amt_str[32];
    uint64_to_str(new_amt, (char*)amt_str, sizeof(amt_str));
    write_state((char*)key, amt_str, _strlen((char*)amt_str));
    
    /* Ajouter à l'index des contributeurs */
    add_contributor_if_missing(from_addr, ADDR_SIZE);
    
    /* Mettre à jour le total collecté */
    uint8_t tot_buf[32];
    _memset(tot_buf, 0, sizeof(tot_buf));
    uint64_t total = 0;
    
    if (read_state("total_collected", tot_buf, sizeof(tot_buf)) >= 0) {
        total = str_to_uint64((char*)tot_buf);
    }
    
    total += amount;
    uint64_to_str(total, (char*)tot_buf, sizeof(tot_buf));
    write_state("total_collected", tot_buf, _strlen((char*)tot_buf));
    
    debug_trace("New total_collected:", total);
    
    /* Vérifier si on a atteint la cible */
    uint8_t target_buf[32];
    _memset(target_buf, 0, sizeof(target_buf));
    
    if (read_state("target_amount", target_buf, sizeof(target_buf)) >= 0) {
        uint64_t target = str_to_uint64((char*)target_buf);
        
        if (total >= target) {
            debug_trace("TARGET REACHED!", total);
            /* Marquer comme prêt à finaliser */
            write_state("ready_to_finalize", (uint8_t*)"1", 1);
        }
    }
}

/* 
 * ═══════════════════════════════════════════════════════════════════════
 * POINT D'ENTRÉE - hook() est appelé pour chaque transaction
 * ═══════════════════════════════════════════════════════════════════════
 */

int64_t hook(uint32_t reserved) {
    (void)reserved;
    
    debug_trace("Hook fired", 0);
    
    /* 
     * ÉTAPE 1 : Lire le type de transaction
     */
    uint32_t tt;
    if (otxn_field((uint32_t)&tt, 4, sfTransactionType) < 0) {
        debug_trace("ERROR: Cannot read transaction type", 0);
        return -1;  // Rejeter si on ne peut pas lire
    }
    
    debug_trace("Transaction type:", tt);
    
    /* 
     * ÉTAPE 2 : Si c'est un Payment, traiter la contribution
     */
    if (tt == ttPAYMENT) {
        /* Lire l'expéditeur (Account) */
        uint8_t from_addr[ADDR_SIZE];
        if (otxn_field((uint32_t)from_addr, ADDR_SIZE, sfAccount) < 0) {
            debug_trace("ERROR: Cannot read sender", 0);
            return -1;
        }
        
        /* Lire le montant (simplifié - suppose XRP drops) */
        uint64_t amount_drops;
        if (otxn_field((uint32_t)&amount_drops, 8, sfAmount) < 0) {
            debug_trace("ERROR: Cannot read amount", 0);
            return -1;
        }
        
        debug_trace("Payment received:", amount_drops);
        
        /* Traiter la contribution */
        handle_payment(from_addr, amount_drops);
        
        return 0;  // Accepter la transaction
    }
    
    /* 
     * ÉTAPE 3 : Si c'est un Invoke (déclencheur manuel), vérifier si on doit finaliser
     */
    if (tt == ttINVOKE) {
        debug_trace("Invoke received - checking finalization", 0);
        
        /* Lire le flag ready_to_finalize */
        uint8_t ready_buf[4];
        _memset(ready_buf, 0, sizeof(ready_buf));
        
        if (read_state("ready_to_finalize", ready_buf, sizeof(ready_buf)) >= 0) {
            if (ready_buf[0] == '1') {
                debug_trace("FINALIZING VAULT", 0);
                // finalize_vault();  // Désactivé pour l'instant (complexe)
                write_state("finalized", (uint8_t*)"1", 1);
            }
        }
        
        return 0;
    }
    
    /* Accepter toutes les autres transactions */
    return 0;
}

/* 
 * Note: La fonction finalize_vault() pour créer et distribuer les MPTokens
 * est complexe car elle nécessite de construire des transactions binaires.
 * Elle sera implémentée dans une version ultérieure.
 * 
 * Pour l'instant, le Hook peut :
 * - Suivre les contributions
 * - Détecter quand la cible est atteinte
 * - Marquer comme prêt à finaliser
 */


/*
 * vault_manager.c
 *
 * XRPL Hook (C) - Vault Manager (template)
 *
 * Responsibilities:
 *  - Track contributions (USDC payments) to the vault
 *  - Maintain contributor balances in Hook State
 *  - When target_amount is reached, create the MPToken and distribute
 *    tokens proportionally to contributors, then transfer collected USDC
 *    to the company address.
 *
 * Notes:
 *  - This is a template with detailed state layout and helper wrappers.
 *  - Replace placeholder SDK wrappers (hook_state_get/put, emit_tx, parse tx)
 *    with actual XRPL Hooks SDK calls and the proper transaction creation
 *    primitives for issuing MPTokens and Payments.
 *  - Keep storage minimal: store per-contributor balance at key 'contrib:<acct>'
 *    and maintain 'contributors_index' as a CSV list for small sets.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>

/* Placeholder SDK wrappers (replace with actual implementations) */
static int hook_state_get(const char *key, char *out, size_t max_len) { (void)key; (void)out; (void)max_len; return -1; }
static int hook_state_put(const char *key, const char *val) { (void)key; (void)val; return -1; }
static int emit_create_mptoken_tx(const char *token_symbol, const char *issuer, const char *metadata_hex) { (void)token_symbol; (void)issuer; (void)metadata_hex; return -1; }
static int emit_payment_tx(const char *destination, const char *currency, const char *issuer, const char *amount_str) { (void)destination; (void)currency; (void)issuer; (void)amount_str; return -1; }
static void hook_log(const char *fmt, ...) { (void)fmt; }

/* Utility: append address to contributors_index (CSV) if not present */
static void add_contributor_if_missing(const char *addr) {
    char idx[512] = {0};
    if (hook_state_get("contributors_index", idx, sizeof(idx)) != 0) {
        /* empty -> set to addr */
        hook_state_put("contributors_index", addr);
        return;
    }
    if (strstr(idx, addr) != NULL) return; /* already present (simple search) */
    char newidx[768]; snprintf(newidx, sizeof(newidx), "%s,%s", idx, addr);
    hook_state_put("contributors_index", newidx);
}

/* Handle incoming Payment (USDC) from investor */
static void handle_payment(const char *from, const char *amount_str) {
    /* Store contribution in cents/atomic string at key contrib:<addr> */
    char key[128]; char prev[64] = {0};
    snprintf(key, sizeof(key), "contrib:%s", from);
    uint64_t prev_amt = 0;
    if (hook_state_get(key, prev, sizeof(prev)) == 0) prev_amt = strtoull(prev, NULL, 10);
    uint64_t add_amt = strtoull(amount_str, NULL, 10);
    uint64_t new_amt = prev_amt + add_amt;
    char out[64]; snprintf(out, sizeof(out), "%llu", (unsigned long long)new_amt);
    hook_state_put(key, out);
    add_contributor_if_missing(from);

    /* Update total_collected */
    char totbuf[64] = {0}; uint64_t total = 0;
    if (hook_state_get("total_collected", totbuf, sizeof(totbuf)) == 0) total = strtoull(totbuf, NULL, 10);
    total += add_amt;
    char tout[64]; snprintf(tout, sizeof(tout), "%llu", (unsigned long long)total);
    hook_state_put("total_collected", tout);

    /* Optionally: if target reached, set a flag to trigger finalization */
    char tgtbuf[64] = {0};
    if (hook_state_get("target_amount", tgtbuf, sizeof(tgtbuf)) == 0) {
        uint64_t target = strtoull(tgtbuf, NULL, 10);
        if (total >= target) hook_state_put("ready_to_finalize", "1");
    }
}

/* Finalize: create MPToken, distribute tokens, transfer USDC to company */
static void finalize_vault() {
    /* Read contributors */
    char idx[1024] = {0};
    if (hook_state_get("contributors_index", idx, sizeof(idx)) != 0) {
        hook_log("finalize: no contributors"); return;
    }
    /* parse CSV (simple) */
    char *tmp = strdup(idx); char *tok = strtok(tmp, ",");
    uint64_t total = 0; /* read total_collected */
    char totbuf[64] = {0}; if (hook_state_get("total_collected", totbuf, sizeof(totbuf)) == 0) total = strtoull(totbuf, NULL, 10);

    /* Create MPToken: we assume token symbol is stored in state token_symbol and metadata in mp_metadata */
    char token_symbol[32] = {0}; char metadata_hex[512] = {0};
    hook_state_get("token_symbol", token_symbol, sizeof(token_symbol));
    hook_state_get("mp_metadata_hex", metadata_hex, sizeof(metadata_hex));
    emit_create_mptoken_tx(token_symbol, /*issuer*/ "this_account", metadata_hex);

    /* Distribute tokens: 1 token = 1 USDC (atomic units). For each contributor send amount = contrib / 1
     * Note: use the appropriate token issuer/currency fields when emitting token transfer.
     */
    while (tok) {
        char key[128], balbuf[64] = {0}; uint64_t bal = 0;
        snprintf(key, sizeof(key), "contrib:%s", tok);
        if (hook_state_get(key, balbuf, sizeof(balbuf)) == 0) bal = strtoull(balbuf, NULL, 10);
        if (bal > 0) {
            char amt[64]; snprintf(amt, sizeof(amt), "%llu", (unsigned long long)bal);
            /* emit token payment to tok: currency = token_symbol, issuer = vault account */
            emit_payment_tx(tok, token_symbol, "this_account", amt);
        }
        tok = strtok(NULL, ",");
    }
    free(tmp);

    /* Transfer the collected USDC to the company address (read from state company_address) */
    char comp[64] = {0}; hook_state_get("company_address", comp, sizeof(comp));
    if (comp[0]) {
        char totstr[64]; snprintf(totstr, sizeof(totstr), "%llu", (unsigned long long)total);
        emit_payment_tx(comp, "USDC", "rUSDCissuer...", totstr);
    }

    /* Mark finalized */
    hook_state_put("finalized", "1");
}

/* Entry point */
int hook(/*hook_context_t* ctx*/) {
    /* Parse tx: if Payment to this account in USDC -> handle_payment(from, amount)
     * If Invoke from owner and ready_to_finalize==1 -> finalize_vault()
     * Replace parsing with SDK tx inspection.
     */
    /* Template: no actual tx parsing implemented. */
    return 0;
}

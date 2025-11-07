/*
 * coupon_distributor.c
 *
 * XRPL Hook (C) - Coupon Distributor (detailed template)
 *
 * Behaviour implemented (template):
 *  - Detect incoming coupon Payment to the vault account (by currency/issuer)
 *  - Read holders from Hook State (per-holder keys + index)
 *  - Compute proportional shares in integer math (fixed-point cents)
 *  - Emit Payment transactions to holders for their share
 *  - Update MPToken metadata: decrement couponsRemaining
 *
 * Important: This file uses small wrapper functions (hook_state_get, hook_state_put,
 * emit_tx, hook_log, tx_field helpers). Replace these placeholders with the
 * exact XRPL Hooks SDK calls available in your compilation environment.
 */

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <stdint.h>

/* SDK placeholders - replace with actual Hooks SDK includes and calls */
// #include "hooks.h"

#define HOOK_SUCCESS 0
#define HOOK_FAILURE 1

/* State key conventions used across hooks:
 * - holders_index => CSV list of holder addresses (small sets only)
 * - holder:<acct> => integer balance in token atomic units (string)
 * - tokens_index => CSV list of token ids (e.g. mp:1)
 * - mpmeta:<token_id>:couponsRemaining => integer
 */

/* --- Placeholder SDK wrappers (implement with real SDK) ------------------ */
static int hook_state_get(const char *key, char *out, size_t max_len) { (void)key; (void)out; (void)max_len; return HOOK_FAILURE; }
static int hook_state_put(const char *key, const char *val) { (void)key; (void)val; return HOOK_FAILURE; }
static int emit_payment_tx(const char *destination, const char *currency, const char *issuer, const char *amount_str) { (void)destination; (void)currency; (void)issuer; (void)amount_str; return HOOK_FAILURE; }
static void hook_log(const char *fmt, ...) { (void)fmt; }
/* ------------------------------------------------------------------------- */

/* Utility: parse CSV list of addresses into array. Returns count (max max_out).
 * Caller must free addresses[i] strings. */
static int parse_csv_addresses(const char *csv, char **out, int max_out) {
    if (!csv || !csv[0]) return 0;
    char *tmp = strdup(csv);
    char *tok; int count = 0;
    tok = strtok(tmp, ",");
    while (tok && count < max_out) {
        out[count++] = strdup(tok);
        tok = strtok(NULL, ",");
    }
    free(tmp);
    return count;
}

/* Utility: safe integer multiplication and division for proportional shares.
 * All amounts are expressed as integer cents/atomic units.
 */
static uint64_t mul_div_u64(uint64_t a, uint64_t b, uint64_t c) {
    if (c == 0) return 0;
    __uint128_t prod = (__uint128_t)a * (__uint128_t)b;
    return (uint64_t)(prod / c);
}

/* Read holders index and populate balances array. Returns holder_count.
 * max_holders is the capacity of out_addrs and out_balances arrays.
 */
static int read_holders_list(char **out_addrs, uint64_t *out_balances, int max_holders) {
    char idx_buf[256] = {0};
    if (hook_state_get("holders_index", idx_buf, sizeof(idx_buf)) != HOOK_SUCCESS) return 0;
    int count = parse_csv_addresses(idx_buf, out_addrs, max_holders);
    for (int i = 0; i < count; ++i) {
        char key[96]; char bal_buf[64] = {0};
        snprintf(key, sizeof(key), "holder:%s", out_addrs[i]);
        if (hook_state_get(key, bal_buf, sizeof(bal_buf)) != HOOK_SUCCESS) {
            out_balances[i] = 0;
        } else {
            out_balances[i] = strtoull(bal_buf, NULL, 10);
        }
    }
    return count;
}

/* Decrement couponsRemaining for a token_id by 1 (safe). */
static void decrement_coupons_remaining(const char *token_id) {
    char key[128], buf[64] = {0};
    snprintf(key, sizeof(key), "mpmeta:%s:couponsRemaining", token_id);
    if (hook_state_get(key, buf, sizeof(buf)) != HOOK_SUCCESS) return;
    uint64_t val = strtoull(buf, NULL, 10);
    if (val == 0) return;
    --val;
    char out[64]; snprintf(out, sizeof(out), "%llu", (unsigned long long)val);
    hook_state_put(key, out);
}

/* Detect whether incoming transaction is a coupon payment for token_id.
 * For the template: we treat any Payment in the coupon currency as a trigger
 * and the token_id must be provided via a memo or preconfigured state key
 * `active_token` in Hook State.
 */
static int is_coupon_payment_trigger(/*ctx, tx*/) {
    /* Implement TX parsing with real SDK here. For template return true. */
    return 1;
}

int hook(/*hook_context_t *ctx*/) {
    if (!is_coupon_payment_trigger(/*ctx*/)) return HOOK_SUCCESS;

    /* Read active token id (which MPToken receives the coupon) */
    char active_token[64] = {0};
    if (hook_state_get("active_token", active_token, sizeof(active_token)) != HOOK_SUCCESS) {
        hook_log("coupon: no active_token configured");
        return HOOK_SUCCESS; /* nothing to do */
    }

    /* Read coupon amount in atomic units (from tx) -> for template use state 'last_coupon_amount' */
    char coupon_amount_buf[64] = {0};
    if (hook_state_get("last_coupon_amount", coupon_amount_buf, sizeof(coupon_amount_buf)) != HOOK_SUCCESS) {
        hook_log("coupon: no last_coupon_amount in state");
        return HOOK_SUCCESS;
    }
    uint64_t coupon_amount = strtoull(coupon_amount_buf, NULL, 10);
    if (coupon_amount == 0) return HOOK_SUCCESS;

    /* Read holders */
    const int MAX_HOLDERS = 64;
    char *addrs[MAX_HOLDERS]; uint64_t bals[MAX_HOLDERS];
    for (int i = 0; i < MAX_HOLDERS; ++i) { addrs[i] = NULL; bals[i] = 0; }
    int n = read_holders_list(addrs, bals, MAX_HOLDERS);
    if (n == 0) {
        hook_log("coupon: no holders to distribute to");
        return HOOK_SUCCESS;
    }

    uint64_t total = 0;
    for (int i = 0; i < n; ++i) total += bals[i];
    if (total == 0) { hook_log("coupon: total holdings zero"); goto cleanup; }

    /* Distribute proportionally */
    for (int i = 0; i < n; ++i) {
        uint64_t share = mul_div_u64(coupon_amount, bals[i], total);
        if (share == 0) continue;
        char share_str[64]; snprintf(share_str, sizeof(share_str), "%llu", (unsigned long long)share);
        /* currency/issuer can be stored in state like coupon_currency / coupon_issuer */
        char currency[16] = "USDC"; char issuer[64] = "rUSDCissuer...";
        if (emit_payment_tx(addrs[i], currency, issuer, share_str) != HOOK_SUCCESS) {
            hook_log("coupon: payment failed to %s", addrs[i]);
            /* continue distributing to others */
        }
    }

    /* decrement couponsRemaining */
    decrement_coupons_remaining(active_token);

cleanup:
    for (int i = 0; i < MAX_HOLDERS; ++i) if (addrs[i]) free(addrs[i]);
    return HOOK_SUCCESS;
}

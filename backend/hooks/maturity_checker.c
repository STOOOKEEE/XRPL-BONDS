/*
 * maturity_checker.c
 *
 * XRPL Hook (C) - Maturity Checker (detailed template)
 *
 * Behaviour implemented (template):
 *  - On an authorized trigger (Invoke or scheduled ping), scan tokens listed
 *    in Hook State `tokens_index` and mark those whose maturityDate <= now
 *    as matured by setting `mpmeta:<token_id>:isMatured` = "1" in state.
 *  - Optionally, you can rely on this flag in other hooks to reject transfers.
 *
 * Important: Hooks don't run off-chain; to perform periodic scans use a
 * scheduled transaction or an off-chain caller that submits a small tx to
 * the Hook account which then triggers this code.
 */

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <stdint.h>

/* SDK placeholders - replace with actual Hooks SDK includes and calls */
// #include "hooks.h"

#define HOOK_SUCCESS 0
#define HOOK_FAILURE 1

/* Placeholder wrappers to be replaced with real SDK calls */
static int hook_state_get(const char *key, char *out, size_t max_len) { (void)key; (void)out; (void)max_len; return HOOK_FAILURE; }
static int hook_state_put(const char *key, const char *val) { (void)key; (void)val; return HOOK_FAILURE; }
static void hook_log(const char *fmt, ...) { (void)fmt; }

/* Parse CSV tokens list into array (caller frees entries) */
static int parse_csv(const char *csv, char **out, int max_out) {
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

/* Read token maturity timestamp (unix secs) from state key mpmeta:<token_id>:maturityDate */
static int read_token_maturity(const char* token_id, uint64_t *out_ts) {
    char key[128], buf[64] = {0};
    snprintf(key, sizeof(key), "mpmeta:%s:maturityDate", token_id);
    if (hook_state_get(key, buf, sizeof(buf)) != HOOK_SUCCESS) return 0;
    *out_ts = strtoull(buf, NULL, 10);
    return 1;
}

/* Mark token as matured: set mpmeta:<token_id>:isMatured = "1" */
static void mark_token_matured(const char* token_id) {
    char key[128]; snprintf(key, sizeof(key), "mpmeta:%s:isMatured", token_id);
    hook_state_put(key, "1");
}

/* Decide whether to run a maturity scan. For safety we only run if caller
 * included a memo 'maturity-scan' or if tx is from an authorized checker.
 * Placeholder returns true for template.
 */
static int should_run_maturity_scan(/*ctx*/) { (void)0; return 1; }

/* Get current unix timestamp. Replace with SDK-provided time if available.
 * As a template we expect an off-chain caller to write 'now' into state
 * key 'now_ts' to avoid depending on host clock inside the hook.
 */
static uint64_t get_now_ts_from_state() {
    char buf[64] = {0};
    if (hook_state_get("now_ts", buf, sizeof(buf)) != HOOK_SUCCESS) return 0;
    return strtoull(buf, NULL, 10);
}

int hook(/*hook_context_t* ctx*/) {
    if (!should_run_maturity_scan(/*ctx*/)) return HOOK_SUCCESS;

    /* Read tokens_index */
    char idx[512] = {0};
    if (hook_state_get("tokens_index", idx, sizeof(idx)) != HOOK_SUCCESS) {
        hook_log("maturity: no tokens_index");
        return HOOK_SUCCESS;
    }

    const int MAX_TOKENS = 128;
    char *tokens[MAX_TOKENS]; int tcount = parse_csv(idx, tokens, MAX_TOKENS);
    uint64_t now = get_now_ts_from_state();
    if (now == 0) {
        hook_log("maturity: now_ts not provided in state");
        goto cleanup;
    }

    for (int i = 0; i < tcount; ++i) {
        uint64_t maturity = 0;
        if (!read_token_maturity(tokens[i], &maturity)) continue;
        char isM[8] = {0};
        char meta_key[128]; snprintf(meta_key, sizeof(meta_key), "mpmeta:%s:isMatured", tokens[i]);
        if (hook_state_get(meta_key, isM, sizeof(isM)) == HOOK_SUCCESS && isM[0] == '1') {
            /* already matured */
            continue;
        }
        if (now >= maturity) {
            mark_token_matured(tokens[i]);
            hook_log("maturity: token %s marked matured", tokens[i]);
        }
    }

cleanup:
    for (int i = 0; i < tcount; ++i) if (tokens[i]) free(tokens[i]);
    return HOOK_SUCCESS;
}

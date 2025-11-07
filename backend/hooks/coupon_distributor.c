/*
 * coupon_distributor.c - XRPL Hook
 * Distribue les coupons proportionnellement aux holders
 */

#include <stdint.h>

extern int32_t _g(uint32_t id, uint32_t maxiter);
extern int64_t state(uint32_t write_ptr, uint32_t write_len, uint32_t kread_ptr, uint32_t kread_len);
extern int64_t state_set(uint32_t read_ptr, uint32_t read_len, uint32_t kread_ptr, uint32_t kread_len);
extern int64_t otxn_field(uint32_t write_ptr, uint32_t write_len, uint32_t field_id);
extern int64_t trace_num(uint32_t read_ptr, uint32_t read_len, int64_t number);
extern int64_t ledger_seq();

#define ttPAYMENT 0
#define sfTransactionType 2
#define sfAccount 1
#define sfAmount 6
#define ADDR_SIZE 20
#define MAX_HOLDERS 50

typedef struct {
    uint8_t address[ADDR_SIZE];
    uint64_t tokens;
} Holder;

static void _memcpy(void* dest, const void* src, uint32_t n) {
    uint8_t* d = (uint8_t*)dest;
    const uint8_t* s = (const uint8_t*)src;
    for (uint32_t i = 0; i < n; ++i) { _g(3, 1); d[i] = s[i]; }
}

static void _memset(void* dest, uint8_t val, uint32_t n) {
    uint8_t* d = (uint8_t*)dest;
    for (uint32_t i = 0; i < n; ++i) { _g(5, 1); d[i] = val; }
}

static uint32_t _strlen(const char* s) {
    uint32_t len = 0;
    while (s[len]) { _g(7, 1); len++; if (len > 256) break; }
    return len;
}

static void uint64_to_str(uint64_t val, char* out, uint32_t max_len) {
    if (max_len < 2) return;
    if (val == 0) { out[0] = '0'; out[1] = 0; return; }
    char temp[32]; uint32_t pos = 0; uint32_t guard = 0;
    while (val > 0 && pos < 31) { _g(1, 1); temp[pos++] = '0' + (val % 10); val /= 10; if (++guard > 25) break; }
    for (uint32_t i = 0; i < pos && i < max_len - 1; ++i) { _g(1, 1); out[i] = temp[pos - 1 - i]; }
    out[pos < max_len ? pos : max_len - 1] = 0;
}

static uint64_t str_to_uint64(const char* s) {
    uint64_t result = 0; uint32_t guard = 0;
    while (*s >= '0' && *s <= '9') { _g(2, 1); result = result * 10 + (*s - '0'); s++; if (++guard > 25) break; }
    return result;
}

static int64_t read_state(const char* key, uint8_t* out, uint32_t out_len) {
    return state((uint32_t)out, out_len, (uint32_t)key, _strlen(key));
}

static int64_t write_state(const char* key, const uint8_t* data, uint32_t data_len) {
    return state_set((uint32_t)data, data_len, (uint32_t)key, _strlen(key));
}

static void debug_trace(const char* msg, int64_t num) {
    trace_num((uint32_t)msg, _strlen(msg), num);
}

static int32_t load_holders(Holder* holders_out, uint32_t max_holders) {
    debug_trace("Loading holders...", 0);
    uint8_t index_buf[1024]; _memset(index_buf, 0, sizeof(index_buf));
    int64_t index_len = read_state("contributors_index", index_buf, sizeof(index_buf));
    if (index_len < 0) { debug_trace("No contributors_index", 0); return 0; }
    debug_trace("Index size:", index_len);
    uint32_t holder_count = 0; uint32_t pos = 0;
    while (pos < index_len && holder_count < max_holders) {
        _g(10, 1);
        if (pos + ADDR_SIZE <= index_len) {
            _memcpy(holders_out[holder_count].address, index_buf + pos, ADDR_SIZE);
            uint8_t key[64]; _memset(key, 0, sizeof(key)); _memcpy(key, "contrib:", 8);
            const char hex_chars[] = "0123456789ABCDEF";
            for (uint32_t i = 0; i < ADDR_SIZE && (8 + i*2) < sizeof(key) - 1; i++) {
                _g(11, 1);
                uint8_t byte = holders_out[holder_count].address[i];
                key[8 + i*2] = hex_chars[(byte >> 4) & 0xF];
                key[8 + i*2 + 1] = hex_chars[byte & 0xF];
            }
            uint8_t amount_buf[32]; _memset(amount_buf, 0, sizeof(amount_buf));
            if (read_state((char*)key, amount_buf, sizeof(amount_buf)) >= 0) {
                holders_out[holder_count].tokens = str_to_uint64((char*)amount_buf);
                debug_trace("Holder tokens:", holders_out[holder_count].tokens);
            } else { holders_out[holder_count].tokens = 0; }
            holder_count++; pos += ADDR_SIZE;
            if (pos < index_len && index_buf[pos] == ',') { pos++; }
        } else { break; }
    }
    debug_trace("Loaded holders:", holder_count);
    return holder_count;
}

static void distribute_coupon(uint64_t total_coupon_amount) {
    debug_trace("Distribution amount:", total_coupon_amount);
    Holder holders[MAX_HOLDERS];
    int32_t holder_count = load_holders(holders, MAX_HOLDERS);
    if (holder_count <= 0) { debug_trace("No holders", 0); return; }
    uint8_t total_buf[32]; _memset(total_buf, 0, sizeof(total_buf));
    int64_t result = read_state("total_collected", total_buf, sizeof(total_buf));
    if (result < 0) { debug_trace("ERROR: No total_collected", 0); return; }
    uint64_t total_supply = str_to_uint64((char*)total_buf);
    if (total_supply == 0) { debug_trace("ERROR: total_supply is 0", 0); return; }
    debug_trace("Total supply:", total_supply);
    uint64_t total_distributed = 0;
    for (uint32_t i = 0; i < holder_count; ++i) {
        _g(12, 1);
        if (holders[i].tokens == 0) continue;
        uint64_t share = (total_coupon_amount * holders[i].tokens) / total_supply;
        if (share == 0) { debug_trace("Share too small", i); continue; }
        debug_trace("Holder share:", share);
        uint8_t key[64]; _memset(key, 0, sizeof(key)); _memcpy(key, "pending_coupon:", 15);
        const char hex_chars[] = "0123456789ABCDEF";
        for (uint32_t j = 0; j < ADDR_SIZE && (15 + j*2) < sizeof(key) - 1; j++) {
            _g(13, 1);
            uint8_t byte = holders[i].address[j];
            key[15 + j*2] = hex_chars[(byte >> 4) & 0xF];
            key[15 + j*2 + 1] = hex_chars[byte & 0xF];
        }
        uint8_t share_str[32]; uint64_to_str(share, (char*)share_str, sizeof(share_str));
        write_state((char*)key, share_str, _strlen((char*)share_str));
        total_distributed += share;
    }
    debug_trace("Total distributed:", total_distributed);
    int64_t current_ledger = ledger_seq();
    uint8_t ledger_str[16]; uint64_to_str(current_ledger, (char*)ledger_str, sizeof(ledger_str));
    write_state("last_coupon_ledger", ledger_str, _strlen((char*)ledger_str));
    uint8_t amount_str[32]; uint64_to_str(total_coupon_amount, (char*)amount_str, sizeof(amount_str));
    write_state("last_coupon_amount", amount_str, _strlen((char*)amount_str));
    uint8_t count_str[8]; uint64_to_str(holder_count, (char*)count_str, sizeof(count_str));
    write_state("last_coupon_recipients", count_str, _strlen((char*)count_str));
    debug_trace("Distribution completed", 0);
}

int64_t hook(uint32_t reserved) {
    (void)reserved;
    debug_trace("Coupon Distributor fired", 0);
    uint32_t tt;
    if (otxn_field((uint32_t)&tt, 4, sfTransactionType) < 0) { debug_trace("ERROR: Cannot read txn type", 0); return -1; }
    debug_trace("Transaction type:", tt);
    if (tt != ttPAYMENT) { return 0; }
    uint8_t sender[ADDR_SIZE];
    if (otxn_field((uint32_t)sender, ADDR_SIZE, sfAccount) < 0) { debug_trace("ERROR: Cannot read sender", 0); return -1; }
    uint8_t authorized_issuer[ADDR_SIZE]; _memset(authorized_issuer, 0, sizeof(authorized_issuer));
    int64_t result = read_state("beneficiary_address", authorized_issuer, sizeof(authorized_issuer));
    if (result >= 0) {
        int is_authorized = 1;
        for (uint32_t i = 0; i < ADDR_SIZE; ++i) { _g(14, 1); if (sender[i] != authorized_issuer[i]) { is_authorized = 0; break; } }
        if (!is_authorized) { debug_trace("WARNING: Sender not authorized", 0); }
    }
    uint64_t coupon_amount;
    if (otxn_field((uint32_t)&coupon_amount, 8, sfAmount) < 0) { debug_trace("ERROR: Cannot read amount", 0); return -1; }
    debug_trace("Coupon amount received:", coupon_amount);
    distribute_coupon(coupon_amount);
    return 0;
}

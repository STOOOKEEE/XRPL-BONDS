"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var xrpl_1 = require("xrpl");
var dotenv = require("dotenv");
dotenv.config();
// XRPL WebSocket (devnet fallback)
var WS_URL = (_a = process.env.XRPL_WEBSOCKET_URL) !== null && _a !== void 0 ? _a : 'wss://s.altnet.rippletest.net:51233';
var client = new xrpl_1.Client(WS_URL);
// Helper: Mint or Transfer fallback
function sendMPToken(issuerWallet, issuanceId, destination, amount) {
    return __awaiter(this, void 0, void 0, function () {
        var submitTransfer, err_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!issuanceId || issuanceId === 'n/a')
                        throw new Error('IssuanceID manquant');
                    if (!destination)
                        throw new Error('Destination manquante');
                    if (!amount)
                        throw new Error('Montant manquant');
                    submitTransfer = function (txType) { return __awaiter(_this, void 0, void 0, function () {
                        var tx;
                        return __generator(this, function (_a) {
                            tx = {
                                TransactionType: txType,
                                Account: issuerWallet.address,
                                IssuanceID: issuanceId,
                                Destination: destination,
                                Amount: amount,
                            };
                            console.log("\u2192 Submit ".concat(txType, " vers ").concat(destination, " (").concat(amount, ")"));
                            return [2 /*return*/, client.submitAndWait(tx, { autofill: true, wallet: issuerWallet })];
                        });
                    }); };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, submitTransfer('MPTokenMint')];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    err_1 = _a.sent();
                    console.warn('Mint failed, trying Transfer:', err_1 === null || err_1 === void 0 ? void 0 : err_1.message);
                    return [2 /*return*/, submitTransfer('MPTokenTransfer')];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var issuerWallet, holderAddress, issuanceId, amount, result, txHash, status_1, e_1;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        return __generator(this, function (_m) {
            switch (_m.label) {
                case 0:
                    _m.trys.push([0, 3, 4, 6]);
                    console.log('=== Envoi de MPToken ===');
                    return [4 /*yield*/, client.connect()
                        // Wallet issuer
                    ];
                case 1:
                    _m.sent();
                    // Wallet issuer
                    if (!process.env.ISSUER_SECRET)
                        throw new Error('ISSUER_SECRET manquant dans .env');
                    issuerWallet = xrpl_1.Wallet.fromSeed(process.env.ISSUER_SECRET);
                    holderAddress = (_a = process.env.HOLDER_ADDRESS) !== null && _a !== void 0 ? _a : (function () {
                        throw new Error('HOLDER_ADDRESS manquant dans .env');
                    })();
                    issuanceId = (_b = process.env.MPTOKEN_ISSUANCE_ID) !== null && _b !== void 0 ? _b : (function () {
                        throw new Error('MPTOKEN_ISSUANCE_ID manquant dans .env');
                    })();
                    amount = (_c = process.env.MPTOKEN_AMOUNT) !== null && _c !== void 0 ? _c : (function () {
                        throw new Error('MPTOKEN_AMOUNT manquant dans .env');
                    })();
                    console.log('Issuer:', issuerWallet.address);
                    console.log('Holder:', holderAddress);
                    console.log('IssuanceID:', issuanceId);
                    console.log('Amount:', amount);
                    return [4 /*yield*/, sendMPToken(issuerWallet, issuanceId, holderAddress, amount)];
                case 2:
                    result = _m.sent();
                    txHash = (_f = (_e = (_d = result === null || result === void 0 ? void 0 : result.result) === null || _d === void 0 ? void 0 : _d.tx_json) === null || _e === void 0 ? void 0 : _e.hash) !== null && _f !== void 0 ? _f : 'n/a';
                    status_1 = (_l = (_j = (_h = (_g = result === null || result === void 0 ? void 0 : result.result) === null || _g === void 0 ? void 0 : _g.meta) === null || _h === void 0 ? void 0 : _h.TransactionResult) !== null && _j !== void 0 ? _j : (_k = result === null || result === void 0 ? void 0 : result.result) === null || _k === void 0 ? void 0 : _k.engine_result) !== null && _l !== void 0 ? _l : 'unknown';
                    console.log('✅ Transaction Hash:', txHash);
                    console.log('✅ Status:', status_1);
                    return [3 /*break*/, 6];
                case 3:
                    e_1 = _m.sent();
                    console.error('❌ Erreur:', e_1);
                    process.exitCode = 1;
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, client.disconnect().catch(function () { })];
                case 5:
                    _m.sent();
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
if (require.main === module)
    main();

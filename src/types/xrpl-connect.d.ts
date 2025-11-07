// Crossmark wallet extension types
declare global {
  interface Window {
    crossmark?: {
      request(args: {
        method: string;
        params?: any;
      }): Promise<{
        account?: string;
        signature?: string;
        signedTransaction?: string;
        hash?: string;
        result?: {
          status?: string;
          transaction?: any;
        };
      }>;
    };
    xaman?: {
      request(args: {
        method: string;
        params?: any;
      }): Promise<{
        account?: string;
        signature?: string;
        signedTransaction?: string;
        hash?: string;
        result?: {
          status?: string;
          transaction?: any;
        };
      }>;
    };
  }
}

declare module 'xrpl-connect' {
  export class WalletManager {
    constructor(options?: {
      adapters: any[];
      network: string;
      autoConnect?: boolean;
    });
    connect(): Promise<any>;
    disconnect(): Promise<void>;
    sign(transaction: any): Promise<any>;
    on(event: string, callback: (data: any) => void): void;
    off(event: string, callback: (data: any) => void): void;
    account?: { address: string; publicKey?: string };
  }

  export class XamanAdapter {
    constructor();
  }

  export class CrossmarkAdapter {
    constructor();
  }

  export class GemWalletAdapter {
    constructor();
  }

  export class WalletConnectAdapter {
    constructor();
  }
}

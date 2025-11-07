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
  export class XrplConnect {
    constructor(options?: any);
    request(request: {
      method: string;
      params?: any;
    }): Promise<any>;
    on(event: string, callback: (data: any) => void): void;
    off(event: string, callback: (data: any) => void): void;
  }
}

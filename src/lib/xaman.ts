/**
 * Utilitaires pour la gestion de Xaman wallet
 */

export interface XamanPayloadResponse {
  uuid: string;
  next: {
    always: string;
    no_push_msg_received?: string;
  };
  refs: {
    qr_png: string;
    qr_matrix: string;
    qr_uri_quality_opts: string[];
    websocket_status: string;
  };
  pushed: boolean;
}

export interface XamanPayloadStatus {
  meta: {
    exists: boolean;
    uuid: string;
    multisign: boolean;
    submit: boolean;
    destination: string;
    resolved_destination: string;
    resolved: boolean;
    signed: boolean | null;
    cancelled: boolean;
    expired: boolean;
    pushed: boolean;
    app_opened: boolean;
    return_url_app: string | null;
    return_url_web: string | null;
  };
  application: {
    name: string;
    description: string;
    disabled: number;
    uuidv4: string;
    icon_url: string;
    issued_user_token: string | null;
  };
  payload: {
    tx_type: string;
    tx_destination: string;
    tx_destination_tag: number | null;
    request_json: any;
    created_at: string;
    expires_at: string;
    expires_in_seconds: number;
  };
  response?: {
    hex: string;
    txid: string;
    resolved_at: string;
    dispatched_to: string;
    dispatched_nodetype: string;
    dispatched_result: string;
    multisign_account: string;
    account: string;
    signer: string;
    environment_nodeuri: string;
    environment_nodetype: string;
  };
  custom_meta?: {
    identifier: string | null;
    blob: any;
    instruction: string | null;
  };
}

/**
 * Crée un payload Xaman pour la connexion (SignIn)
 */
export async function createXamanSignInPayload(
  apiKey: string,
  returnUrl: string
): Promise<XamanPayloadResponse> {
  console.log('📤 Création du payload Xaman...');
  console.log('🔗 Return URL:', returnUrl);
  console.log('🔑 API Key présente:', !!apiKey);

  try {
    const response = await fetch('https://xumm.app/api/v1/platform/payload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        txjson: {
          TransactionType: 'SignIn',
        },
        options: {
          return_url: {
            web: returnUrl,
          },
        },
      }),
    });

    console.log('📥 Réponse Xaman:', response.status, response.statusText);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Erreur Xaman API:', error);
      throw new Error(error.error?.message || `Erreur ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Payload créé avec succès:', data.uuid);
    return data;
  } catch (error) {
    console.error('❌ Erreur lors de la création du payload:', error);
    throw error;
  }
}

/**
 * Vérifie le statut d'un payload Xaman
 */
export async function getXamanPayloadStatus(
  apiKey: string,
  payloadId: string
): Promise<XamanPayloadStatus> {
  const response = await fetch(`https://xumm.app/api/v1/platform/payload/${payloadId}`, {
    headers: {
      'X-API-Key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error('Impossible de récupérer le statut du payload');
  }

  return response.json();
}

/**
 * Vérifie périodiquement le statut d'un payload jusqu'à ce qu'il soit signé ou refusé
 */
export async function waitForXamanSignature(
  apiKey: string,
  payloadId: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000,
  onProgress?: (attempt: number, maxAttempts: number) => void
): Promise<XamanPayloadStatus> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getXamanPayloadStatus(apiKey, payloadId);

    // Signature confirmée
    if (status.meta.signed === true) {
      return status;
    }

    // Signature refusée
    if (status.meta.signed === false) {
      throw new Error('Connexion refusée par l\'utilisateur');
    }

    // Payload expiré
    if (status.meta.expired) {
      throw new Error('Le délai de connexion a expiré');
    }

    // Payload annulé
    if (status.meta.cancelled) {
      throw new Error('Connexion annulée');
    }

    // Callback de progression
    if (onProgress) {
      onProgress(attempt + 1, maxAttempts);
    }

    // Attendre avant le prochain essai
    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error('Délai d\'attente dépassé. Veuillez réessayer.');
}

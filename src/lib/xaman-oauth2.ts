/**
 * Xaman OAuth2 helpers
 * https://docs.xaman.dev/environments/identity-oauth2-openid
 */

export function redirectToXamanOAuth2(clientId: string, redirectUri: string) {
  const oauth2Url = new URL('https://oauth2.xumm.app/auth')
  oauth2Url.searchParams.append('client_id', clientId)
  oauth2Url.searchParams.append('redirect_uri', redirectUri)
  oauth2Url.searchParams.append('response_type', 'token')
  oauth2Url.searchParams.append('scope', 'openid profile')
  oauth2Url.searchParams.append('state', Math.random().toString(36).substring(7))
  
  console.log('🚀 Redirection vers Xaman OAuth2:', oauth2Url.toString())
  window.location.href = oauth2Url.toString()
}

export function parseOAuth2Hash(hash: string) {
  const params = new URLSearchParams(hash.substring(1))
  return {
    access_token: params.get('access_token'),
    token_type: params.get('token_type'),
    expires_in: params.get('expires_in'),
    scope: params.get('scope'),
    state: params.get('state'),
  }
}

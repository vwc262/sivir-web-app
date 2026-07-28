// Barrel de autenticación. No re-exporta `keycloakClient`: ese módulo construye
// el UserManager al cargarse y solo debe entrar en el bundle en modo keycloak
// (se importa de forma dinámica desde el store y la página de callback).
export { getAccessToken } from './token'
export { mintDevToken, type DevIdentity } from './devToken'

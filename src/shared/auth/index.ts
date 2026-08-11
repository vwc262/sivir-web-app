// Barrel de autenticación. No re-exporta `keycloakClient`: ese módulo construye
// el UserManager al cargarse y se importa de forma dinámica desde el store y
// la página de callback para mantenerlo fuera del chunk inicial.
export { getAccessToken } from './token'

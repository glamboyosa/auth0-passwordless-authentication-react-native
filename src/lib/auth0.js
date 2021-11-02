import Auth0 from 'react-native-auth0'
import { AUTH0_CLIENT_ID as clientId, AUTH0_DOMAIN as domain } from '@env'
const auth0 = new Auth0({
  domain,
  clientId,
})

export { auth0 }

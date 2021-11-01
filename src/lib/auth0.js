import Auth0 from 'react-native-auth0'
import { AUTH0_CLIENT_ID as domain, AUTH0_DOMAIN as clientId } from '@env'
const auth0 = new Auth0({
  domain,
  clientId,
})

export { auth0 }

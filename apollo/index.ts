import {ApolloClient, InMemoryCache, createHttpLink} from '@apollo/client'
import {setContext} from '@apollo/client/link/context'
import {getHost} from '../config/host'
import {CC_ACCESS_TOKEN_KEY} from '../config/key'

const httpLink = createHttpLink({
  // uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
  uri: getHost(),
})

const authLink = setContext((_, {headers}) => {
  const token = localStorage.getItem(CC_ACCESS_TOKEN_KEY)

  return {
    headers: {
      ...headers,
      Authorization: token ? `bearer ${token}` : '',
      'X-API-KEY': process.env.NEXT_PUBLIC_CYBERCONNECT_API_KEY,
    },
  }
})

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
})

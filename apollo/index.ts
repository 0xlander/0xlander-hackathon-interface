import {ApolloClient, InMemoryCache, createHttpLink} from '@apollo/client'
import {setContext} from '@apollo/client/link/context'
import {getHost} from '../config/host'

const httpLink = createHttpLink({
  // uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
  uri: getHost(),
})

const authLink = setContext((_, {headers}) => {
  const token = localStorage.getItem('accessToken')

  return {
    headers: {
      ...headers,
      Authorization: token ? `bearer ${token}` : '',
      // 'X-API-KEY': process.env.NEXT_PUBLIC_CYBERCONNECT_API_KEY,
      'X-API-KEY': 'bdC7j6h8wu22IuisWTIPa0ffW1UMgP81',
    },
  }
})

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
})

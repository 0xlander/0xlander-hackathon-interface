import {useCallback} from 'react'
import {gql, request} from 'graphql-request'
import {getHost} from '../config/host'

export const useLoginGetMessage = (domain: string, address: string | undefined) => {
  const query = gql`
    mutation loginGetMessage($domain: String!, $address: AddressEVM!) {
      loginGetMessage(input: {domain: $domain, address: $address}) {
        message
      }
    }
  `
  return useCallback(() => {
    return request({
      url: getHost(),
      document: query,
      requestHeaders: {
        'X-API-KEY': 'bdC7j6h8wu22IuisWTIPa0ffW1UMgP81',
      },
      variables: {
        address: address,
        domain: domain,
      },
    })
      .then((data) => {
        return data?.loginGetMessage?.message
      })
      .catch((e) => console.error(e))
  }, [domain, address])
}

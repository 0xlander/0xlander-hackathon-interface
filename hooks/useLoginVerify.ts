import {useCallback} from 'react'
import {gql, request} from 'graphql-request'
import {getHost} from '../config/host'

export const useLoginVerify = (domain: string, address: string | undefined) => {
  const query = gql`
    mutation loginVerify($domain: String!, $address: AddressEVM!, $signature: String!) {
      loginVerify(input: {domain: $domain, address: $address, signature: $signature}) {
        accessToken
      }
    }
  `

  return useCallback(
    (signature: string) => {
      return request({
        url: getHost(),
        document: query,
        requestHeaders: {
          'X-API-KEY': 'bdC7j6h8wu22IuisWTIPa0ffW1UMgP81',
        },
        variables: {
          address: address,
          domain: domain,
          signature: signature,
        },
      })
        .then((data) => {
          console.log(data)
          return data?.loginVerify
        })
        .catch((e) => console.error(e))
    },
    [domain, address]
  )
}

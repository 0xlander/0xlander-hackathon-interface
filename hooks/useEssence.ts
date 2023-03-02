import {gql, request} from 'graphql-request'
import {useCallback, useEffect, useState} from 'react'
import {getHost} from '../config/host'
import {useAccount} from 'wagmi'

export const useEssence = () => {
  const {address} = useAccount()

  const query = gql`
    query getCollectedEssencesByAddressEVM($address: AddressEVM!) {
      address(address: $address) {
        wallet {
          collectedEssences(first: 4) {
            edges {
              node {
                tokenID
                wallet {
                  address
                }
                essence {
                  collectMw {
                    contractAddress
                  }
                  symbol
                  id
                  essenceID
                  name
                  tokenURI
                  createdBy {
                    profileID
                    handle
                  }
                }
              }
            }
          }
        }
      }
    }
  `

  const [data, setData] = useState<any>()

  const fn = useCallback(
    (signature: string) => {
      return request({
        url: getHost(),
        document: query,
        requestHeaders: {
          'X-API-KEY': 'bdC7j6h8wu22IuisWTIPa0ffW1UMgP81',
        },
        variables: {
          address: address,
        },
      })
        .then((data) => {
          setData(data)
        })
        .catch((e) => console.error(e))
    },
    [address]
  )

  useEffect(() => {
    if (fn && address) {
      fn(address)
    }
  }, [address])

  return {data}
}

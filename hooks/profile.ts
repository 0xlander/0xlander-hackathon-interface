import {useAccount, useContractRead} from 'wagmi'
import {ProfileNFTABI} from '../config/abis/ProfileNFT'
import {getProfileContractAddress} from '../config/contract'
import {gql, request} from 'graphql-request'
import {useCallback, useEffect, useRef, useState} from 'react'
import {getHost} from '../config/host'

export const usePrimaryProfile = () => {
  const {address} = useAccount()

  return useContractRead({
    address: getProfileContractAddress(),
    abi: ProfileNFTABI,
    functionName: 'getPrimaryProfile',
    args: [address],
    enabled: Boolean(address),
  })
}

export const useHandleByProfileId = (profileId: String | undefined) => {
  return useContractRead({
    address: getProfileContractAddress(),
    abi: ProfileNFTABI,
    functionName: 'getHandleByProfileId',
    args: [profileId],
    enabled: Boolean(profileId),
  })
}

export const useProfile = (handle: string | undefined) => {
  const query = gql`
    query getProfileByHandle($handle: String!) {
      profileByHandle(handle: $handle) {
        metadataInfo {
          avatar
          bio
        }
        owner {
          address
        }
        isPrimary
        followerCount
        followers {
          totalCount
          pageInfo {
            endCursor
          }
          edges {
            node {
              profile {
                handle
                owner {
                  address
                }
              }
              address {
                address
                chainID
                wallet {
                  primaryProfile {
                    handle
                  }
                  address
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
          handle: 'aaronlee',
        },
      })
        .then((data) => {
          setData(data)
        })
        .catch((e) => console.error(e))
    },
    [handle]
  )

  useEffect(() => {
    if (fn && handle) {
      console.log(handle)
      fn(handle)
    }
  }, [handle])

  return {data}
}

export const useInterval = (callback: () => void, delay: number, immediately: boolean) => {
  const savedCallback = useRef<() => void | null>()
  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback
  })
  // Set up the interval.
  useEffect(() => {
    function tick() {
      if (typeof savedCallback?.current !== 'undefined') {
        savedCallback?.current()
      }
    }

    if (delay !== null) {
      if (immediately) {
        tick()
      }
      const id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay, immediately])
}

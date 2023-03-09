import {useAccount, useContractRead} from 'wagmi'
import {ProfileNFTABI} from '../config/abis/ProfileNFT'
import {getProfileContractAddress} from '../config/contract'
import {gql, request} from 'graphql-request'
import {useCallback, useEffect, useRef, useState} from 'react'
import {getHost} from '../config/host'

export const usePrimaryProfile = () => {
  const {address} = useAccount()

  return useContractRead({
    address: getProfileContractAddress() as any,
    abi: ProfileNFTABI,
    functionName: 'getPrimaryProfile',
    args: [address],
    enabled: Boolean(address),
  })
}

export const useHandleByProfileId = (profileId: String | undefined) => {
  return useContractRead({
    address: getProfileContractAddress() as any,
    abi: ProfileNFTABI,
    functionName: 'getHandleByProfileId',
    args: [profileId],
    enabled: Boolean(profileId),
  })
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

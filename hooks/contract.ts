import {useContract, useSigner} from 'wagmi'
import {getTownsContractAddress} from '../config/contract'
import {TownsABI} from '../config/abis/Towns'
import {useEffect, useState} from 'react'

export const useTownsContract = () => {
  const {data: singer} = useSigner()
  return useContract({
    address: getTownsContractAddress(),
    abi: TownsABI,
    signerOrProvider: singer,
  })
}

export default function useIsSSR() {
  const [isSSR, setIsSSR] = useState(true)

  useEffect(() => {
    setIsSSR(false)
  }, [])

  return isSSR
}

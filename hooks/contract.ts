import {useContract, useSigner} from 'wagmi'
import {getTownsContractAddress} from '../config/contract'
import {TownsABI} from '../config/abis/Towns'

export const useTownsContract = () => {
  const {data: singer} = useSigner()
  return useContract({
    address: getTownsContractAddress(),
    abi: TownsABI,
    signerOrProvider: singer,
  })
}

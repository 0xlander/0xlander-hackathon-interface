import {ReactNode, useState} from 'react'
import {useQuery} from '@apollo/client'
import {GET_SUBSCRIBERS} from '../graphql/GetSubscribers'
import {useTownsContract} from '../hooks/contract'
import {toast} from 'react-hot-toast'
import dayjs from 'dayjs'
import BigNumber from 'bignumber.js'
import {exportAesKey, generateAesKey} from '../helpers/crypto'
import {arrayBufferToHex, blobToHex} from '../helpers'
import {nftHolderEncryptWithLit} from '../helpers/lit'
import TIM from 'tim-js-sdk'
import {useAccount} from 'wagmi'
import {useAppStore} from '../store/app'
import {useRouter} from 'next/router'

export const CreateSubscribersGroupWrapper = ({children}: {children: ReactNode}) => {
  const {address} = useAccount()
  const router = useRouter()
  const timClient = useAppStore((state) => state.timClient)
  const litClient = useAppStore((state) => state.litClient)
  const data = useAppStore((state) => state.primaryProfile)
  const primaryProfile: any = data?.address?.wallet?.primaryProfile
  const [doing, setDoing] = useState(false)

  const {data: subscribersRes, loading} = useQuery(GET_SUBSCRIBERS, {
    variables: {
      address: address,
    },
  })

  const sub = subscribersRes?.address?.wallet?.primaryProfile

  const townsContract = useTownsContract()
  const onCreateSubscribeGroup = async () => {
    setDoing(true)
    if (sub?.subscribeCount === 0) {
      toast.success('You have no subscribers')
      return
    }
    const contractAddress = sub?.subscribeNFT
    if (!contractAddress) return
    const tokenId = await townsContract?.holderContractAddress2TokenIds(contractAddress)
    const chatId = dayjs().unix()
    if (new BigNumber(tokenId.toString()).gt(0)) {
      const town = await townsContract?.tokenId2Towns(tokenId.toString())
      const res = await timClient.joinGroup({
        groupID: town.chatId,
      })
      console.log(res)
      if (res?.code === 0) {
        toast.success('Join group successfully')
        router.push(`/group/GROUP${town.chatId}`)
      }
    } else {
      const key = await generateAesKey()
      const rawKey = await exportAesKey(key)

      const rawKeyStr = arrayBufferToHex(rawKey)
      const {encryptedSymmetricKey, encryptedString} = await nftHolderEncryptWithLit(
        litClient,
        contractAddress,
        rawKeyStr
      )

      const encryptedKeyStr = await blobToHex(encryptedString)

      try {
        const name = `${primaryProfile?.handle} fans`
        const description = `${name} group`

        const condition = JSON.stringify({
          encryptedKey: encryptedKeyStr,
          encryptedSymmetricKey: encryptedSymmetricKey,
        })
        const res = await timClient.createGroup({
          name: name,
          type: TIM.TYPES.GRP_MEETING,
          groupID: chatId.toString(),
          memberList: [
            {
              userID: address,
            },
          ],
        })
        console.log(res)
        const tx = await townsContract?.mintHolderTown(
          address,
          contractAddress,
          chatId.toString(),
          name,
          description,
          condition
        )

        toast.success(`Create subscribers group successfully`)
        router.push(`/group/GROUP${chatId}`)
      } catch (e) {
        console.error('create group: ', e)
      }
    }

    setDoing(false)
  }
  return <div onClick={onCreateSubscribeGroup}>{children}</div>
}

import {Nft} from '../types/nft'
import dayjs from 'dayjs'
import BigNumber from 'bignumber.js'
import {toast} from 'react-hot-toast'
import {exportAesKey, generateAesKey} from '../helpers/crypto'
import {arrayBufferToHex, blobToHex} from '../helpers'
import {nftHolderEncryptWithLit} from '../helpers/lit'
import TIM from 'tim-js-sdk'
import {ReactNode, useState} from 'react'
import {useTownsContract} from '../hooks/contract'
import {useAppStore} from '../store/app'
import {useRouter} from 'next/router'
import {useAccount} from 'wagmi'
import {Spinner} from './style'

export const ChatWithNftHolders = ({nft}: {nft: Nft}) => {
  const {address} = useAccount()
  const router = useRouter()
  const townsContract = useTownsContract()
  const timClient = useAppStore((state) => state.timClient)
  const litClient = useAppStore((state) => state.litClient)
  const [doing, setDoing] = useState(false)
  const onChat = async (nft: Nft) => {
    setDoing(true)
    const tokenId = await townsContract?.holderContractAddress2TokenIds(nft.contractAddress)
    const chatId = dayjs().unix()
    if (new BigNumber(tokenId.toString()).gt(0)) {
      const town = await townsContract?.tokenId2Towns(tokenId.toString())
      console.log(town)
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
        nft.contractAddress,
        rawKeyStr
      )

      const encryptedKeyStr = await blobToHex(encryptedString)

      try {
        const name = `${nft.collectionName} Holders`
        const description = `${nft.collectionName} holders group`

        const condition = JSON.stringify({
          encryptedKey: encryptedKeyStr,
          encryptedSymmetricKey: encryptedSymmetricKey,
        })
        const tx = await townsContract?.mintHolderTown(
          address,
          nft.contractAddress,
          chatId.toString(),
          name,
          description,
          condition
        )
        const res = await timClient.createGroup({
          name: `${nft.collectionName} Holders`,
          type: TIM.TYPES.GRP_MEETING,
          groupID: chatId.toString(),
          memberList: [
            {
              userID: address,
            },
          ],
        })
        console.log(res)
      } catch (e) {
        console.error('create group: ', e)
      }
    }
    setDoing(false)
  }

  return (
    <div onClick={() => onChat(nft)}>
      <button className={'text-primary text-sm ml-auto'} disabled={doing}>
        {doing && <Spinner className={'text-rose-500'} />}
        Chat
      </button>
    </div>
  )
}

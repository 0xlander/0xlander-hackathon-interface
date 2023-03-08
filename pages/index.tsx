import {Layout} from '../components/layout'
import {useEssence} from '../hooks/useEssence'
import CyberConnect, {Env} from '@cyberlab/cyberconnect-v2'
import {useAccount, useSigner} from 'wagmi'
import React, {useEffect, useState} from 'react'
import {useSubscribe} from '../hooks/useSubscribe'
import {useAppStore} from '../store/app'
import {encryptWithLit, nftHolderEncryptWithLit} from '../helpers/lit'
import {arrayBufferToHex, blobToHex, pinFileToIPFS} from '../helpers'
import {PlusCircleIcon} from '@heroicons/react/24/outline'
import useListConversations from '../hooks/useListConversations'
import {ChatBox} from '../components/chat-box'
import Moralis from 'moralis'
import {EvmChain} from '@moralisweb3/evm-utils'
import {Nft} from '../types/nft'
import {handleUri} from '../helpers/image'
import TIM from 'tim-js-sdk'
import {useTownsContract} from '../hooks/contract'
import BigNumber from 'bignumber.js'
import {exportAesKey, generateAesKey} from '../helpers/crypto'
import dayjs from 'dayjs'
import {toast} from 'react-hot-toast'
import {useRouter} from 'next/router'

export default function Home() {
  const router = useRouter()
  const {address, connector} = useAccount()
  const timClient = useAppStore((state) => state.timClient)
  const {data: essences} = useEssence()
  const {data: signer} = useSigner()
  const litClient = useAppStore((state) => state.litClient)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const data = useAppStore((state) => state.primaryProfile)
  const primaryProfile: any = data?.address?.wallet?.primaryProfile

  const conversations = useAppStore((state) => state.conversations)

  const onPost = async () => {
    const {encryptedString, encryptedSymmetricKey} = await encryptWithLit(primaryProfile?.profileID, body)
    console.log(encryptedString)
    console.log(encryptedSymmetricKey)
    if (!address) return

    try {
      const cyberConnect = new CyberConnect({
        namespace: '0xLander',
        env: Env.STAGING,
        provider: signer?.provider,
        signingMessageEntity: 'CyberConnect',
      })
      const contentHash = await pinFileToIPFS(encryptedString)
      const res = await cyberConnect.createPost({
        title: title,
        body: JSON.stringify({
          contentHash: contentHash,
          encryptedSymmetricKey: encryptedSymmetricKey,
        }),
        author: data?.address?.wallet?.primaryProfile?.handle,
      })
      console.log(res)
    } catch (e) {
      console.error(e)
    }
  }

  const {posts, profile} = useSubscribe(address)

  const [nfts, setNfts] = useState<Nft[]>()

  const townsContract = useTownsContract()

  const onChat = async (nft: Nft) => {
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
  }

  useEffect(() => {
    const query = async (addr: string) => {
      try {
        const chain = EvmChain.BSC_TESTNET

        const response = await Moralis.EvmApi.nft.getWalletNFTs({
          address: addr,
          chain,
        })

        const filter: Nft[] = response?.result?.map((r) => {
          const metadata: any = r.metadata
          return {
            name: metadata?.name ?? '',
            collectionName: r.name ?? '',
            tokenId: r.tokenId.toString(),
            image: metadata?.image ?? '',
            contractAddress: r.tokenAddress.checksum,
          }
        })
        console.log('fi ', filter)
        setNfts(filter)
      } catch (e) {
        console.error(e)
      }
    }

    if (address) {
      query(address)
    }
  }, [address])

  return (
    <Layout>
      <div className='flex'>
        <ChatBox />
        <div className={'p-8 w-full'}>
          <div className={'flex items-center'}>
            <div className='text-xl'>Subscribe</div>
          </div>
          <div className='form-group'>
            <input type='text' className={'input'} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className='form-group'>
            <textarea className={'input'} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <button className={'btn btn-primary'} onClick={onPost}>
            Post
          </button>

          <div className='text-2xl font-medium my-8'>NFTs</div>
          <div className='grid grid-cols-4 gap-8'>
            {nfts &&
              nfts?.map((nft) => (
                <div
                  key={`${nft.contractAddress}-${nft.tokenId}`}
                  className={'col-span-1 border border-gray-200 rounded-2xl'}
                >
                  <img src={handleUri(nft.image)} alt='nft' className={'aspect-square rounded-xl'} />
                  <div className='div p-6'>
                    <div className='text-xs text-gray-400'>{nft.collectionName}</div>
                    <div className='text-base font-medium truncate'>{nft.name}</div>
                    <div
                      className={'flex mt-6 items-center gap-1 text-sm cursor-pointer text-primary'}
                      onClick={() => onChat(nft)}
                    >
                      <PlusCircleIcon className={'h-5 w-5 ml-auto'} />
                      Chat
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}

import {Layout} from '../components/layout'
import {useEssence} from '../hooks/useEssence'
import {InboxIcon} from '@heroicons/react/24/solid'
import CyberConnect, {Env} from '@cyberlab/cyberconnect-v2'
import {useAccount, useNetwork, useProvider, useSigner} from 'wagmi'
import React, {useEffect, useState} from 'react'
import {useQuery, useSubscription} from '@apollo/client'
import {PRIMARY_PROFILE} from '../graphql'
import {ethers} from 'ethers'
import {PRIMARY_PROFILE_POSTS} from '../graphql/PrimaryProfilePosts'
import {useSubscribe} from '../hooks/useSubscribe'
import {DEFAULT_AVATAR} from '../config/image'
import {useAppStore} from '../store/app'
import {encryptWithLit, nftHolderEncryptWithLit} from '../helpers/lit'
import {blobToHex, pinFileToIPFS, pinJSONToIPFS} from '../helpers'
import {
  BellAlertIcon,
  ChatBubbleBottomCenterIcon,
  PlusCircleIcon,
  PlusIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline'
import {Popover} from '@headlessui/react'
import {NotifiSubscriptionCard} from '@notifi-network/notifi-react-card'
import {inputLabels, inputSeparators} from '../config/notifi'
import {FollowersModal} from '../components/modals/followers'
import useListConversations from '../hooks/useListConversations'
import {ConversationsList} from '../components/conversation-list'
import {ChatBox} from '../components/chat-box'
import Moralis from 'moralis'
import {EvmChain} from '@moralisweb3/evm-utils'
import {Nft} from '../types/nft'
import {handleUri} from '../helpers/image'
import TIM from 'tim-js-sdk'
import {arrayBuffer2Hex} from '@cyberlab/cyberconnect-v2/lib/crypto'
import {ab2str} from '../helpers/convertor'

export default function Home() {
  const {address, connector} = useAccount()
  const timClient = useAppStore((state) => state.timClient)
  const {data: essences} = useEssence()
  const {data: signer} = useSigner()
  const litClient = useAppStore((state) => state.litClient)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const data = useAppStore((state) => state.primaryProfile)
  const primaryProfile: any = data?.address?.wallet?.primaryProfile

  useListConversations()

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

  const onChat = async (nft: Nft) => {
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-CBC',
        length: 128,
      },
      true,
      ['encrypt', 'decrypt'] // key usages
    )
    const raw = await crypto.subtle.exportKey('raw', key)

    const rawStr = ab2str(raw)
    const {encryptedSymmetricKey, encryptedString} = await nftHolderEncryptWithLit(
      litClient,
      nft.contractAddress,
      rawStr
    )
    console.log(rawStr)
    console.log(encryptedString)
    console.log('hello')

    // const encryptedKeyStr = await encryptedString.text()
    const encryptedKeyStr = await blobToHex(encryptedString)
    console.log(encryptedKeyStr)

    const cid = await pinJSONToIPFS({
      encryptedKey: encryptedKeyStr,
      encryptedSymmetricKey: encryptedSymmetricKey,
    })

    const groupId = `nft_${nft.contractAddress}`
    console.log(rawStr)
    console.log(
      JSON.stringify({
        encryptedKey: encryptedKeyStr,
        encryptedSymmetricKey: encryptedSymmetricKey,
      })
    )
    try {
      const res = await timClient.createGroup({
        name: `${nft.collectionName} Holders`,
        type: TIM.TYPES.GRP_MEETING,
        groupID: groupId,
        memberList: [
          {
            userID: address,
          },
        ],
        groupCustomField: [
          {
            key: 'key',
            value: cid,
          },
        ],
        introduction: JSON.stringify({
          key: cid,
        }),
      })
      console.log(res)
    } catch (e: any) {
      console.error(e)
      if (e?.toString().includes('group id has be used')) {
        const res = await timClient.joinGroup({
          groupID: groupId,
        })
        console.log(res)
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
          return {
            name: r.metadata?.name,
            collectionName: r.name,
            tokenId: r.tokenId,
            image: r.metadata?.image,
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

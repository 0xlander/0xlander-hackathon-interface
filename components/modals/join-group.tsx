import {Modal} from '../style'
import {useQuery} from '@apollo/client'
import {GET_SUBSCRIBERS} from '../../graphql/GetSubscribers'
import {DEFAULT_AVATAR} from '../../config/image'
import {ellipseAddress} from '../../helpers/display'
import {Avatar} from '../avatar'
import {ChatBubbleLeftIcon} from '@heroicons/react/24/outline'
import {useRouter} from 'next/router'
import {useEffect, useState} from 'react'
import {Nft} from '../../types/nft'
import {EvmChain} from '@moralisweb3/evm-utils'
import Moralis from 'moralis'
import {SubscriberGroupAvatar} from '../subscriber-group-avatar'
import {CreateSubscribersGroupWrapper} from '../create-subscribers-group'
import {ChatWithNftHolders} from '../chat-with-nft-holders'

export const JoinGroupModal = ({
  open,
  onClose,
  address,
}: {
  open: boolean
  onClose: any
  address: string | undefined
}) => {
  const router = useRouter()
  const {data: subscribersRes, loading} = useQuery(GET_SUBSCRIBERS, {
    variables: {
      address: address,
    },
  })

  const subscribers = subscribersRes?.address?.wallet?.primaryProfile?.subscribers?.edges

  const [nfts, setNfts] = useState<Nft[]>()
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
    <Modal
      open={open}
      onClose={onClose}
      content={
        <>
          <div className='text-2xl mb-8'>Chat with group</div>
          <div className={'mb-4 mt-8'}>Chat with NFT holders</div>
          <div className='flex gap-4'>
            <SubscriberGroupAvatar />
            <div>
              <div className='text-md'>Subscribers</div>
              <div className={'text-sm text-gray-400'}>You have {subscribers?.length} subscribers</div>
            </div>
            <div className={'ml-auto'}>
              <CreateSubscribersGroupWrapper>
                <button className={'text-primary text-sm ml-auto'} disabled={subscribers?.length === 0}>
                  Chat
                </button>
              </CreateSubscribersGroupWrapper>
            </div>
          </div>
          <div className={'mb-4 mt-8'}>Chat with NFT holders</div>
          <div className={'overflow-y-scroll max-h-[400px]'}>
            {nfts &&
              nfts.map((nft) => (
                <div key={`${nft.contractAddress}-${nft.tokenId}`} className={'mb-6'}>
                  <div className='flex gap-4'>
                    <img
                      src={nft.image ? nft.image : DEFAULT_AVATAR}
                      alt='nft'
                      width={66}
                      height={66}
                      className={'rounded-lg'}
                    />
                    <div>
                      <div className='text-lg'>{nft.name ? nft.name : nft.collectionName}</div>
                      <div className={'text-sm text-gray-400'}>{nft.collectionName}</div>
                    </div>
                    <div className={'ml-auto'}>
                      <ChatWithNftHolders nft={nft}>
                        <button className={'text-primary text-sm ml-auto'}>Chat</button>
                      </ChatWithNftHolders>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </>
      }
    />
  )
}

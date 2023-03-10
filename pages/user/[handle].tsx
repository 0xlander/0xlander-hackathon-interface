import {Layout} from '../../components/layout'
import {useSubscribe} from '../../hooks/useSubscribe'
import {useAccount, useSigner} from 'wagmi'
import {DEFAULT_AVATAR} from '../../config/image'
import {useRouter} from 'next/router'
import {useQuery} from '@apollo/client'
import React, {useEffect, useState} from 'react'
import {SubscribesModal} from '../../components/modals/subscribes'
import {useAppStore} from '../../store/app'
import {PlusCircleIcon} from '@heroicons/react/24/outline'
import {GET_PROFILE_BY_ADDRESS} from '../../graphql/GetProfileByAddress'
import {FollowersModal} from '../../components/modals/followers'
import {PRIMARY_PROFILE_ESSENCES} from '../../graphql/PrimaryProfileEssences'
import {handleUri} from '../../helpers/image'
import {Nft} from '../../types/nft'
import {EvmChain} from '@moralisweb3/evm-utils'
import Moralis from 'moralis'
import {ChatWithNftHolders} from '../../components/chat-with-nft-holders'
import {ellipseAddress} from '../../helpers/display'
import {SubscribeBtn} from '../../components/subscribe-btn'
import {Avatar} from '../../components/avatar'

const Subscribe = () => {
  const router = useRouter()
  const {address} = useAccount()
  const id = (router.query as any).handle
  const primaryProfile = useAppStore((state) => state.primaryProfile)
  const {posts, subscriberCount, postCount} = useSubscribe(id)
  const {data: signer} = useSigner()

  const [openSubModal, setOpenSubModal] = useState(false)
  const [openFollowersModal, setOpenFollowersModal] = useState(false)

  const {data: essencesRes, loading} = useQuery(PRIMARY_PROFILE_ESSENCES, {
    variables: {
      address: address,
      me: address,
    },
  })
  const essences = essencesRes?.address?.wallet?.primaryProfile.essences?.edges

  const {data: profile} = useQuery(GET_PROFILE_BY_ADDRESS, {
    variables: {
      address: id,
      me: address,
    },
  })

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
        setNfts(filter)
      } catch (e) {
        console.error(e)
      }
    }

    if (id) {
      query(id)
    }
  }, [id])

  return (
    <Layout>
      <SubscribesModal open={openSubModal} onClose={() => setOpenSubModal(false)} address={id} />
      <FollowersModal
        open={openFollowersModal}
        onClose={() => setOpenFollowersModal(false)}
        handle={profile?.address?.wallet?.primaryProfile?.handle}
      />
      <div className='flex'>
        <div className={'p-16 w-full ml-[88px]'}>
          <div className='w-[1200px] max-w-full mx-auto'>
            <div className='grid grid-cols-3 gap-14'>
              <div className='col-span-1'>
                <div>
                  <Avatar address={id} size={100} />
                  <div>
                    <div className='text-2xl mt-8'>{ellipseAddress(id)}</div>
                    <div className={'text-lg text-primary mb-6'}>
                      {'@' + profile?.address?.wallet?.primaryProfile?.handle}
                    </div>
                    <div className='text-sm text-gray-600'>Connect with your web3 frens better</div>
                  </div>
                  <div className={'flex gap-8 mt-8 grid grid-cols-2'}>
                    <div className='col-span-1'>
                      <div className={'text-xl'}>{profile?.address?.followingCount}</div>
                      <div className={'text-gray-500'}>Following</div>
                    </div>
                    <div className='cursor-pointer col-span-1' onClick={() => setOpenSubModal(true)}>
                      <div className={'text-xl'}>{subscriberCount}</div>
                      <div className={'text-gray-500'}>Subscribers</div>
                    </div>
                  </div>
                  {<SubscribeBtn targetAddress={id} />}
                </div>
              </div>

              <div className='col-span-2'>
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
                          <ChatWithNftHolders nft={nft} />
                        </div>
                      </div>
                    ))}
                </div>
                {/*  <div className={''}>*/}
                {/*    <div>*/}
                {/*      <div className='flex text-2xl font-medium mb-8 items-center'>*/}
                {/*        Essences*/}
                {/*        <PencilSquareIcon className={'h-6 w-6 ml-auto'} />*/}
                {/*      </div>*/}
                {/*    </div>*/}
                {/*    {essences &&*/}
                {/*      essences?.map((post: any) => (*/}
                {/*        <div key={post?.node?.digest} className={'mb-8 border-b border-b-gray-100 pb-8'}>*/}
                {/*          <div className='text-xl mb-2'>{post?.node?.title}</div>*/}
                {/*          /!*<div className='text-sm text-gray-500'>{post?.node?.body}</div>*!/*/}
                {/*          <div className='flex'>*/}
                {/*            <div className='text-sm mt-4 text-gray-300 ml-auto'>*/}
                {/*              {dayjs(post?.node?.createdAt).format('YYYY-MM-DD HH:mm')}*/}
                {/*            </div>*/}
                {/*          </div>*/}
                {/*        </div>*/}
                {/*      ))}*/}
                {/*  </div>*/}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Subscribe

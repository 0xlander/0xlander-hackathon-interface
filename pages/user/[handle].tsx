import {Layout} from '../../components/layout'
import {InboxIcon} from '@heroicons/react/24/solid'
import {useSubscribe} from '../../hooks/useSubscribe'
import {useAccount, useSigner} from 'wagmi'
import {DEFAULT_AVATAR} from '../../config/image'
import dayjs from 'dayjs'
import {useRouter} from 'next/router'
import {useLazyQuery, useMutation, useQuery} from '@apollo/client'
import {CREATE_SUBSCRIBE_TYPED_DATA} from '../../graphql/CreateSubscribeTypedData'
import {RELAY} from '../../graphql/Relay'
import {RELAY_ACTION_STATUS} from '../../graphql/RelayActionStatus'
import React, {useEffect, useState} from 'react'
import {useInterval, useProfile} from '../../hooks/profile'
import {CREATE_SET_SUBSCRIBE_DATA_TYPED_DATA} from '../../graphql/CreateSetSubscribeTypedData'
import {SubscribesModal} from '../../components/modals/subscribes'
import {useAppStore} from '../../store/app'
import {PencilIcon, PencilSquareIcon, PlusCircleIcon} from '@heroicons/react/24/outline'
import {FollowButton} from '@cyberconnect/react-follow-button'
import CyberConnect, {Blockchain, Env} from '@cyberlab/cyberconnect-v2'
import {GET_PROFILE_BY_ADDRESS} from '../../graphql/GetProfileByAddress'
import {FollowersModal} from '../../components/modals/followers'
import {PRIMARY_PROFILE_POSTS} from '../../graphql/PrimaryProfilePosts'
import {PRIMARY_PROFILE_ESSENCES} from '../../graphql/PrimaryProfileEssences'
import {handleUri} from '../../helpers/image'
import {Nft} from '../../types/nft'
import {EvmChain} from '@moralisweb3/evm-utils'
import Moralis from 'moralis'
import BigNumber from 'bignumber.js'
import {toast} from 'react-hot-toast'
import {exportAesKey, generateAesKey} from '../../helpers/crypto'
import {arrayBufferToHex, blobToHex} from '../../helpers'
import {nftHolderEncryptWithLit} from '../../helpers/lit'
import TIM from 'tim-js-sdk'
import {useTownsContract} from '../../hooks/contract'

const Subscribe = () => {
  const router = useRouter()
  const {address} = useAccount()
  const id = (router.query as any).handle
  const primaryProfile = useAppStore((state) => state.primaryProfile)
  console.log(primaryProfile)
  const {posts, subscriberCount, postCount} = useSubscribe(id)
  const {data: signer} = useSigner()
  const [relay] = useMutation(RELAY)
  const [getRelayActionStatus] = useLazyQuery(RELAY_ACTION_STATUS)
  const [createSubscribeTypedData] = useMutation(CREATE_SUBSCRIBE_TYPED_DATA)

  const [relayId, setRelayId] = useState('')

  const [openSubModal, setOpenSubModal] = useState(false)
  const [openFollowersModal, setOpenFollowersModal] = useState(false)

  const {data: essencesRes, loading} = useQuery(PRIMARY_PROFILE_ESSENCES, {
    variables: {
      address: address,
      me: address,
    },
  })
  const essences = essencesRes?.address?.wallet?.primaryProfile.essences?.edges
  console.log(essences)

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
  const onSubscribe = async () => {
    /* Create typed data in a readable format */
    const typedDataResult = await createSubscribeTypedData({
      variables: {
        input: {
          profileIDs: [profile?.profileID],
        },
      },
    })
    console.log(profile?.id)
    const typedData = typedDataResult.data?.createSubscribeTypedData?.typedData
    const message = typedData.data
    const typedDataID = typedData.id

    /* Get the signature for the message signed with the wallet */
    const fromAddress = address
    const params = [fromAddress, message]
    const method = 'eth_signTypedData_v4'
    // @ts-ignore
    const signature = await signer?.provider?.send(method, params)
    console.log(signature)

    /* Call the relay to broadcast the transaction */
    const relayResult = await relay({
      variables: {
        input: {
          typedDataID: typedDataID,
          signature: signature,
        },
      },
    })

    setRelayId(relayResult?.data?.relay?.relayActionId)
  }

  useInterval(
    async () => {
      if (relayId) {
        const res = await getRelayActionStatus({
          variables: {relayActionId: relayId},
          fetchPolicy: 'network-only',
        })

        console.log('res', res)
        console.log('res 3000', res.data.relayActionStatus)
        if (res.data.relayActionStatus.txStatus === 'SUCCESS') {
          return
        }
      }
    },
    2000,
    true
  )

  const [createSetSubscribeDataTypedData] = useMutation(CREATE_SET_SUBSCRIBE_DATA_TYPED_DATA)
  const townsContract = useTownsContract()
  const timClient = useAppStore((state) => state.timClient)
  const litClient = useAppStore((state) => state.litClient)

  const onChat = async (nft: Nft) => {
    console.log(nft.contractAddress)
    const tokenId = await townsContract?.holderContractAddress2TokenIds(nft.contractAddress)
    console.log(tokenId.toString())
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

  const onSet = async () => {
    let middleware = 'free'
    /* Create typed data in a readable format */
    const typedDataResult = await createSetSubscribeDataTypedData({
      variables: {
        input: {
          profileId: profile?.profileID,
          /* URL for the json object containing data about the Subscribe NFT */
          tokenURI: `https://ipfs.cyberconnect.dev/ipfs/bafybeiabs6thetplku4hykmcxbzzmqfbkizbflyvwiawbyubam6czl2h7i`,
          middleware:
            middleware === 'free'
              ? {subscribeFree: true}
              : {
                  subscribePaid: {
                    /* Address that will receive the amount */
                    recipient: address,
                    /* Amount that needs to be paid to subscribe */
                    amount: 1,
                    /* The currency for the  amount. Chainlink token contract on Goerli */
                    currency: '0x326C977E6efc84E512bB9C30f76E30c160eD06FB',
                    /* If it require the subscriber to hold a NFT */
                    nftRequired: false,
                    /* The contract of the NFT that the subscriber needs to hold */
                    nftAddress: '0x0000000000000000000000000000000000000000',
                  },
                },
        },
      },
    })
    const typedData = typedDataResult.data?.createSetSubscribeDataTypedData?.typedData
    const message = typedData.data
    const typedDataID = typedData.id

    /* Get the signature for the message signed with the wallet */
    const fromAddress = await signer?.getAddress()
    const params = [fromAddress, message]
    const method = 'eth_signTypedData_v4'
    // @ts-ignore
    const signature = await signer?.provider?.send(method, params)

    /* Call the relay to broadcast the transaction */
    const relayResult = await relay({
      variables: {
        input: {
          typedDataID: typedDataID,
          signature: signature,
        },
      },
    })
    setRid(relayResult?.data?.relay?.relayActionId)
  }

  const [rid, setRid] = useState('')

  useInterval(
    async () => {
      if (rid) {
        const res = await getRelayActionStatus({
          variables: {relayActionId: rid},
          fetchPolicy: 'network-only',
        })

        console.log('res2', res)
        console.log('res2 3000', res.data.relayActionStatus)
        if (res.data.relayActionStatus.txStatus === 'SUCCESS') {
          return
        }
      }
    },
    2000,
    true
  )

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
                  <img
                    src={profile?.avatar ? profile?.avatar : DEFAULT_AVATAR}
                    alt='avatar'
                    width={108}
                    height={108}
                    className={'rounded-2xl'}
                  />
                  <div>
                    <div className='text-2xl mt-8'>RΞDKΔN</div>
                    <div className={'text-lg text-primary mb-6'}>
                      {'@' + profile?.address?.wallet?.primaryProfile?.handle}
                    </div>
                    <div className='text-sm text-gray-600'>
                      Use a Cloudflare worker to protect any URL with Lit Protocol
                    </div>
                  </div>
                  {/*{id !== address && (*/}
                  {/*  <div className={'ml-auto'}>*/}
                  {/*    <div className='btn-primary' onClick={onSubscribe}>*/}
                  {/*      Subscribe*/}
                  {/*    </div>*/}
                  {/*  </div>*/}
                  {/*)}*/}
                  {/*<div className='btn-primary' onClick={onSet}>*/}
                  {/*  Set*/}
                  {/*</div>*/}
                  <div className={'flex gap-8 mt-8 grid grid-cols-2'}>
                    <div className='col-span-1'>
                      <div className={'text-xl'}>{profile?.address?.followingCount}</div>
                      <div className={'text-gray-500'}>Following</div>
                    </div>
                    <div className='cursor-pointer col-span-1' onClick={() => setOpenFollowersModal(true)}>
                      <div className={'text-xl'}>{profile?.address?.wallet?.primaryProfile?.followerCount}</div>
                      <div className={'text-gray-500'}>Followers</div>
                    </div>
                    <div className='cursor-pointer col-span-1' onClick={() => setOpenSubModal(true)}>
                      <div className={'text-xl'}>{subscriberCount}</div>
                      <div className={'text-gray-500'}>Subscribers</div>
                    </div>
                    {/*<div className=''>*/}
                    {/*  <div className={'text-xl'}>{postCount}</div>*/}
                    {/*  <div className={'text-gray-500'}>Posts</div>*/}
                    {/*</div>*/}

                    {/*<div className='cursor-pointer' onClick={() => setOpenSubModal(true)}>*/}
                    {/*  <div className={'text-xl'}>{subscriberCount}</div>*/}
                    {/*  <div className={'text-gray-500'}>Subscriber</div>*/}
                    {/*</div>*/}
                  </div>
                  {id !== address && (
                    <button
                      className={'btn-primary mt-8'}
                      onClick={() => {
                        const cyberConnect = new CyberConnect({
                          namespace: '0xLander',
                          env: Env.STAGING,
                          provider: signer?.provider,
                          signingMessageEntity: 'CyberConnect',
                        })
                        cyberConnect.follow('gm')
                      }}
                    >
                      Follow
                    </button>
                  )}
                  <div className={'mt-8'}>
                    {address !== id && (
                      <FollowButton
                        provider={signer?.provider}
                        namespace='CyberConnect'
                        toAddr={id}
                        env={Env.STAGING}
                        chain={Blockchain.ETH}
                        onSuccess={(e) => {
                          console.log(e)
                        }}
                        onFailure={(e) => {
                          console.log(e)
                        }}
                      />
                    )}
                  </div>
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
                <div className={''}>
                  <div>
                    <div className='flex text-2xl font-medium mb-8 items-center'>
                      Essences
                      <PencilSquareIcon className={'h-6 w-6 ml-auto'} />
                    </div>
                  </div>
                  {essences &&
                    essences?.map((post: any) => (
                      <div key={post?.node?.digest} className={'mb-8 border-b border-b-gray-100 pb-8'}>
                        <div className='text-xl mb-2'>{post?.node?.title}</div>
                        {/*<div className='text-sm text-gray-500'>{post?.node?.body}</div>*/}
                        <div className='flex'>
                          <div className='text-sm mt-4 text-gray-300 ml-auto'>
                            {dayjs(post?.node?.createdAt).format('YYYY-MM-DD HH:mm')}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Subscribe

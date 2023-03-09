import {Popover} from '@headlessui/react'
import {
  ChatBubbleBottomCenterIcon,
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleLeftIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline'
import {InboxIcon} from '@heroicons/react/24/solid'
import {ConversationsList} from './conversation-list'
import React, {useEffect, useState} from 'react'
import {FollowersModal} from './modals/followers'
import {useAppStore} from '../store/app'
import {CreateGroupModal} from './modals/create-group'
import {ConversationCard} from './chat'
import dayjs from 'dayjs'
import {useRouter} from 'next/router'
import {useQuery} from '@apollo/client'
import {GET_SUBSCRIBERS} from '../graphql/GetSubscribers'
import {useAccount} from 'wagmi'
import BigNumber from 'bignumber.js'
import {toast} from 'react-hot-toast'
import {exportAesKey, generateAesKey} from '../helpers/crypto'
import {arrayBufferToHex, blobToHex} from '../helpers'
import {nftHolderEncryptWithLit} from '../helpers/lit'
import TIM from 'tim-js-sdk'
import {useTownsContract} from '../hooks/contract'
import {Spinner} from './style'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export const ChatBox = () => {
  const {address} = useAccount()
  const router = useRouter()
  const groupId = (router.query as any).id
  const [openFollowers, setOpenFollowers] = useState(false)
  const [openCreateGroup, setOpenCreateGroup] = useState(false)
  const data = useAppStore((state) => state.primaryProfile)
  const primaryProfile: any = data?.address?.wallet?.primaryProfile
  const timConversations = useAppStore((state) => state.timConversations)
  const timClient = useAppStore((state) => state.timClient)
  const litClient = useAppStore((state) => state.litClient)
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

  const [filterConversations, setFilterConversations] = useState<any[]>()

  useEffect(() => {
    const query = async () => {
      if (timConversations) {
        const convos = Array.from(timConversations.values())
        const results: any[] = []
        for (let i = 0; i < convos.length; i++) {
          if (convos[i].groupProfile) {
            const groupID = convos[i].groupProfile.groupID
            const tokenId = await townsContract?.chatId2TokenIds(groupID)
            if (new BigNumber(tokenId.toString()).gt(0)) {
              results.push(convos[i])
            }
          }
        }
        setFilterConversations(results)
      }
    }
    try {
      query()
    } catch (e) {
      console.error(e)
    }
  }, [timConversations])

  return (
    <div className={'w-[340px] min-w-[340px] border-r border-r-gray-200 ml-[88px] h-screen pt-8'}>
      <CreateGroupModal
        open={openCreateGroup}
        onClose={() => setOpenCreateGroup(false)}
        handle={primaryProfile?.handle}
      />
      <FollowersModal open={openFollowers} onClose={() => setOpenFollowers(false)} handle={primaryProfile?.handle} />
      <div className='text-lg font-medium mb-8 flex items-center justify-between px-6'>
        Conversations
        <Popover className={'relative h-6'}>
          <Popover.Button className={'outline-0'}>
            <PlusCircleIcon className={'h-6 w-6 cursor-pointer'} />
          </Popover.Button>
          <Popover.Panel className={'absolute right-0 mb-full origin-center-left'}>
            <div className={'rounded-md shadow shadow-gray-100 w-[242px] border border-gray-200 bg-white py-2'}>
              <div
                onClick={() => setOpenFollowers(true)}
                className={'text-gray-500 text-sm px-6 py-3 flex items-center gap-2 cursor-pointer hover:bg-gray-50'}
              >
                <ChatBubbleBottomCenterIcon className={'w-4 h-4'} />
                Chat with
              </div>
              <div
                onClick={() => setOpenCreateGroup(true)}
                className={'text-gray-500 text-sm px-6 py-3 flex items-center gap-2 cursor-pointer hover:bg-gray-50'}
              >
                <ChatBubbleLeftIcon className={'w-4 h-4 text-primary'} />
                Create Group
              </div>
              <div
                onClick={onCreateSubscribeGroup}
                className={'text-gray-500 text-sm px-6 py-3 flex items-center gap-2 cursor-pointer hover:bg-gray-50'}
              >
                <ChatBubbleBottomCenterTextIcon className={'w-4 h-4 text-rose-500'} />
                Subscribers Group ({sub?.subscriberCount}){doing && <Spinner />}
              </div>
            </div>
          </Popover.Panel>
        </Popover>
      </div>
      {filterConversations &&
        filterConversations.map((convo: any) => {
          if (convo?.conversationID === '@TIM#SYSTEM') {
            return
          }
          return (
            <div key={convo?.conversationID}>
              <ConversationCard
                id={convo.conversationID}
                onClick={() => router.push(`/group/${convo?.conversationID}`)}
                isSelected={groupId === convo.conversationID}
                isLoading={false}
                name={convo?.groupProfile?.name}
                date={dayjs(convo?.groupProfile?.lastTime).toNow()}
                content={convo?.lastMessage?.messageForShow}
              />
            </div>
          )
        })}
      <ConversationsList />
    </div>
  )
}

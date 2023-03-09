import {Popover} from '@headlessui/react'
import {
  ChatBubbleBottomCenterIcon,
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleLeftIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline'
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
import {useTownsContract} from '../hooks/contract'
import {Spinner} from './style'
import relativeTime from 'dayjs/plugin/relativeTime'
import {CreateSubscribersGroupWrapper} from './create-subscribers-group'
import {JoinGroupModal} from './modals/join-group'
import {SubscribesModal} from './modals/subscribes'

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
  const [doing, setDoing] = useState(false)

  const {data: subscribersRes, loading} = useQuery(GET_SUBSCRIBERS, {
    variables: {
      address: address,
    },
  })

  const sub = subscribersRes?.address?.wallet?.primaryProfile

  const townsContract = useTownsContract()

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

  const [openJoin, setOpenJoin] = useState(false)

  return (
    <div className={'w-[340px] min-w-[340px] border-r border-r-gray-200 ml-[88px] h-screen pt-8'}>
      <CreateGroupModal
        open={openCreateGroup}
        onClose={() => setOpenCreateGroup(false)}
        handle={primaryProfile?.handle}
      />
      <JoinGroupModal open={openJoin} onClose={() => setOpenJoin(false)} address={address} />
      <SubscribesModal open={openFollowers} onClose={() => setOpenFollowers(false)} address={address} />
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
                Chat with friends
              </div>
              <div
                onClick={() => setOpenJoin(true)}
                className={'text-gray-500 text-sm px-6 py-3 flex items-center gap-2 cursor-pointer hover:bg-gray-50'}
              >
                <ChatBubbleLeftIcon className={'w-4 h-4 text-primary'} />
                Chat with group
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

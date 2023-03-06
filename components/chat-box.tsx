import {Popover} from '@headlessui/react'
import {ChatBubbleBottomCenterIcon, PlusCircleIcon} from '@heroicons/react/24/outline'
import {InboxIcon} from '@heroicons/react/24/solid'
import {ConversationsList} from './conversation-list'
import React, {useState} from 'react'
import {FollowersModal} from './modals/followers'
import {useAppStore} from '../store/app'
import {CreateGroupModal} from './modals/create-group'
import {Conversation} from '@xmtp/xmtp-js'
import {DEFAULT_AVATAR} from '../config/image'
import {ConversationCard} from './chat'
import dayjs from 'dayjs'
import {useRouter} from 'next/router'

export const ChatBox = () => {
  const router = useRouter()
  const [openFollowers, setOpenFollowers] = useState(false)
  const [openCreateGroup, setOpenCreateGroup] = useState(false)
  const data = useAppStore((state) => state.primaryProfile)
  const primaryProfile: any = data?.address?.wallet?.primaryProfile
  const timConversations = useAppStore((state) => state.timConversations)
  return (
    <div className={'w-[340px] border-r border-r-gray-200 ml-[88px] h-screen pt-8 px-8'}>
      <CreateGroupModal
        open={openCreateGroup}
        onClose={() => setOpenCreateGroup(false)}
        handle={primaryProfile?.handle}
      />
      <FollowersModal open={openFollowers} onClose={() => setOpenFollowers(false)} handle={primaryProfile?.handle} />
      <div className='text-lg font-medium mb-8 flex items-center justify-between'>
        Conversations
        <Popover className={'relative h-6'}>
          <Popover.Button className={'outline-0'}>
            <PlusCircleIcon className={'h-6 w-6 cursor-pointer'} />
          </Popover.Button>
          <Popover.Panel className={'absolute right-0 mb-full origin-center-left'}>
            <div className={'rounded-md shadow shadow-gray-100 w-[160px] border border-gray-200 bg-white py-2'}>
              <div
                onClick={() => setOpenFollowers(true)}
                className={'text-gray-500 text-sm px-6 py-2 flex items-center gap-2 cursor-pointer hover:bg-gray-50'}
              >
                <ChatBubbleBottomCenterIcon className={'w-4 h-4'} />
                Chat with
              </div>
              <div
                onClick={() => setOpenCreateGroup(true)}
                className={'text-gray-500 text-sm px-6 py-2 flex items-center gap-2 cursor-pointer hover:bg-gray-50'}
              >
                <ChatBubbleBottomCenterIcon className={'w-4 h-4'} />
                Create Group
              </div>
            </div>
          </Popover.Panel>
        </Popover>
      </div>
      <div className={'p- flex items-start gap-4 cursor-pointer mb-4'}>
        <div
          className={
            'w-[50px] h-[50px] bg-blue-500 rounded-lg flex items-center justify-center flex-grow flex-shrink-0 basis-[50px]'
          }
        >
          <InboxIcon className={'h-6 w-6 text-white'} />
        </div>
        <div>
          <div className='text-base font-medium'>Subscribes</div>
          <div className={'text-sm text-gray-400 truncate'}>You haven`t created any badges yet.</div>
        </div>
      </div>
      {timConversations &&
        Array.from(timConversations.values())?.map((convo: any) => {
          if (convo?.conversationID === '@TIM#SYSTEM') {
            return
          }
          return (
            <div key={convo?.conversationID}>
              <ConversationCard
                onClick={() => router.push(`/group/${convo?.conversationID}`)}
                isSelected={false}
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

import React, {FC, ReactNode, useCallback, useState} from 'react'
import {useAppStore} from '../store/app'
import useGetMessages from '../hooks/useGetMessages'
import useSendMessage from '../hooks/useSendMessage'
import {getConversationKey} from '../helpers/xmtp'
import {Loader} from './style'
import {useWindowSize} from '../hooks/useWindowSize'
import InfiniteScroll from 'react-infinite-scroll-component'
import {DecodedMessage} from '@xmtp/xmtp-js'
import dayjs from 'dayjs'
import {isOnSameDay} from '../helpers/date'
import {DEFAULT_AVATAR} from '../config/image'
import {ellipseAddress} from '../helpers/display'
import Emoji from 'react-emoji-render'
import {useAccount} from 'wagmi'
import MessageComposer from './message-composer'
import {MessageTile} from './message'
import {Player, useCreateStream, useUpdateStream} from '@livepeer/react'
import {create} from 'zustand'
import {steps} from '@motionone/easing'

type ConversationProps = {
  recipientWalletAddr: string
}

export const Conversation = ({recipientWalletAddr}: ConversationProps): JSX.Element => {
  const conversations = useAppStore((state) => state.conversations)
  const selectedConversation = conversations.get(recipientWalletAddr)
  const conversationKey = getConversationKey(selectedConversation)

  const {sendMessage} = useSendMessage(selectedConversation)

  const [endTime, setEndTime] = useState<Map<string, Date>>(new Map())

  const {convoMessages: messages, hasMore} = useGetMessages(conversationKey, endTime.get(conversationKey))

  const loadingConversations = useAppStore((state) => state.loadingConversations)

  const [streamName, setStreamName] = useState('22222222')

  const {mutateAsync: createStream, data: stream, status} = useCreateStream(streamName ? {name: streamName} : null)
  console.log(stream)

  const {mutate: updateStream, error} = useUpdateStream({
    streamId: stream?.id ?? '',
    record: true,
    playbackPolicy: {
      type: 'public',
    },
  })

  const fetchNextMessages = useCallback(() => {
    if (hasMore && Array.isArray(messages) && messages.length > 0 && conversationKey) {
      const lastMsgDate = messages[messages.length - 1].sent
      const currentEndTime = endTime.get(conversationKey)
      if (!currentEndTime || lastMsgDate <= currentEndTime) {
        endTime.set(conversationKey, lastMsgDate)
        setEndTime(new Map(endTime))
      }
    }
  }, [conversationKey, hasMore, messages, endTime])

  const hasMessages = Number(messages?.length ?? 0) > 0

  const onVideoClick = async () => {
    const stream = await createStream?.()
    console.log(stream)
    sendMessage(
      JSON.stringify({
        type: 'livestream',
        stream: stream,
      })
    )
  }

  if (loadingConversations && !hasMessages) {
    return <Loader headingText='Loading messages...' subHeadingText='Please wait a moment' isLoading />
  }

  return (
    <div className={'w-full h-screen'}>
      <div className='bg-white  w-full'>
        <div className='h-full flex justify-between flex-col'>
          <MessagesList fetchNextMessages={fetchNextMessages} messages={messages ?? []} hasMore={hasMore} />
        </div>
      </div>

      {/*<button*/}
      {/*  onClick={() => {*/}
      {/*    updateStream?.()*/}
      {/*  }}*/}
      {/*>*/}
      {/*  updateStream*/}
      {/*</button>*/}

      {/*<Player title={'22222222'} playbackId={'9f81jnefw5f6gkwk'} autoPlay muted />*/}
      {/*{stream?.playbackId}*/}
      {/*{stream?.playbackId && <Player title={stream?.name} playbackId={stream?.playbackId} autoPlay muted />}*/}
      {/*{stream?.rtmpIngestUrl}*/}

      <MessageComposer onSend={sendMessage} onVideoClick={onVideoClick} />
    </div>
  )
}

export const ConversationBeginningNotice = (): JSX.Element => (
  <div className='flex align-items-center justify-center pb-4 mt-4'>
    <span className='text-gray-300 text-sm font-semibold'>This is the beginning of the conversation</span>
  </div>
)

export type MessageListProps = {
  messages: any[]
  fetchNextMessages: () => void
  hasMore: boolean
}
export const LoadingMore = () => <div className='p-1 mt-6 text-center text-gray-400 text-xs'>Loading Messages...</div>

export const DateDividerBorder: FC<{children?: ReactNode}> = ({children}) => (
  <>
    <div className='grow h-0.5 bg-gray-300/25' />
    {children}
    <div className='grow h-0.5 bg-gray-300/25' />
  </>
)

export const DateDivider = ({date}: {date?: Date}): JSX.Element => (
  <div className='flex align-items-center items-center pb-8 pt-4'>
    <DateDividerBorder>
      <span className='mx-11 flex-none text-gray-300 text-sm font-bold'>{dayjs(date).toNow()}</span>
    </DateDividerBorder>
  </div>
)

export const MessagesList = ({messages, fetchNextMessages, hasMore}: MessageListProps): JSX.Element => {
  let lastMessageDate: Date | undefined
  const {width} = useWindowSize()

  return (
    <InfiniteScroll
      dataLength={messages.length}
      next={fetchNextMessages}
      className='flex flex-col-reverse overflow-y-auto pl-4'
      height={width > 700 ? '87vh' : '83vh'}
      inverse
      endMessage={<ConversationBeginningNotice />}
      hasMore={hasMore}
      loader={<LoadingMore />}
    >
      {messages?.map((msg: DecodedMessage, index: number) => {
        const dateHasChanged = lastMessageDate ? !isOnSameDay(lastMessageDate, msg.sent) : false
        const messageDiv = (
          <div key={`${msg.id}_${index}`}>
            <MessageTile
              message={{
                sender: msg.senderAddress,
                date: dayjs(msg.sent).toNow(),
                content: msg.content,
              }}
            />
            {dateHasChanged ? <DateDivider date={lastMessageDate} /> : null}
          </div>
        )
        lastMessageDate = msg.sent
        return messageDiv
      })}
    </InfiniteScroll>
  )
}

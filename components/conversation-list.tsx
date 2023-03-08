import {useAppStore} from '../store/app'
import {Conversation} from '@xmtp/xmtp-js'
import {getConversationKey} from '../helpers/xmtp'
import {useRouter} from 'next/router'
import {useAccount} from 'wagmi'
import {useEffect, useState} from 'react'
import {classNames} from './style'
import {DEFAULT_AVATAR} from '../config/image'
import {ellipseAddress} from '../helpers/display'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'
dayjs.extend(relativeTime)
dayjs.extend(duration)
import {ConversationCard as ConversationCardV2} from './chat'
import {useQuery} from '@apollo/client'
import {PRIMARY_PROFILE} from '../graphql'
import {last} from 'rxjs'

const ConversationCard = ({conversation}: {conversation: Conversation}): JSX.Element | null => {
  const router = useRouter()
  const {address} = useAccount()
  const previewMessages = useAppStore((state) => state.previewMessages)
  const loadingConversations = useAppStore((state) => state.loadingConversations)
  const [recipientAddress, setRecipientAddress] = useState<string>()

  const {loading, data} = useQuery(PRIMARY_PROFILE, {
    variables: {
      address: conversation?.peerAddress,
    },
    pollInterval: 2000,
  })

  const profile = data?.address?.wallet?.primaryProfile

  useEffect(() => {
    try {
      const routeAddress =
        (Array.isArray(router.query.recipientWalletAddr)
          ? router.query.recipientWalletAddr.join('/')
          : router.query.recipientWalletAddr) ?? ''
      setRecipientAddress(routeAddress)
    } catch (e) {
      console.error(e)
    }
  }, [router.query.recipientWalletAddr])

  useEffect(() => {
    try {
      if (!recipientAddress && window.location.pathname.includes('/dm')) {
        router.push(window.location.pathname)
        setRecipientAddress(window.location.pathname.replace('/dm/', ''))
      }
    } catch (e) {
      console.error(e)
    }
  }, [recipientAddress, window.location.pathname])

  if (!previewMessages.get(getConversationKey(conversation))) {
    return null
  }

  const latestMessage = previewMessages.get(getConversationKey(conversation))

  const conversationDomain = conversation.context?.conversationId.split('/')[0] ?? ''

  const isSelected = recipientAddress === getConversationKey(conversation)

  if (!latestMessage) {
    return null
  }

  const onClick = (path: string) => {
    router.push(path)
  }

  const content = address === latestMessage?.senderAddress ? latestMessage?.content : '' + latestMessage?.content

  return (
    <ConversationCardV2
      onClick={() => onClick(`/dm/${getConversationKey(conversation)}`)}
      isSelected={isSelected}
      isLoading={loadingConversations}
      name={profile?.handle ?? ellipseAddress(conversation.peerAddress)}
      date={dayjs(latestMessage?.sent).toNow()}
      content={content}
      isCyber={!!profile?.handle}
      isDM={true}
    />
  )
}

export const ConversationsList = (): JSX.Element => {
  const conversations = useAppStore((state) => state.conversations)
  const previewMessages = useAppStore((state) => state.previewMessages)
  const orderByLatestMessage = (convoA: Conversation, convoB: Conversation): number => {
    const convoALastMessageDate = previewMessages.get(getConversationKey(convoA))?.sent || new Date()
    const convoBLastMessageDate = previewMessages.get(getConversationKey(convoB))?.sent || new Date()
    return convoALastMessageDate < convoBLastMessageDate ? 1 : -1
  }

  if (!conversations || conversations.size == 0) {
    return <></>
  }

  return (
    <>
      {conversations &&
        conversations.size > 0 &&
        Array.from(conversations.values())
          .sort(orderByLatestMessage)
          .map((convo) => {
            return <ConversationCard key={getConversationKey(convo)} conversation={convo} />
          })}
    </>
  )
}

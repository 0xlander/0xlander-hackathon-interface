import {SortDirection} from '@xmtp/xmtp-js'
import {useEffect, useState} from 'react'
import {useAppStore} from '../store/app'
import {XMTP_MESSAGE_LIMIT} from '../config/xmtp'
import {isInboxMessage} from '../helpers/xmtp'
import {useAccount} from 'wagmi'

const useGetMessages = (conversationKey: string, endTime?: Date) => {
  const {address} = useAccount()
  const convoMessages = useAppStore((state) => state.convoMessages.get(conversationKey))
  const conversation = useAppStore((state) => state.conversations.get(conversationKey))
  const addMessages = useAppStore((state) => state.addMessages)
  const [hasMore, setHasMore] = useState<Map<string, boolean>>(new Map())
  const addInbox = useAppStore((state) => state.addInbox)

  useEffect(() => {
    if (!conversation) {
      return
    }

    const loadMessages = async () => {
      const newMessages = await conversation.messages({
        direction: SortDirection.SORT_DIRECTION_DESCENDING,
        limit: XMTP_MESSAGE_LIMIT,
        endTime: endTime,
      })
      for (let i = 0; i < newMessages.length; i++) {
        if (isInboxMessage(newMessages[i].content) && newMessages[i].senderAddress !== address) {
          addInbox(newMessages[i].id, newMessages[i])
        }
      }
      if (newMessages.length > 0) {
        addMessages(conversationKey, newMessages)
        if (newMessages.length < XMTP_MESSAGE_LIMIT) {
          hasMore.set(conversationKey, false)
          setHasMore(new Map(hasMore))
        } else {
          hasMore.set(conversationKey, true)
          setHasMore(new Map(hasMore))
        }
      } else {
        hasMore.set(conversationKey, false)
        setHasMore(new Map(hasMore))
      }
    }
    loadMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation, conversationKey, endTime])

  return {
    convoMessages,
    hasMore: hasMore.get(conversationKey) ?? false,
  }
}

export default useGetMessages

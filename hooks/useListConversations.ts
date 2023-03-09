import {Conversation, DecodedMessage, SortDirection, Stream} from '@xmtp/xmtp-js'
import {useEffect, useState} from 'react'
import {getConversationKey, isInboxMessage, shortAddress, truncate} from '../helpers/xmtp'
import {useAppStore} from '../store/app'
import {useAccount} from 'wagmi'

let latestMsgId: string

export const useListConversations = () => {
  const {address} = useAccount()
  const convoMessages = useAppStore((state) => state.convoMessages)
  const xmtpClient = useAppStore((state) => state.xmtpClient)
  const conversations = useAppStore((state) => state.conversations)
  const setConversations = useAppStore((state) => state.setConversations)
  const addMessages = useAppStore((state) => state.addMessages)
  const previewMessages = useAppStore((state) => state.previewMessages)
  const setPreviewMessages = useAppStore((state) => state.setPreviewMessages)
  const setPreviewMessage = useAppStore((state) => state.setPreviewMessage)
  const setLoadingConversations = useAppStore((state) => state.setLoadingConversations)
  const [browserVisible, setBrowserVisible] = useState<boolean>(true)
  const addInbox = useAppStore((state) => state.addInbox)
  const setHasNewInboxMessage = useAppStore((state) => state.setHasNewInboxMessage)

  useEffect(() => {
    window.addEventListener('focus', () => setBrowserVisible(true))
    window.addEventListener('blur', () => setBrowserVisible(false))
  }, [])

  const fetchMostRecentMessage = async (convo: Conversation): Promise<{key: string; message?: DecodedMessage}> => {
    const key = getConversationKey(convo)
    const newMessages = await convo.messages({
      limit: 1,
      direction: SortDirection.SORT_DIRECTION_DESCENDING,
    })
    if (newMessages.length <= 0) {
      return {key}
    }
    return {key, message: newMessages[0]}
  }

  useEffect(() => {
    if (!xmtpClient) {
      return
    }

    let messageStream: AsyncGenerator<DecodedMessage>
    let conversationStream: Stream<Conversation>

    const streamAllMessages = async () => {
      messageStream = await xmtpClient.conversations.streamAllMessages()

      for await (const message of messageStream) {
        const key = getConversationKey(message.conversation)
        setPreviewMessage(key, message)

        if (isInboxMessage(message.content) && message.senderAddress !== address) {
          addInbox(message.id, message)
          setHasNewInboxMessage(true)
        }

        const numAdded = addMessages(key, [message])
        if (numAdded > 0) {
          const newMessages = convoMessages.get(key) ?? []
          newMessages.push(message)
          const uniqueMessages = [...Array.from(new Map(newMessages.map((item) => [item['id'], item])).values())]
          convoMessages.set(key, uniqueMessages)
          if (
            latestMsgId !== message.id &&
            Notification.permission === 'granted' &&
            message.senderAddress !== address &&
            !browserVisible
          ) {
            const name = address
            new Notification('XMTP', {
              body: `${name || shortAddress(message.senderAddress ?? '')}\n${truncate(message.content, 75)}`,
            })

            latestMsgId = message.id
          }
        }
      }
    }

    const listConversations = async () => {
      console.log('Listing conversations')
      setLoadingConversations(true)
      const newPreviewMessages = new Map(previewMessages)
      const convos = await xmtpClient.conversations.list()

      const previews = await Promise.all(convos.map(fetchMostRecentMessage))

      for (const preview of previews) {
        if (preview.message) {
          newPreviewMessages.set(preview.key, preview.message)
        }
      }
      setPreviewMessages(newPreviewMessages)

      Promise.all(
        convos.map(async (convo) => {
          if (convo.peerAddress !== address) {
            conversations.set(getConversationKey(convo), convo)
            setConversations(new Map(conversations))
          }
        })
      ).then(() => {
        setLoadingConversations(false)
        if (Notification.permission === 'default') {
          Notification.requestPermission()
        }
      })
    }
    const streamConversations = async () => {
      conversationStream = await xmtpClient.conversations.stream()
      for await (const convo of conversationStream) {
        if (convo.peerAddress !== address) {
          conversations.set(getConversationKey(convo), convo)
          setConversations(new Map(conversations))
          const preview = await fetchMostRecentMessage(convo)
          if (preview.message) {
            setPreviewMessage(preview.key, preview.message)
          }
          closeMessageStream()
          streamAllMessages()
        }
      }
    }

    const closeConversationStream = async () => {
      if (!conversationStream) {
        return
      }
      await conversationStream.return()
    }

    const closeMessageStream = async () => {
      if (messageStream) {
        await messageStream.return(undefined)
      }
    }

    listConversations()
    streamConversations()
    streamAllMessages()

    return () => {
      closeConversationStream()
      closeMessageStream()
    }
  }, [xmtpClient, address])
}

export default useListConversations

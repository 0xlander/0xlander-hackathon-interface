import {Conversation} from '@xmtp/xmtp-js'
import {useCallback} from 'react'
const useSendMessage = (selectedConversation?: Conversation) => {
  const sendMessage = useCallback(
    async (message: string) => {
      const res = await selectedConversation?.send(message)
    },
    [selectedConversation]
  )

  return {
    sendMessage,
  }
}

export default useSendMessage

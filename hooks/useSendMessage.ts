import {Conversation} from '@xmtp/xmtp-js'
import {useCallback} from 'react'
const useSendMessage = (selectedConversation?: Conversation) => {
  const sendMessage = useCallback(
    async (message: string) => {
      console.log(message)
      const res = await selectedConversation?.send(message)
      console.log(res)
      console.log(selectedConversation)
    },
    [selectedConversation]
  )

  return {
    sendMessage,
  }
}

export default useSendMessage

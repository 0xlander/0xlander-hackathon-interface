import {ChatBubbleLeftIcon} from '@heroicons/react/24/outline'
import {useRouter} from 'next/router'
import {useAppStore} from '../store/app'
import {useState} from 'react'
import {Spinner} from './style'

export const ChatWithAddress = ({address, onCallback}: {address: string; onCallback?: any}) => {
  const xmtpClient = useAppStore((state) => state.xmtpClient)
  const conversations = useAppStore((state) => state.conversations)
  const setConversations = useAppStore((state) => state.setConversations)
  const router = useRouter()

  const [doing, setDoing] = useState(false)

  const onChat = async () => {
    setDoing(true)
    const convo = conversations.get(address)
    if (!convo) {
      const newConvo = await xmtpClient?.conversations.newConversation(address)
      if (newConvo) {
        conversations.set(address, newConvo)
        setConversations(new Map(conversations))
      }
    }
    router.push(`/dm/${address}`)
    onCallback?.()
    setDoing(false)
  }

  return (
    <div className={'flex'}>
      {doing && <Spinner className={'text-rose-500'} />}
      <ChatBubbleLeftIcon className={'h-5 w-5 cursor-pointer ml-auto'} onClick={onChat} />
    </div>
  )
}

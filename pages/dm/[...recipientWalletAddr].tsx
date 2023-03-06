import React, {useEffect, useState} from 'react'
import type {NextPage} from 'next'
import {useRouter} from 'next/router'
import {Conversation} from '../../components/conversation'
import {isEns} from '../../helpers/xmtp'
import {Layout} from '../../components/layout'
import {ChatBox} from '../../components/chat-box'

const ConversationPage: NextPage = () => {
  const router = useRouter()
  const [recipientWalletAddr, setRecipientWalletAddr] = useState<string>()

  useEffect(() => {
    const routeAddress =
      (Array.isArray(router.query.recipientWalletAddr)
        ? router.query.recipientWalletAddr.join('/')
        : router.query.recipientWalletAddr) ?? ''
    setRecipientWalletAddr(routeAddress)
  }, [router.query.recipientWalletAddr])

  useEffect(() => {
    if (!recipientWalletAddr && window.location.pathname.includes('/dm')) {
      router.push(window.location.pathname)
      setRecipientWalletAddr(window.location.pathname.replace('/dm/', ''))
    }
    const checkIfEns = async () => {
      if (recipientWalletAddr && isEns(recipientWalletAddr)) {
        const address = recipientWalletAddr
        router.push(`/dm/${address}`)
      }
    }
    checkIfEns()
  }, [recipientWalletAddr])

  return (
    <Layout>
      <div className='flex'>
        <ChatBox />
        <Conversation recipientWalletAddr={recipientWalletAddr ?? ''} />
      </div>
    </Layout>
  )
}

export default React.memo(ConversationPage)

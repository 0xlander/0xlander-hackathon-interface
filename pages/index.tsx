import {Layout} from '../components/layout'
import {useEssence} from '../hooks/useEssence'
import CyberConnect, {Env} from '@cyberlab/cyberconnect-v2'
import {useAccount, useSigner} from 'wagmi'
import React, {useState} from 'react'
import {useSubscribe} from '../hooks/useSubscribe'
import {useAppStore} from '../store/app'
import {encryptWithLit} from '../helpers/lit'
import {pinFileToIPFS} from '../helpers'
import {ChatBox} from '../components/chat-box'
import {useRouter} from 'next/router'
import {createGraphQLClient, createNotifiService, NotifiClient, NotifiEnvironment} from '@notifi-network/notifi-node'
import {UserGroupIcon, UserIcon} from '@heroicons/react/24/outline'
import {SubscribesModal} from '../components/modals/subscribes'
import {JoinGroupModal} from '../components/modals/join-group'
import {SubscriberGroupAvatar} from '../components/subscriber-group-avatar'
import {getImage} from '../helpers/image'

export default function Home() {
  const router = useRouter()
  const {address, connector} = useAccount()
  const {data: essences} = useEssence()
  const {data: signer} = useSigner()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const data = useAppStore((state) => state.primaryProfile)
  const primaryProfile: any = data?.address?.wallet?.primaryProfile

  const conversations = useAppStore((state) => state.conversations)

  const onPost = async () => {
    const {encryptedString, encryptedSymmetricKey} = await encryptWithLit(primaryProfile?.profileID, body)
    console.log(encryptedString)
    console.log(encryptedSymmetricKey)
    if (!address) return

    try {
      const cyberConnect = new CyberConnect({
        namespace: '0xLander',
        env: Env.STAGING,
        provider: signer?.provider,
        signingMessageEntity: 'CyberConnect',
      })
      const contentHash = await pinFileToIPFS(encryptedString)
      const res = await cyberConnect.createPost({
        title: title,
        body: JSON.stringify({
          contentHash: contentHash,
          encryptedSymmetricKey: encryptedSymmetricKey,
        }),
        author: data?.address?.wallet?.primaryProfile?.handle,
      })
      console.log(res)
    } catch (e) {
      console.error(e)
    }
  }

  const {posts, profile} = useSubscribe(address)

  const onSendNotifi = async () => {
    const env: NotifiEnvironment = 'Development' // Or 'Development'
    const gqlClient = createGraphQLClient(env)
    const notifiService = createNotifiService(gqlClient)
    const client = new NotifiClient(notifiService)

    const {token, expiry} = await client.logIn({
      sid: 'JQC8F9SWXHDUXOJZV8K4FMVFSER43K81',
      secret: 'Rsjtsbg7mjPP@2mHld^C<gv3e(ojI&R0Hdv!pYs1(@xWNBQOOA#sT5R3a+VjQmax',
    })

    // Use the token to send a message to anyone subscribed to that wallet
    // const result = await client.sendDirectPush(token, {
    //   key: 'dp', // This should be the same value per unique message
    //   walletBlockchain: 'SOLANA',
    //   walletPublicKey: '0x1df7272534A56fBe1994d982f995D04B9cE3A959',
    // })

    const r = await client.sendBroadcastMessage(token, {
      topicName: 'broadcast-id',
      variables: [
        {
          key: 'message',
          value: 'Hello',
        },
        {
          key: 'subject',
          value: 'SH',
        },
      ],
      targetTemplates: [],
    })
  }

  const [openSub, setOpenSub] = useState(false)
  const [openJoin, setOpenJoin] = useState(false)

  return (
    <Layout>
      <div className='flex'>
        <ChatBox />
        <SubscribesModal open={openSub} onClose={() => setOpenSub(false)} address={address} />
        <JoinGroupModal open={openJoin} onClose={() => setOpenJoin(false)} address={address} />
        <div className={'p-8 w-full flex items-center justify-center'}>
          <div className={'w-[600px]'}>
            <img src={getImage('logo')} alt='logo' width={300} />
            <div className='flex gap-4 cursor-pointer mt-8' onClick={() => setOpenSub(true)}>
              <div className={'w-[48px] h-[48px] rounded-lg bg-blue-500 flex items-center justify-center'}>
                <UserIcon className={'h-6 w-6 text-white'} />
              </div>
              <div>
                <div className='text-base font-medium'>Chat with friends</div>
                <div className='text-sm text-gray-500'>Chat with your follower or subscriber</div>
              </div>
            </div>

            <div className='flex gap-4 mt-8 cursor-pointer' onClick={() => setOpenJoin(true)}>
              <SubscriberGroupAvatar />
              <div>
                <div className='text-base font-medium'>Chat with group</div>
                <div className='text-sm text-gray-500'>Chat with your subscribers and nft holders</div>
              </div>
            </div>
          </div>
        </div>
        {/*<button onClick={onSendNotifi}>Send</button>*/}
      </div>
    </Layout>
  )
}

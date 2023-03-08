import {Layout} from '../../components/layout'
import {ChatBox} from '../../components/chat-box'
import React, {useEffect, useState} from 'react'
import {useAppStore} from '../../store/app'
import {useRouter} from 'next/router'
import MessageComposer from '../../components/message-composer'
import TIM from 'tim-js-sdk'
import InfiniteScroll from 'react-infinite-scroll-component'
import {MessageTile} from '../../components/message'
import dayjs from 'dayjs'
import {ConversationBeginningNotice, LoadingMore} from '../../components/conversation'
import {useWindowSize} from '../../hooks/useWindowSize'
import {ChatBubbleBottomCenterIcon} from '@heroicons/react/24/outline'
import {ellipseAddress} from '../../helpers/display'
import {DEFAULT_AVATAR} from '../../config/image'
import {handleUri} from '../../helpers/image'
import {nftHolderDecryptWithLit} from '../../helpers/lit'
import {arrayBufferToHex, hexToArrayBuffer, hexToBlob} from '../../helpers'
import {useTownsContract} from '../../hooks/contract'
import {aesEncrypt, importAesKey} from '../../helpers/crypto'
import {toast} from 'react-hot-toast'
import {Spinner} from '../../components/style'
import {useQuery} from '@apollo/client'
import {GET_SUBSCRIBERS} from '../../graphql/GetSubscribers'
import {useAccount} from 'wagmi'

const Group = () => {
  const {address} = useAccount()
  const {width} = useWindowSize()
  const router = useRouter()
  const id = (router.query as any).id
  const timConvoMessages = useAppStore((state) => state.timConvoMessages)
  const timIsReady = useAppStore((state) => state.timIsReady)
  const timClient = useAppStore((state) => state.timClient)
  const litClient = useAppStore((state) => state.litClient)
  const addTimMessages = useAppStore((state) => state.addTimMessages)
  const messages = timConvoMessages.get(id)
  const [members, setMembers] = useState([])

  const chatId = id?.replace('GROUP', '')
  const [hasMore, setHasMore] = useState(false)
  const [nextID, setNextID] = useState('')

  const [symKey, setSymKey] = useState<any>()
  const townsContract = useTownsContract()
  const [town, setTown] = useState<any>()

  const [isMember, setIsMember] = useState(false)
  const [canJoin, setCanJoin] = useState(false)
  const [doing, setDoing] = useState(false)
  const [fanGroup, setFanGroup] = useState(false)

  const xmtpClient = useAppStore((state) => state.xmtpClient)

  const {data: subscribersRes, loading} = useQuery(GET_SUBSCRIBERS, {
    variables: {
      address: address,
    },
  })

  const sub = subscribersRes?.address?.wallet?.primaryProfile

  useEffect(() => {
    return
    const handle = async () => {
      setDoing(true)
      const tokenId = await townsContract?.chatId2TokenIds(chatId)
      const town = await townsContract?.tokenId2Towns(tokenId)
      setTown(town)
      if (town.name.includes('fans')) {
        setFanGroup(true)
      }

      const condition = JSON.parse(town?.condition)

      const encryptedKey = condition?.encryptedKey
      const encryptedSymmetricKey = condition?.encryptedSymmetricKey
      const handleEncryptedKey = await hexToBlob(encryptedKey, 'application/octet-stream')
      if (!handleEncryptedKey) return
      const key = await nftHolderDecryptWithLit(
        litClient,
        encryptedSymmetricKey,
        handleEncryptedKey,
        town.contractAddress
      )
      const k = await importAesKey(hexToArrayBuffer(key))
      setSymKey(k)
      setCanJoin(true)
      setDoing(false)
    }
    if (timIsReady && litClient && townsContract) {
      try {
        handle()
      } catch (e) {
        console.error('handle', e)
        setDoing(false)
      }
    }
  }, [timIsReady, litClient, townsContract])

  const onSend = async (msg: string) => {
    const iv = crypto.getRandomValues(new Uint8Array(16))

    // const text = await crypto.subtle.encrypt(
    //   {
    //     name: 'AES-CBC',
    //     iv,
    //     length: 128,
    //   },
    //   symKey,
    //   str2ab(msg)
    // )
    const text = await aesEncrypt(iv, symKey, msg)
    console.log(text)
    if (timIsReady && timClient) {
      let message = timClient?.createTextMessage({
        to: chatId,
        conversationType: TIM.TYPES.CONV_GROUP,
        payload: {
          text: JSON.stringify({
            type: 'encrypt',
            // symmetricKey: encryptedSymmetricKey,
            content: arrayBufferToHex(text),
            iv: arrayBufferToHex(iv),
          }),
        },
        needReadReceipt: true,
      })
      let promise = timClient.sendMessage(message)
      promise
        .then(function (imResponse: any) {
          addTimMessages(id, [message])
        })
        .catch(function (imError: any) {
          console.warn('sendMessage error:', imError)
        })
    }
  }

  const fetchNextMessages = () => {
    timClient
      .getMessageList({
        conversationID: id,
        nextReqMessageID: nextID,
      })
      .then((resp: any) => {
        if (resp) {
          const messageList = resp.data.messageList
          const nextReqMessageID = resp.data.nextReqMessageID
          const isCompleted = resp.data.isCompleted
          setNextID(nextReqMessageID)
          setHasMore(!isCompleted)
          addTimMessages(id, messageList)
        }
      })
      .catch((e: any) => console.error(e))
  }

  useEffect(() => {
    if (!timIsReady) return
    if (chatId) {
      let promise = timClient.getGroupMemberList({groupID: chatId, count: 100, offset: 0})
      promise
        .then(function (resp: any) {
          setMembers(resp.data.memberList)
          // addMembers(id, resp.data.memberList)
        })
        .catch(function (e: Error) {
          console.warn('getGroupMemberList error:', e)
        })
      timClient
        ?.getMessageList({
          conversationID: id,
          nextReqMessageID: nextID,
        })
        .then((resp: any) => {
          setIsMember(true)
          if (resp) {
            const messageList = resp.data.messageList
            const nextReqMessageID = resp.data.nextReqMessageID
            const isCompleted = resp.data.isCompleted
            setNextID(nextReqMessageID)
            setHasMore(!isCompleted)
            addTimMessages(id, messageList)
          }
        })
        .catch((e: any) => {
          if (e.toString().includes('only group')) {
            setIsMember(false)
          }
          console.error(e)
        })
    }
  }, [chatId, timIsReady, isMember])

  const [joinDoing, setJoinDoing] = useState(false)
  const onJoin = async () => {
    setJoinDoing(true)
    const res = await timClient.joinGroup({
      groupID: town.chatId,
    })
    console.log(res)
    if (res?.code === 0) {
      setIsMember(true)
      toast.success('Join group successfully')
      router.push(`/group/GROUP${town.chatId}`)
    }
    setJoinDoing(false)
  }

  const onInvite = async () => {
    console.log(sub)
    const addresses = sub?.subscribers.edges.map((s: any) => s.node.wallet.address)
    for (let i = 0; i < addresses.length; i++) {
      const ok = await xmtpClient?.canMessage(addresses[i])
      const convo = await xmtpClient?.conversations.newConversation(addresses[i])
      convo?.send(
        JSON.stringify({
          type: 'invitation',
          chatId: chatId,
          groupName: town.name,
          groupDescription: town.description,
        })
      )
    }
  }

  return (
    <Layout>
      <div className='flex'>
        <ChatBox />
        <div className={'w-full pt-12 relative'}>
          <div className='absolute w-full h-[60px] bg-white border-b border-b-gray-200 px-8 flex items-center top-0'>
            {town?.name}
          </div>
          <InfiniteScroll
            dataLength={messages?.length ?? 0}
            next={fetchNextMessages}
            className='flex flex-col-reverse overflow-y-auto px-6'
            height={width > 700 ? '80vh' : '83vh'}
            inverse
            endMessage={<ConversationBeginningNotice />}
            hasMore={hasMore}
            loader={<LoadingMore />}
          >
            {!isMember && canJoin && !doing && (
              <div className={'fixed top-1/2 left-1/2 w-[200px] flex flex-col items-center'}>
                <button className={'btn-primary'} onClick={onJoin} disabled={joinDoing}>
                  {joinDoing && <Spinner />}
                  Join
                </button>
                <div className={'mt-2 text-xs text-gray-400'}>You can join {town?.name} group</div>
              </div>
            )}
            {doing && (
              <div className={'fixed top-1/2 left-1/2 w-[100px] text-center'}>
                <div className={'text-center flex justify-center'}>
                  <Spinner className={'text-primary mx-auto'} />
                </div>
                <div className={'mt-2 text-xs text-gray-400'}>Loading key...</div>
              </div>
            )}
            {symKey &&
              messages &&
              messages?.map((message) => {
                if (!message?.payload?.text) return
                return (
                  <div key={message?.ID}>
                    <MessageTile
                      message={{
                        key: symKey,
                        sender: message.from,
                        content: message.payload.text,
                        // content: !!message?.payload?.text ? message?.payload?.text : '',
                        date: dayjs(message.time * 1000).toNow(),
                      }}
                    />
                  </div>
                )
              })}
          </InfiniteScroll>
          <MessageComposer onSend={onSend} />
        </div>

        <div className={'w-[480px] hidden md:block p-6 bg-white border-l border-l-gray-200'}>
          <div className='text-lg mb-4'>Members</div>
          <div className='flex flex-col gap-4'>
            {members?.map((member: any) => {
              return (
                <div key={member?.userID} className={'flex items-center gap-3'}>
                  <img
                    src={member?.avatar ? handleUri(member?.avatar) : DEFAULT_AVATAR}
                    alt='avatar'
                    width={32}
                    height={32}
                    className={'rounded-lg'}
                  />
                  <div className={'text-sm'}>
                    {member?.nick ? member?.nick : ellipseAddress(member.userID)}
                    {member?.role === 'Owner' && <div className={'text-primary text-[11px]'}>Owner</div>}
                  </div>
                  <ChatBubbleBottomCenterIcon
                    className={'h-4 w-4 ml-auto cursor-pointer'}
                    onClick={() => router.push(`/dm/${member.userID}`)}
                  />
                </div>
              )
            })}
          </div>
          {fanGroup && (
            <button className={'btn-primary w-full mt-10'} onClick={onInvite}>
              Invite all fans
            </button>
          )}
        </div>
      </div>
    </Layout>
  )
}
export default Group

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
import {handleCors, handleUri} from '../../helpers/image'
import {getNftHolderDecryptKey, nftHolderDecryptWithLit, nftHolderEncryptWithLit} from '../../helpers/lit'
import en from '@walletconnect/qrcode-modal/dist/cjs/browser/languages/en'
import {hexToBlob} from '../../helpers'

const Group = () => {
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

  const groupId = id?.replace('GROUP', '')
  const [hasMore, setHasMore] = useState(false)
  const [nextID, setNextID] = useState('')
  const contractAddress = id?.replace('GROUPnft_', '')

  const [symKey, setSymKey] = useState<any>()

  useEffect(() => {
    if (timIsReady && litClient) {
      timClient.getConversationProfile(id).then((res: any) => {
        console.log(res.data)
        const cid = res.data.conversation.groupProfile.groupCustomField[0].value
        console.log(cid)
        fetch(handleCors(handleUri(`ipfs://${cid}`) ?? ''))
          .then((res) => res.json())
          .then(async (res: any) => {
            const encryptedKey = res?.encryptedKey
            const encryptedSymmetricKey = res?.encryptedSymmetricKey
            const handleEncryptedKey = await hexToBlob(encryptedKey, 'application/octet-stream')
            console.log(handleEncryptedKey)
            //application/octet-stream
            if (!handleEncryptedKey) return
            // new Blob([encryptedKey], {type: 'application/octet-stream'}),
            nftHolderDecryptWithLit(litClient, encryptedSymmetricKey, handleEncryptedKey, contractAddress)
              .then((r) => {
                console.log('sym', r)
                setSymKey(r)
              })
              .catch((e) => {
                console.error('decrypt', e)
              })
            // getNftHolderDecryptKey(litClient, encryptedSymmetricKey, contractAddress)
            //   .then((r) => {
            //     console.log('fuck', r)
            //     setSymKey(r)
            //   })
            //   .catch((e) => {
            //     console.error(e)
            //   })
          })
          .catch((e) => console.error(e))
      })
    }
  }, [timIsReady, litClient])

  const onSend = async (msg: string) => {
    const {encryptedString, encryptedSymmetricKey} = await nftHolderEncryptWithLit(contractAddress, msg)
    const text = await encryptedString.text()
    console.log(text)
    if (timIsReady && timClient) {
      let message = timClient?.createTextMessage({
        to: groupId,
        conversationType: TIM.TYPES.CONV_GROUP,
        payload: {
          text: JSON.stringify({
            type: 'encrypt',
            symmetricKey: encryptedSymmetricKey,
            content: text,
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
  }

  useEffect(() => {
    const get = async () => {
      // await getNftHolderDecryptKey()
    }
    if (id && id?.includes('nft')) {
    }
  }, [id])

  useEffect(() => {
    if (!timIsReady) return
    if (groupId) {
      let promise = timClient.getGroupMemberList({groupID: groupId, count: 100, offset: 0})
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
          if (resp) {
            const messageList = resp.data.messageList
            const nextReqMessageID = resp.data.nextReqMessageID
            const isCompleted = resp.data.isCompleted
            setNextID(nextReqMessageID)
            setHasMore(!isCompleted)
            addTimMessages(id, messageList)
          }
        })
    }
  }, [groupId, timIsReady])

  return (
    <Layout>
      <div className='flex'>
        <ChatBox />
        <div className={'w-full'}>
          <InfiniteScroll
            dataLength={messages?.length ?? 0}
            next={fetchNextMessages}
            className='flex flex-col-reverse overflow-y-auto px-6'
            height={width > 700 ? '87vh' : '83vh'}
            inverse
            endMessage={<ConversationBeginningNotice />}
            hasMore={hasMore}
            loader={<LoadingMore />}
          >
            {messages &&
              messages?.map((message) => {
                if (!message?.payload?.text) return
                return (
                  <div key={message?.ID}>
                    <MessageTile
                      message={{
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
        </div>
      </div>
    </Layout>
  )
}
export default Group

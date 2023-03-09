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
import {ChatBubbleBottomCenterIcon, HeartIcon, UserPlusIcon} from '@heroicons/react/24/outline'
import {HeartIcon as ActiveHeartIcon} from '@heroicons/react/24/solid'
import {ellipseAddress} from '../../helpers/display'
import {nftHolderDecryptWithLit} from '../../helpers/lit'
import {arrayBufferToHex, hexToArrayBuffer, hexToBlob, isJsonString} from '../../helpers'
import {useTownsContract} from '../../hooks/contract'
import {aesEncrypt, importAesKey} from '../../helpers/crypto'
import {toast} from 'react-hot-toast'
import {Spinner} from '../../components/style'
import {useQuery} from '@apollo/client'
import {GET_SUBSCRIBERS} from '../../graphql/GetSubscribers'
import {useAccount, useSigner} from 'wagmi'
import {useInterval} from '../../hooks/profile'
import {Avatar} from '../../components/avatar'
import CyberConnect, {Env} from '@cyberlab/cyberconnect-v2'
import {usePosts} from '../../hooks/useSubscribe'
import {GET_POST_META} from '../../graphql/GetPostMeta'
import {Switch} from '@headlessui/react'
import {ChatWithAddress} from '../../components/chat-with-address'

const Post = ({post}: {post: any}) => {
  const {data: signer} = useSigner()
  const {address} = useAccount()
  const profile = useAppStore((state) => state.primaryProfile)
  const {data, startPolling, stopPolling} = useQuery(GET_POST_META, {
    variables: {
      id: post?.node?.contentID,
      me: address,
    },
    pollInterval: 100,
    fetchPolicy: 'no-cache',
    notifyOnNetworkStatusChange: true,
    onCompleted: () => console.log('If this worked no useEffect needed. 😕'),
  })

  useEffect(() => {
    startPolling(5000)
    return () => stopPolling()
  }, [])

  const body = post?.node?.body
  const bodyJ = JSON.parse(body)

  const [doing, setDoing] = useState(false)
  const onLike = async () => {
    setDoing(true)
    const cyberConnect = new CyberConnect({
      namespace: '0xLander',
      env: Env.STAGING,
      provider: signer?.provider,
      signingMessageEntity: 'CyberConnect',
    })
    const res = await cyberConnect.like(post?.node?.contentID)
    console.log(res)
    setDoing(false)
  }

  const onUnlike = async () => {
    setDoing(true)
    const cyberConnect = new CyberConnect({
      namespace: '0xLander',
      env: Env.STAGING,
      provider: signer?.provider,
      signingMessageEntity: 'CyberConnect',
    })
    const res = await cyberConnect.dislike(post?.node?.contentID)
    console.log(res)
    setDoing(false)
  }

  const [comment, setComment] = useState('')

  const [commentDoing, setCommentDoing] = useState(false)
  const onComment = async () => {
    setCommentDoing(true)
    const cyberConnect = new CyberConnect({
      namespace: '0xLander',
      env: Env.STAGING,
      provider: signer?.provider,
      signingMessageEntity: 'CyberConnect',
    })
    try {
      const res = await cyberConnect.createComment(post?.node?.contentID, {
        title: 'Comment',
        body: comment,
        author: profile?.address?.wallet?.primaryProfile.handle,
      })
      console.log(res)
    } catch (e) {
      console.error(e)
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setCommentDoing(false)
    setComment('')
  }

  return (
    <div>
      <div className={'text-2xl mb-2'}>{post?.node?.title}</div>
      <div className={'text-gray-400 text-xs mb-4'}>{post?.node?.createdAt}</div>
      <div className={'text-sm text-gray-600 mb-2'}>{bodyJ.content}</div>
      <div className={'flex gap-2 mb-8 cursor-pointer justify-between'}>
        {data?.content.likedStatus.liked ? (
          <div onClick={onUnlike} className={'inline-flex ml-auto items-center gap-2'}>
            <ActiveHeartIcon className={'h-6 w-6 ml-auto text-red-500'} /> {data?.content.likeCount}
            {doing && <Spinner className={'text-rose-500'} />}
          </div>
        ) : (
          <div onClick={onLike} className={'inline-flex ml-auto items-center gap-2'}>
            <HeartIcon className={'h-6 w-6 ml-auto'} /> {data?.content.likeCount}
            {doing && <Spinner className={'text-rose-500'} />}
          </div>
        )}
      </div>
      <div className='text-lg mb-6'>Comments({data?.content?.commentCount ?? 0})</div>
      <div>
        {data?.content?.comments?.edges.map((comment: any) => (
          <div key={comment?.digest}>
            <div className='flex gap-4 mb-4'>
              <Avatar address={comment?.node?.authorAddress} size={30} />
              <div className={'w-full'}>
                <div className='text-sm font-medium flex items-center w-full flex-1'>
                  {ellipseAddress(comment?.node?.authorAddress)}
                  <div className={'text-gray-400 ml-auto text-xs'}>{comment?.node?.createdAt}</div>
                </div>
                <div className='text-sm text-gray-400'>{comment?.node.body}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className={'flex gap-4 items-center'}>
        <div className='form-group'>
          <input className={'input'} value={comment} onChange={(e) => setComment(e.target.value)} type='text' />
        </div>
        <button onClick={onComment} className={'btn-primary py-2'} disabled={commentDoing}>
          {commentDoing && <Spinner />}
          Comment
        </button>
      </div>
    </div>
  )
}

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

  const data = useAppStore((state) => state.primaryProfile)

  const xmtpClient = useAppStore((state) => state.xmtpClient)

  const {data: signer} = useSigner()

  const {data: subscribersRes, loading} = useQuery(GET_SUBSCRIBERS, {
    variables: {
      address: address,
    },
  })

  const sub = subscribersRes?.address?.wallet?.primaryProfile
  const [owner, setOwner] = useState('')
  const [isDecrypted, setIsDecrypted] = useState(true)

  useEffect(() => {
    const handle = async () => {
      setDoing(true)
      const tokenId = await townsContract?.chatId2TokenIds(chatId)
      const town = await townsContract?.tokenId2Towns(tokenId)
      const or = await townsContract?.ownerOf(tokenId)
      setOwner(or)
      setTown(town)
      if (town.name.includes('fans')) {
        setFanGroup(true)
      }

      const condition = JSON.parse(town?.condition)

      const encryptedKey = condition?.encryptedKey
      const encryptedSymmetricKey = condition?.encryptedSymmetricKey
      const handleEncryptedKey = await hexToBlob(encryptedKey, 'application/octet-stream')
      if (!handleEncryptedKey) return
      if (!!localStorage.getItem(chatId)) {
        const k = await importAesKey(hexToArrayBuffer(localStorage.getItem(chatId) ?? ''))
        setSymKey(k)
      } else {
        try {
          const key = await nftHolderDecryptWithLit(
            litClient,
            encryptedSymmetricKey,
            handleEncryptedKey,
            town.contractAddress
          )
          localStorage.setItem(chatId, key)
          const k = await importAesKey(hexToArrayBuffer(key))
          setSymKey(k)
        } catch (e) {
          console.error(e)
        }
      }
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
  }, [timIsReady, litClient, townsContract, chatId])

  const onSend = async (msg: string) => {
    const iv = crypto.getRandomValues(new Uint8Array(16))

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

  useInterval(
    () => {
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
    },
    3000,
    true
  )

  const [joinDoing, setJoinDoing] = useState(false)
  const onJoin = async () => {
    setJoinDoing(true)
    const res = await timClient.joinGroup({
      groupID: town.chatId,
    })
    if (res?.code === 0) {
      setIsMember(true)
      toast.success('Join group successfully')
      router.push(`/group/GROUP${town.chatId}`)
    }
    setJoinDoing(false)
  }

  const [inviteDoing, setInviteDoing] = useState(false)
  const onInvite = async () => {
    setInviteDoing(true)
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
    setInviteDoing(false)
  }

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const [postDoing, setPostDoing] = useState(false)
  const onPost = async () => {
    if (!address) return
    setPostDoing(true)

    try {
      const cyberConnect = new CyberConnect({
        namespace: '0xLander',
        env: Env.STAGING,
        provider: signer?.provider,
        signingMessageEntity: 'CyberConnect',
      })
      const res = await cyberConnect.createPost({
        title: title,
        body: JSON.stringify({
          type: 'encrypt',
          content: body,
          groupId: chatId,
        }),
        author: data?.address?.wallet?.primaryProfile?.handle,
      })
      console.log(res)
    } catch (e) {
      console.error(e)
    }
    await new Promise((resolve) => setTimeout(resolve, 3000))

    setPostDoing(false)
  }

  const {posts, postCount} = usePosts(owner)

  const filterPosts =
    posts &&
    posts?.filter((post: any) => {
      const body = post?.node?.body
      if (isJsonString(body)) {
        const j = JSON.parse(body)
        if (j?.groupId) {
          return true
        }
      }

      return false
    })

  const [type, setType] = useState(0)

  return (
    <Layout>
      <div className='flex'>
        <ChatBox />
        <div className={'w-full pt-12 relative'}>
          <div className='absolute w-full h-[60px] bg-white border-b border-b-gray-200 px-8 flex items-center top-0'>
            {town?.name}
            <div className={'ml-auto flex items-center gap-2 text-sm'}>
              <Switch
                checked={isDecrypted}
                onChange={() => setIsDecrypted(!isDecrypted)}
                className={`${
                  isDecrypted ? 'bg-blue-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full`}
              >
                <span className='sr-only'>Enable notifications</span>
                <span
                  className={`${
                    isDecrypted ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                />
              </Switch>
              Decrypt
            </div>
            {fanGroup && owner === address && (
              <button
                className={'text-primary ml-auto flex items-center gap-2'}
                onClick={onInvite}
                disabled={inviteDoing}
              >
                <UserPlusIcon className={'h-5 w-5'} />
                Invite all fans
                {inviteDoing && <Spinner className={'text-rose-500'} />}
              </button>
            )}
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
                      isDecrypted={isDecrypted}
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

        <div className={'w-[400px] min-w-[400px] hidden md:block p-6 bg-white border-l border-l-gray-200'}>
          <div className='flex text-gray-400 gap-4 mb-8 cursor-pointer'>
            <div onClick={() => setType(0)} className={`${type === 0 ? 'text-gray-800' : ''}`}>
              Overview
            </div>
            <div onClick={() => setType(1)} className={`${type === 1 ? 'text-gray-800' : ''}`}>
              Posts
            </div>
          </div>
          {type === 1 && (
            <div style={{height: 'calc(100vh-100px)'}} className={'overflow-y-scroll h-[calc(100vh-100px)]'}>
              {owner === address && (
                <div>
                  <div className='form-group mb-6'>
                    <input
                      type='text'
                      className={'input'}
                      placeholder={'Type your title'}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className='form-group mb-6'>
                    <textarea
                      className={'input'}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder={'Type your content'}
                    />
                  </div>
                  <div className='flex'>
                    <button className={'ml-auto btn btn-primary mb-12'} onClick={onPost} disabled={postDoing}>
                      {postDoing && <Spinner />}
                      Post
                    </button>
                  </div>
                </div>
              )}
              <div className='flex flex-col gap-28'>
                {filterPosts &&
                  filterPosts?.map((post: any) => {
                    return <Post post={post} key={post?.node?.id} />
                  })}
              </div>
            </div>
          )}
          {type === 0 && (
            <>
              <div className='text-lg mb-4 flex justify-between items-center'>Members</div>
              <div className='flex flex-col gap-4'>
                {members?.map((member: any) => {
                  return (
                    <div key={member?.userID} className={'flex items-center gap-3'}>
                      <div onClick={() => router.push(`/user/${member.userID}`)} className={'cursor-pointer'}>
                        <Avatar address={member.userID} size={40} />
                      </div>
                      <div className={'text-sm'}>
                        {ellipseAddress(member.userID)}
                        {member?.role === 'Owner' && <div className={'text-primary text-[11px]'}>Owner</div>}
                      </div>
                      <div className={'ml-auto'}>
                        <ChatWithAddress address={member.userID} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
export default Group

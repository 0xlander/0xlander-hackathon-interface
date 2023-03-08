import {DecodedMessage} from '@xmtp/xmtp-js'
import {useAccount} from 'wagmi'
import {DEFAULT_AVATAR} from '../config/image'
import {ellipseAddress} from '../helpers/display'
import dayjs from 'dayjs'
import Emoji from 'react-emoji-render'
import React, {useEffect, useState} from 'react'
import {MessageInterface} from '../types/message'
import {arrayBufferToHex, hexToArrayBuffer, isJsonString} from '../helpers'
import {ab2str} from '../helpers/convertor'
import Blockies from 'react-blockies'
import {Avatar} from './avatar'
import {toast} from 'react-hot-toast'
import {useAppStore} from '../store/app'
import {useRouter} from 'next/router'
import {Spinner} from './style'

type MessageTileProps = {
  message: MessageInterface
}

export const MessageTile = ({message}: MessageTileProps): JSX.Element => {
  const router = useRouter()
  const {address} = useAccount()
  const [content, setContent] = useState<any>()
  const timClient = useAppStore((state) => state.timClient)

  const [isInvitation, setIsInvitation] = useState(false)
  useEffect(() => {
    if (!isJsonString(message?.content)) {
      setContent(message.content)
      return
    }

    const j = JSON.parse(message.content)
    console.log(j)
    if (j.type === 'invitation') {
      setContent(j)
      setIsInvitation(true)
      return
    }
    if (!j.hasOwnProperty('iv')) {
      setContent(message.content)
      return
    }
    const handle = async () => {
      if (j.iv) {
        const c = await crypto.subtle.decrypt(
          {name: 'AES-CBC', iv: hexToArrayBuffer(j?.iv)},
          message.key,
          hexToArrayBuffer(j.content)
        )
        setContent(ab2str(c))
      } else {
        if (Object.keys(j.content).length > 0) {
          setContent(j.content)
        } else {
          setContent('')
        }
      }
    }
    handle()
  }, [message])
  const isSelf = address === message.sender

  const [doing, setDoing] = useState(false)

  const onJoin = async () => {
    setDoing(true)
    const res = await timClient.joinGroup({
      groupID: content?.chatId,
    })
    console.log(res)
    if (res?.code === 0) {
      toast.success('Join group successfully')
      router.push(`/group/GROUP${content.chatId}`)
    }
    setDoing(false)
  }

  return (
    <div className={`flex items-start mx-auto gap-2 mb-4 ${isSelf ? 'flex-row-reverse pr-4' : 'pl-2'}`}>
      <Avatar address={message?.sender} size={8} />
      <div className='ml-2 max-w-[260px]'>
        <div className={`flex items-center gap-2 ${isSelf ? 'flex-row-reverse' : ''}`}>
          <div className={'text-sm'}>{ellipseAddress(message.sender)}</div>
          <span className='text-xs text-gray-400'>{message.date}</span>
        </div>
        <div className={`${isSelf ? 'text-right' : ''}`}>
          <div
            className={`inline-block text-sm py-3 px-4 mt-2 text-black font-normal break-words ${
              isSelf ? 'bg-blue-100' : 'bg-gray-100'
            } rounded-lg`}
          >
            {/*<Emoji text={content ?? ''} />*/}
            {!isInvitation && content}
            {isInvitation && (
              <div>
                <div>{content?.groupName}</div>
                <div>{content?.groupDescription}</div>
                <button className={'btn-primary'} onClick={onJoin} disabled={doing}>
                  {doing && <Spinner />}
                  Join
                </button>
              </div>
            )}
          </div>
        </div>
        {/*<div className={'w-[200px] text-xs text-gray-600 break-all'}>{message.content}</div>*/}
      </div>
    </div>
  )
}

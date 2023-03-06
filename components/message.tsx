import {DecodedMessage} from '@xmtp/xmtp-js'
import {useAccount} from 'wagmi'
import {DEFAULT_AVATAR} from '../config/image'
import {ellipseAddress} from '../helpers/display'
import dayjs from 'dayjs'
import Emoji from 'react-emoji-render'
import React, {useEffect, useState} from 'react'
import {MessageInterface} from '../types/message'
import {arrayBufferToHex, hexToArrayBuffer} from '../helpers'
import {ab2str} from '../helpers/convertor'

type MessageTileProps = {
  message: MessageInterface
}

export const MessageTile = ({message}: MessageTileProps): JSX.Element => {
  const {address} = useAccount()
  const [content, setContent] = useState('')
  useEffect(() => {
    console.log('key', message.key)
    const j = JSON.parse(message.content)
    const handle = async () => {
      if (j.iv) {
        const c = await crypto.subtle.decrypt(
          {name: 'AES-CBC', iv: hexToArrayBuffer(j?.iv)},
          message.key,
          hexToArrayBuffer(j.content)
        )
        setContent(ab2str(c))
        console.log(ab2str(c))
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
  console.log(content)
  return (
    <div className={`flex items-start mx-auto mb-4 ${address === message.sender ? 'flex-row-reverse pr-12' : 'pl-4'}`}>
      <img src={DEFAULT_AVATAR} width={42} height={42} className={'rounded-full'} alt='' />
      <div className='ml-2 max-w-[95%]'>
        <div>
          {ellipseAddress(message.sender)}
          <span className='text-sm font-normal place-self-end text-n-300 text-md uppercase'>{message.date}</span>
        </div>
        <span className='block text-md px-2 mt-2 text-black font-normal break-words'>
          {/*<Emoji text={content ?? ''} />*/}
          {content}
        </span>
        <div>{message.content}</div>
      </div>
    </div>
  )
}

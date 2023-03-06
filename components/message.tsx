import {DecodedMessage} from '@xmtp/xmtp-js'
import {useAccount} from 'wagmi'
import {DEFAULT_AVATAR} from '../config/image'
import {ellipseAddress} from '../helpers/display'
import dayjs from 'dayjs'
import Emoji from 'react-emoji-render'
import React from 'react'
import {MessageInterface} from '../types/message'

type MessageTileProps = {
  message: MessageInterface
}

export const MessageTile = ({message}: MessageTileProps): JSX.Element => {
  const {address} = useAccount()
  return (
    <div className={`flex items-start mx-auto mb-4 ${address === message.sender ? 'flex-row-reverse pr-12' : 'pl-4'}`}>
      <img src={DEFAULT_AVATAR} width={42} height={42} className={'rounded-full'} alt='' />
      <div className='ml-2 max-w-[95%]'>
        <div>
          {ellipseAddress(message.sender)}
          <span className='text-sm font-normal place-self-end text-n-300 text-md uppercase'>{message.date}</span>
        </div>
        <span className='block text-md px-2 mt-2 text-black font-normal break-words'>
          <Emoji text={message.content || ''} />
        </span>
      </div>
    </div>
  )
}

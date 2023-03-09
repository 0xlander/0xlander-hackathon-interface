import {useAccount} from 'wagmi'
import {ellipseAddress} from '../helpers/display'
import React, {Fragment, useEffect, useRef, useState} from 'react'
import {MessageInterface} from '../types/message'
import {hexToArrayBuffer, isJsonString} from '../helpers'
import {ab2str} from '../helpers/convertor'
import {Avatar} from './avatar'
import {toast} from 'react-hot-toast'
import {useAppStore} from '../store/app'
import {useRouter} from 'next/router'
import {Modal, Spinner} from './style'
import {Player} from '@livepeer/react'
import {PlayIcon} from '@heroicons/react/24/outline'
import {Client} from '@livepeer/webrtmp-sdk'
import {useInterval} from '../hooks/profile'
import {Dialog, Transition} from '@headlessui/react'

type MessageTileProps = {
  message: MessageInterface
  isDecrypted?: boolean
}

const LivestreamModal = ({open, onClose, stream}: {open: boolean; onClose: any; stream: any}) => {
  const videoEl = useRef(null)
  const streamEl = useRef(null)

  useInterval(
    async () => {
      try {
        // @ts-ignore
        videoEl.current = {
          volume: 0,
        }

        // @ts-ignore
        streamEl.current = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })

        // @ts-ignore
        videoEl.current.srcObject = streamEl.current
        // @ts-ignore
        // videoEl.current.play()
      } catch (e) {
        console.error(e)
      }
    },
    2000,
    true
  )

  useEffect(() => {
    ;(async () => {})()
  }, [])

  const onStart = async () => {
    console.log(streamEl)
    if (!streamEl.current) {
      alert('Video stream was not started.')
    }

    const client = new Client()

    try {
      // @ts-ignore
      const session = client.cast(streamEl.current, stream.streamKey)

      session.on('open', () => {
        console.log('Stream started.')
        alert('Stream started; visit Livepeer Dashboard.')
      })

      session.on('close', () => {
        console.log('Stream stopped.')
      })

      session.on('error', (err) => {
        console.log('Stream error.', err.message)
      })
    } catch (e) {
      console.log(e)
    }
  }

  const [begin, setBegin] = useState(false)
  useInterval(
    () => {
      setBegin(true)
    },
    20000,
    false
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      content={
        <>
          <div>Livestream</div>
          {/*<video autoPlay id={'video'} className='App-video' ref={videoEl} />*/}
          {!begin && (
            <div className={'flex justify-center items-center w-[300px] h-[200px] bg-gray-200'}>
              <Spinner />
            </div>
          )}
          {begin && <Player title={stream?.name} playbackId={stream?.playbackId} autoPlay />}
          <button onClick={onStart} className={'mt-4'}>
            Start
          </button>
        </>
      }
    />
  )
}

export const MessageTile = ({message, isDecrypted}: MessageTileProps): JSX.Element => {
  const videoEl = useRef(null)
  const streamEl = useRef(null)

  const router = useRouter()
  const {address} = useAccount()
  const [content, setContent] = useState<any>()
  const timClient = useAppStore((state) => state.timClient)

  const [isInvitation, setIsInvitation] = useState(false)
  const [isLivestream, setIsLivestream] = useState(false)

  const [open, setOpen] = useState(false)

  const [stream, setStream] = useState<any>()

  useEffect(() => {
    if (!isJsonString(message?.content)) {
      setContent(message.content)
      return
    }

    const j = JSON.parse(message.content)
    if (j.type === 'invitation') {
      setContent(
        <>
          <div>
            <div className={'text-xl mb-2'}>{content?.groupName}</div>
            <div className={'text-sm mb-4'}>{content?.groupDescription}. You can click button to join group.</div>
            <button className={'btn-primary'} onClick={onJoin} disabled={doing}>
              {doing && <Spinner />}
              Join
            </button>
          </div>
        </>
      )
      return
    }

    if (j.type === 'livestream') {
      console.log(j)
      const stream = j.stream
      if (address === message.sender) {
        setStream(j.stream)
        setContent(
          <>
            <div>Start your livestream</div>
            <div>{stream.streamKey}</div>
            <PlayIcon onClick={() => setOpen(true)} />
          </>
        )
        setIsLivestream(true)
        return
      }
      console.log(222222222222)
      setContent(
        <div className={'w-[420px]'}>
          <div>{stream.streamKey}</div>
          <Player title={stream?.name} playbackId={stream?.playbackId} autoPlay muted />
        </div>
      )
      setIsLivestream(true)
      return
    }
    if (!j.hasOwnProperty('iv')) {
      setContent(message.content)
      return
    }
    const handle = async () => {
      if (j.iv && isDecrypted) {
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

  useEffect(() => {
    ;(async () => {
      return
      if (!isLivestream) return
      try {
        // @ts-ignore
        videoEl.current = {
          volume: 0,
        }

        // @ts-ignore
        streamEl.current = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })

        // @ts-ignore
        videoEl.current.srcObject = streamEl.current
        console.log(videoEl)
        // @ts-ignore
        // videoEl.current = {autoplay: true}
        // @ts-ignore
        videoEl.current.autoplay = true
        // @ts-ignore
        // videoEl.current.play()
      } catch (e) {
        console.error(e)
      }
    })()
  }, [])

  useInterval(
    async () => {
      return
      if (!isLivestream) return
      try {
        // @ts-ignore
        videoEl.current = {
          volume: 0,
        }

        // @ts-ignore
        streamEl.current = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })

        // @ts-ignore
        videoEl.current.srcObject = streamEl.current
        console.log(videoEl)
        // @ts-ignore
        videoEl.current.play()
      } catch (e) {
        console.error(e)
      }
    },
    2000,
    true
  )

  return (
    <div className={`flex items-start mx-auto gap-2 mb-4 ${isSelf ? 'flex-row-reverse pr-4' : 'pl-2'}`}>
      {message.sender === address && <LivestreamModal open={open} onClose={() => setOpen(false)} stream={stream} />}
      <Avatar address={message?.sender} size={40} />
      <div className='ml-2 max-w-[420px] break-all'>
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
            {content}
          </div>
        </div>
        {/*<div className={'w-[200px] text-xs text-gray-600 break-all'}>{message.content}</div>*/}
      </div>
    </div>
  )
}

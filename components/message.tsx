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
import {Spinner} from './style'
import {Player} from '@livepeer/react'
import {PlayIcon} from '@heroicons/react/24/outline'
import {Client} from '@livepeer/webrtmp-sdk'
import {useInterval} from '../hooks/profile'
import {Dialog, Transition} from '@headlessui/react'

type MessageTileProps = {
  message: MessageInterface
}

const LivestreamModal = ({open, onClose, stream}: {open: boolean; onClose: any; stream: any}) => {
  const videoEl = useRef(null)
  const streamEl = useRef(null)
  const [finished, setFinished] = useState(false)

  useInterval(async () => {}, 2000, true)

  // useEffect(() => {
  //   videoEl.current.src = 'https://sample-videos.com/video123/mp4/240/big_buck_bunny_240p_10mb.mp4'
  // }, [])

  useEffect(() => {
    ;(async () => {
      return
      // @ts-ignore
      videoEl.current.volume = 0

      stream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      // @ts-ignore
      videoEl.current.srcObject = stream.current
      // @ts-ignore
      videoEl.current.play()
      return
      // if (finished) return
      // @ts-ignore
      videoEl.current = {volume: 0}

      // @ts-ignore
      streamEl.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      setFinished(true)

      // @ts-ignore
      videoEl.current = {
        volume: 0,
        srcObject: streamEl.current,
      }
      console.log(videoEl)
      // videoEl.current.srcObject = streamEl.current
      // @ts-ignore
      // videoEl.current?.setNativeProps({paused: false})
      try {
        ;(videoEl.current as any).play()
      } catch (e) {
        console.error(e)
      }
    })()
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

  return (
    <>
      <Transition appear show={open} as={Fragment}>
        <Dialog as='div' className='relative z-10' onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave='ease-in duration-200'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <div className='fixed inset-0 bg-black bg-opacity-70' />
          </Transition.Child>

          <div className='fixed inset-0 overflow-y-auto'>
            <div className='flex min-h-full items-center justify-center p-4 text-center'>
              <Transition.Child
                as={Fragment}
                enter='ease-out duration-300'
                enterFrom='opacity-0 scale-95'
                enterTo='opacity-100 scale-100'
                leave='ease-in duration-200'
                leaveFrom='opacity-100 scale-100'
                leaveTo='opacity-0 scale-95'
              >
                <Dialog.Panel className='w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-10 text-left align-middle shadow-xl transition-all'>
                  <div>{stream?.name}</div>
                  <video autoPlay id={'video'} className='App-video' ref={videoEl} />
                  <button onClick={onStart}>Start</button>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export const MessageTile = ({message}: MessageTileProps): JSX.Element => {
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
      const stream = j.stream
      if (address === message.sender) {
        setStream(j.stream)
        setContent(
          <>
            <div>Start your livestream</div>
            <div>{stream.streamKey}</div>
            <PlayIcon className={'h-8 w-8 cursor-pointer'} onClick={() => setOpen(true)} />
          </>
        )
        return
      }
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

import React, {useContext, useEffect, useState} from 'react'
import {useRouter} from 'next/router'
import {ArrowSmallUpIcon, FaceSmileIcon, PhotoIcon, PlusCircleIcon} from '@heroicons/react/24/outline'
import EmojiPicker, {EmojiClickData} from 'emoji-picker-react'
import {MerkleTree} from 'merkletreejs'
import {utils} from 'ethers'
import {Popover} from '@headlessui/react'
import {useAppStore} from '../store/app'

type MessageComposerProps = {
  onSend: (msg: string) => Promise<void>
  groupId?: string
  onUploadMedia?: (media: File) => void
}

export function classNames(...classes: (string | null)[]) {
  return classes.filter(Boolean).join(' ')
}

const MessageSender = ({onSend}: MessageComposerProps): JSX.Element => {
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => setMessage(''), [router.query.recipient])

  const onMessageChange = (e: React.FormEvent<HTMLInputElement>) => setMessage(e.currentTarget.value)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!message) {
      return
    }
    setMessage('')
    await onSend(message)
  }

  const [openEmoji, setOpenEmoji] = useState(false)
  const [open, setOpen] = useState(false)
  const [openSell, setOpenSell] = useState(false)
  const [openDistribution, setOpenDistribution] = useState(false)

  const onUpload = (e: {target: {files: any}}) => {
    console.log(e.target.files)
    // setPoster(e.target.files)
    // setPosterSrc(URL.createObjectURL(e.target.files[0]))
    console.log(e.target.files[0])
  }

  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [userAmount, setUserAmount] = useState('')
  const [eachAmount, setEachAmount] = useState('')
  const [tokenId, setTokenId] = useState(0)
  const [root, setRoot] = useState('')

  const can = name !== '' && userAmount !== '' && eachAmount !== '' && content !== ''

  return (
    <div className={'bg-white px-6 pt-3 pb-3 border-t-gray-200 border-t'}>
      <div className={'flex mb-1'}>
        <div
          className='border px-2 py-1 rounded-3xl text-[10px] flex gap-1 cursor-pointer'
          onClick={() => setOpenSell(true)}
        >
          <PhotoIcon className={'w-4 h-4 text-orange-400'} />
          Sell NFT
        </div>
      </div>
      <div className='flex flex-grow items-center gap-2'>
        <form autoComplete='off' onSubmit={onSubmit} className={'form-group w-full relative mb-0'}>
          <input
            type='text'
            placeholder='Type something...'
            className={'block w-full text-md md:text-sm rounded-3xl'}
            name='message'
            value={message}
            onChange={onMessageChange}
            required
          />
          <button type='submit' className={'absolute top-[10px] right-2'}>
            <div
              className={`bg-gray-200 rounded-3xl flex items-center justify-center p-2 ${
                !message ? '' : 'bg-green-400 text-white'
              }`}
            >
              {!message ? <ArrowSmallUpIcon className={'w-5 h-5'} /> : <ArrowSmallUpIcon className={'w-5 h-5'} />}
            </div>
          </button>
        </form>
        <Popover className={'relative h-6'}>
          <Popover.Button>
            <FaceSmileIcon className={'h-6 w-6'} />
          </Popover.Button>
          <Popover.Panel className={'absolute bottom-0 right-0 mb-full origin-bottom-left'}>
            <EmojiPicker
              key={'1'}
              onEmojiClick={(emojiData: EmojiClickData) => setMessage(message + emojiData.emoji)}
            />
          </Popover.Panel>
        </Popover>
      </div>
    </div>
  )
}

export default MessageSender

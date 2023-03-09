import {getConversationKey, getMessageForShow} from '../helpers/xmtp'
import {classNames} from './style'
import {DEFAULT_AVATAR} from '../config/image'
import {ellipseAddress} from '../helpers/display'
import dayjs from 'dayjs'
import {Avatar} from './avatar'
import {useTownsContract} from '../hooks/contract'
import React, {useEffect, useState} from 'react'
import {InboxIcon} from '@heroicons/react/24/solid'
import {UserGroupIcon} from '@heroicons/react/24/outline'

export const ConversationCard = ({
  id,
  onClick,
  isSelected,
  isLoading,
  name,
  date,
  content,
  isCyber,
  isDM,
}: {
  id?: string
  onClick: any
  isSelected: boolean
  isLoading: boolean
  name: string
  date: string
  content: string
  isCyber?: boolean
  isDM?: boolean
}) => {
  const townsContract = useTownsContract()
  const chatId = id?.replace('GROUP', '')
  const [fanGroup, setFanGroup] = useState(false)

  useEffect(() => {
    if (!townsContract || !chatId) return
    const query = async () => {
      const tokenId = await townsContract?.chatId2TokenIds(chatId)
      const town = await townsContract?.tokenId2Towns(tokenId)
      if (town?.name?.includes('fans')) {
        setFanGroup(true)
      } else {
        setFanGroup(false)
      }
    }
    try {
      query()
    } catch (e) {
      console.error(e)
    }
  }, [townsContract])

  return (
    <>
      <div
        onClick={onClick}
        className={classNames(
          'h-20',
          'py-2',
          'md:max-w-sm',
          'mx-auto',
          'bg-white',
          'space-y-2',
          'py-2',
          'flex',
          'items-center',
          'space-y-0',
          'space-x-4',
          'border-b-2',
          'border-gray-100',
          'hover:bg-bt-100',
          'px-6',
          'cursor-pointer',
          isLoading ? 'opacity-80' : 'opacity-100',
          isSelected ? 'bg-bt-200 bg-orange-50' : ''
        )}
      >
        {fanGroup ? (
          <div
            className={
              'w-[50px] h-[50px] bg-blue-500 rounded-lg flex items-center justify-center flex-grow flex-shrink-0 basis-[50px]'
            }
          >
            <UserGroupIcon className={'h-6 w-6 text-white'} />
          </div>
        ) : (
          <Avatar address={name} size={40} className={isDM ? 'rounded-full' : ''} />
        )}
        <div className='py-4 sm:text-left text w-full'>
          <div className='flex justify-between items-center'>
            <div className={`text-sm font-medium ${isCyber ? 'text-primary' : ''}`}>{name}</div>
            <span
              className={classNames(
                'text-xs font-normal text-gray-400',
                isSelected ? 'text-n-500' : 'text-n-300',
                isLoading ? 'animate-pulse' : ''
              )}
            >
              {date}
            </span>
          </div>
          <span className='text-sm text-gray-500 line-clamp-1 break-all'>
            {isDM ? getMessageForShow(content) : '*********'}
          </span>
        </div>
      </div>
    </>
  )
}

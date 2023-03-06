import {getConversationKey} from '../helpers/xmtp'
import {classNames} from './style'
import {DEFAULT_AVATAR} from '../config/image'
import {ellipseAddress} from '../helpers/display'
import dayjs from 'dayjs'

export const ConversationCard = ({
  onClick,
  isSelected,
  isLoading,
  name,
  date,
  content,
}: {
  onClick: any
  isSelected: boolean
  isLoading: boolean
  name: string
  date: string
  content: string
}) => {
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
          'cursor-pointer',
          isLoading ? 'opacity-80' : 'opacity-100',
          isSelected ? 'bg-bt-200' : null
        )}
      >
        <img src={DEFAULT_AVATAR} alt='avatar' width={42} height={42} className={'rounded-full'} />
        <div className='py-4 sm:text-left text w-full'>
          <div className='flex justify-between'>
            <div className={'text-md font-medium'}>{name}</div>
            <span
              className={classNames(
                'text-xs font-normal place-self-end text-gray-400',
                isSelected ? 'text-n-500' : 'text-n-300',
                isLoading ? 'animate-pulse' : ''
              )}
            >
              {date}
            </span>
          </div>
          <span className='text-sm text-gray-500 line-clamp-1 break-all'>{content}</span>
        </div>
      </div>
    </>
  )
}

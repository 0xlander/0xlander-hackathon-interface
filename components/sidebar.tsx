import {useRouter} from 'next/router'
import {
  ArrowLeftOnRectangleIcon,
  BellAlertIcon,
  BellSnoozeIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import {useQuery} from '@apollo/client'
import {PRIMARY_PROFILE} from '../graphql'
import {useAccount} from 'wagmi'
import {
  ChatBubbleOvalLeftEllipsisIcon as ActiveChatBubbleOvalLeftEllipsisIcon,
  Cog6ToothIcon as ActiveCog6ToothIcon,
} from '@heroicons/react/24/solid'
import {Popover} from '@headlessui/react'
import {NotifiSubscriptionCard} from '@notifi-network/notifi-react-card'
import React from 'react'
import {inputLabels, inputSeparators} from '../config/notifi'
import {Avatar} from './avatar'
import {useAppStore} from '../store/app'
import {ellipseAddress} from '../helpers/display'
import {JoinButton} from './join-button'

export const Sidebar = () => {
  const router = useRouter()

  const hasNewInboxMessage = useAppStore((state) => state.hasNewInboxMessage)
  const {address} = useAccount()

  const {loading, data: profile} = useQuery(PRIMARY_PROFILE, {
    variables: {
      address: address,
    },
    pollInterval: 10000,
  })

  const links = [
    {
      url: '/',
      icon: <ChatBubbleOvalLeftEllipsisIcon className={'h-6 w-6'} />,
      activeIcon: <ActiveChatBubbleOvalLeftEllipsisIcon className={'h-6 w-6 text-primary'} />,
    },
    {
      url: '/setting',
      icon: <Cog6ToothIcon className={'h-6 w-6'} />,
      activeIcon: <ActiveCog6ToothIcon className={'h-6 w-6 text-primary'} />,
    },
  ]

  const onSignOut = async () => {
    localStorage.clear()
    window.location.reload()
  }

  const isActiveLink = (pathname: string, link: string) => {
    if (link === '/') {
      return link === pathname
    }

    return pathname.includes(link)
  }

  const inbox = useAppStore((state) => state.inbox)

  return (
    <div className={'sidebar flex flex-col items-center'}>
      <div className={'text-center cursor-pointer'} onClick={() => router.push(`/user/${address}`)}>
        <Avatar size={44} address={address} />
        <div className={'text-xs text-gray-600 mt-1'}>{profile?.address?.wallet?.primaryProfile?.handle}</div>
        <div className={'text-center text-gray-400 text-[10px]'}>
          {profile?.address?.wallet?.primaryProfile?.profileID}
        </div>
      </div>
      <div className={'my-6'} />
      <div className={'flex gap-8 flex-col'}>
        {links.map((link) => (
          <div
            className={`nav-item px-8 cursor-pointer ${isActiveLink(router.pathname, link.url) ? 'active' : ''}`}
            onClick={() => router.push(link.url)}
            key={link.url}
          >
            {router.pathname === link.url ? link.activeIcon : link.icon}
          </div>
        ))}
        <div className='nav-item cursor-pointer px-8'>
          <Popover className={'relative h-6'}>
            <Popover.Button>
              <BellSnoozeIcon className={'h-6 w-6'} />
            </Popover.Button>
            <Popover.Panel className={'absolute -translate-y-1/2 left-14 mb-full origin-center-right'}>
              <div
                className={
                  'w-[320px] h-[520px] bg-white shadow-gray-300 border border-gray-200 shadow-2xl rounded-xl overflow-y-scroll'
                }
              >
                <NotifiSubscriptionCard
                  classNames={{
                    container: 'rounded-2xl',
                  }}
                  cardId='a8f12de72d9c4d3896ef2bb0b4261468'
                  inputLabels={inputLabels}
                  inputSeparators={inputSeparators}
                  darkMode={false}
                />
              </div>
            </Popover.Panel>
          </Popover>
        </div>

        <div className='nav-item cursor-pointer px-8'>
          <Popover className={'relative h-6'}>
            <Popover.Button>
              <div className={'relative'}>
                <BellAlertIcon className={'h-6 w-6'} />
                {hasNewInboxMessage && (
                  <div className={'absolute -right-[6px] top-0 w-[6px] h-[6px] bg-red-500 rounded-full'}></div>
                )}
              </div>
            </Popover.Button>
            <Popover.Panel className={'absolute -translate-y-1/2 left-14 mb-full origin-center-right'}>
              <div
                className={
                  'w-[320px] h-[400px] bg-white shadow-gray-300 border border-gray-200 shadow-2xl rounded-xl overflow-y-scroll'
                }
              >
                <div className={'p-6 overflow-y-scroll'}>
                  {inbox &&
                    Array.from(inbox.values()).map((message, index: number) => {
                      const js = JSON.parse(message.content)
                      return (
                        <div key={message?.id}>
                          <div className={'flex gap-4 mb-4'}>
                            <Avatar address={message.senderAddress} size={30} />
                            <div>
                              <div className={'text-md font-bold'}>{ellipseAddress(message?.senderAddress)}</div>
                              {js.type === 'invitation' && (
                                <div className={'text-gray-500'}>Invite you to join {js.groupName}</div>
                              )}
                              <JoinButton chatId={js.chatId} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            </Popover.Panel>
          </Popover>
        </div>
      </div>
      <ArrowLeftOnRectangleIcon className={'h-6 w-6 mt-auto mb-8 cursor-pointer'} onClick={onSignOut} />
    </div>
  )
}

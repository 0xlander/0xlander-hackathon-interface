import {useRouter} from 'next/router'
import {BellAlertIcon, ChatBubbleOvalLeftEllipsisIcon, Cog6ToothIcon, UserIcon} from '@heroicons/react/24/outline'
import {useQuery} from '@apollo/client'
import {PRIMARY_PROFILE} from '../graphql'
import {useAccount} from 'wagmi'
import {
  ChatBubbleOvalLeftEllipsisIcon as ActiveChatBubbleOvalLeftEllipsisIcon,
  UserIcon as ActiveUserIcon,
  Cog6ToothIcon as ActiveCog6ToothIcon,
} from '@heroicons/react/24/solid'
import {DEFAULT_AVATAR} from '../config/image'
import {Popover} from '@headlessui/react'
import {NotifiInputFieldsText, NotifiInputSeparators, NotifiSubscriptionCard} from '@notifi-network/notifi-react-card'
import React from 'react'
import {inputLabels, inputSeparators} from '../config/notifi'

export const Sidebar = () => {
  const router = useRouter()

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
    // {
    //   url: '/user',
    //   icon: <UserIcon className={'h-6 w-6'} />,
    //   activeIcon: <ActiveUserIcon className={'h-6 w-6 text-primary'} />,
    // },
    {
      url: '/setting',
      icon: <Cog6ToothIcon className={'h-6 w-6'} />,
      activeIcon: <ActiveCog6ToothIcon className={'h-6 w-6 text-primary'} />,
    },
  ]

  const isActiveLink = (pathname: string, link: string) => {
    if (link === '/') {
      return link === pathname
    }

    return pathname.includes(link)
  }

  return (
    <div className={'sidebar flex flex-col items-center'}>
      <div className={'text-center'} onClick={() => router.push(`/user/${address}`)}>
        <img src={DEFAULT_AVATAR} width={38} height={38} className={'rounded-full'} alt='' />
        <div className={'text-xs text-gray-600 mt-1'}>{profile?.address?.wallet?.primaryProfile?.handle}</div>
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
              <BellAlertIcon className={'h-6 w-6'} />
            </Popover.Button>
            <Popover.Panel className={'absolute -translate-y-1/2 left-14 mb-full origin-center-right'}>
              <div className={'w-[360px] shadow-gray-300 border border-gray-200 shadow-2xl rounded-xl'}>
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
      </div>
      <div className={'h-[1px] my-6 bg-gray-200'} />
    </div>
  )
}

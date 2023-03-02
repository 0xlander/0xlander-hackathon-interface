import {useRouter} from 'next/router'
import {ChatBubbleOvalLeftEllipsisIcon, UserIcon} from '@heroicons/react/24/outline'
import {useQuery} from '@apollo/client'
import {PRIMARY_PROFILE} from '../graphql'
import {useAccount} from 'wagmi'
import {ChatBubbleOvalLeftEllipsisIcon as ActiveChatBubbleOvalLeftEllipsisIcon, UserIcon as ActiveUserIcon} from '@heroicons/react/24/solid'

export const Sidebar = () => {
  const router = useRouter()

  const {address} = useAccount()

  const {loading, data} = useQuery(PRIMARY_PROFILE, {
    variables: {
      address: address,
    },
    pollInterval: 10000,
  })
  console.log(data)

  const links = [
    {
      url: '/',
      icon: <ChatBubbleOvalLeftEllipsisIcon className={'h-6 w-6'} />,
      activeIcon: <ActiveChatBubbleOvalLeftEllipsisIcon className={'h-6 w-6 text-primary'} />,
    },
    {
      url: '/user',
      icon: <UserIcon className={'h-6 w-6'} />,
      activeIcon: <ActiveUserIcon className={'h-6 w-6'} />,
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
      <img
        src='https://ipfs.cyberconnect.dev/ipfs/bafybeiabs6thetplku4hykmcxbzzmqfbkizbflyvwiawbyubam6czl2h7i'
        width={38}
        height={38}
        className={'rounded-full'}
        alt=''
      />
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
      </div>
      <div className={'h-[1px] my-6 bg-gray-200'} />
    </div>
  )
}

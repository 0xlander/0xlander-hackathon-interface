import {ConnectButton} from '@rainbow-me/rainbowkit'
import LogoImage from '../assets/images/logo.png'
import {useRouter} from 'next/router'

export const Header = () => {
  const router = useRouter()

  return (
    <div className={'flex items-center px-4 py-2 fixed left-0 top-0 w-full z-50 border border-b-gray-200 bg-white'}>
      <div onClick={() => router.push('/')} className={'cursor-pointer'} style={{height: '29.15px'}}>
        <img src={LogoImage.src} alt='logo' width={160} />
      </div>
      <div className={'ml-auto'}>
        <ConnectButton />
      </div>
    </div>
  )
}

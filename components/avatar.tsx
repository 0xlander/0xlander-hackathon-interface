import Blockies from 'react-blockies'
import Avvvatars from 'avvvatars-react'
import {useRouter} from 'next/router'

export const Avatar = ({address, size, className}: {address: string | undefined; size: number; className?: string}) => {
  const router = useRouter()
  return (
    <div
      style={{display: 'inline-block', width: size}}
      className={'cursor-pointer'}
      onClick={() => router.push(`/user/${address}`)}
    >
      <Avvvatars value={address ?? ''} style={'shape'} size={size} />
    </div>
    // <Blockies
    //   seed={address?.toLowerCase() ?? ''}
    //   scale={5}
    //   size={size}
    //   className={className ? className : 'rounded-lg'}
    // />
  )
}

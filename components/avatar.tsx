import Blockies from 'react-blockies'
import Avvvatars from 'avvvatars-react'

export const Avatar = ({address, size, className}: {address: string | undefined; size: number; className?: string}) => {
  return (
    <div style={{display: 'inline-block', width: size}}>
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

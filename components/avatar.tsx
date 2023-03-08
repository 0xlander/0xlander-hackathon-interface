import Blockies from 'react-blockies'
export const Avatar = ({address, size, className}: {address: string | undefined; size: number; className?: string}) => {
  return (
    <Blockies
      seed={address?.toLowerCase() ?? ''}
      scale={5}
      size={size}
      className={className ? className : 'rounded-lg'}
    />
  )
}

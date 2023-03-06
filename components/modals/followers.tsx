import {Modal} from '../style'
import {useQuery} from '@apollo/client'
import {GET_SUBSCRIBERS} from '../../graphql/GetSubscribers'
import {GET_FOLLOWERS} from '../../graphql/GetFollowers'
import {useAccount} from 'wagmi'
import {DEFAULT_AVATAR} from '../../config/image'
import {ellipseAddress} from '../../helpers/display'

export const FollowersModal = ({open, onClose, handle}: {open: boolean; onClose: any; handle: string | undefined}) => {
  const {address} = useAccount()
  const {data: followersRes, loading} = useQuery(GET_FOLLOWERS, {
    variables: {
      handle: handle,
      me: address,
    },
  })

  const followers = followersRes?.profileByHandle?.followers?.edges

  return (
    <Modal
      open={open}
      onClose={onClose}
      content={
        <>
          <div className='text-2xl mb-8'>Followers</div>
          <div className={'gap-6 flex flex-col'}>
            {followers &&
              followers?.map((follower: any) => (
                <div
                  key={follower?.node?.address?.wallet?.primaryProfile?.handle}
                  className={'flex items-center gap-4'}
                >
                  <img src={DEFAULT_AVATAR} alt='avatar' className={'rounded-full'} width={48} height={48} />
                  <div>
                    <div className={'text-lg font-medium'}>
                      {follower?.node?.address?.wallet?.primaryProfile?.handle}
                    </div>
                    <div className={'text-sm text-gray-500'}>{ellipseAddress(follower?.node?.address?.address)}</div>
                  </div>
                </div>
              ))}
          </div>
        </>
      }
    />
  )
}

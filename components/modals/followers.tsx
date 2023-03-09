import {Modal} from '../style'
import {useQuery} from '@apollo/client'
import {GET_FOLLOWERS} from '../../graphql/GetFollowers'
import {useAccount} from 'wagmi'
import {ellipseAddress} from '../../helpers/display'
import {Avatar} from '../avatar'
import {ChatBubbleLeftIcon} from '@heroicons/react/24/outline'
import {useRouter} from 'next/router'

export const FollowersModal = ({open, onClose, handle}: {open: boolean; onClose: any; handle: string | undefined}) => {
  const router = useRouter()
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
                  <Avatar address={follower?.node?.address?.address} size={40} />
                  <div>
                    <div className={'text-lg font-medium'}>
                      {follower?.node?.address?.wallet?.primaryProfile?.handle}
                    </div>
                    <div className={'text-sm text-gray-500'}>{ellipseAddress(follower?.node?.address?.address)}</div>
                  </div>
                  <ChatBubbleLeftIcon
                    className={'h-5 w-5 cursor-pointer ml-auto'}
                    onClick={() => {
                      router.push(`/dm/${follower?.node?.address?.address}`)
                      onClose()
                    }}
                  />
                </div>
              ))}
          </div>
        </>
      }
    />
  )
}

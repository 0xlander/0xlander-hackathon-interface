import {Modal} from '../style'
import {useQuery} from '@apollo/client'
import {GET_SUBSCRIBERS} from '../../graphql/GetSubscribers'
import {GET_FOLLOWERS} from '../../graphql/GetFollowers'
import {useAccount} from 'wagmi'
import {DEFAULT_AVATAR} from '../../config/image'
import {ellipseAddress} from '../../helpers/display'
import {useAppStore} from '../../store/app'
import TIM from 'tim-js-sdk'

export const CreateGroupModal = ({
  open,
  onClose,
  handle,
}: {
  open: boolean
  onClose: any
  handle: string | undefined
}) => {
  const timClient = useAppStore((state) => state.timClient)
  const {address} = useAccount()
  const {data: followersRes, loading} = useQuery(GET_FOLLOWERS, {
    variables: {
      handle: handle,
      me: address,
    },
  })

  const followers = followersRes?.profileByHandle?.followers?.edges

  const onCreateFollowersGroup = async () => {
    const members = followers?.map((f: any) => {
      return {userID: f?.node?.address?.address}
    })
    const res = await timClient.createGroup({
      name: `${handle} Fans`,
      type: TIM.TYPES.GRP_PUBLIC,
      groupID: `fans_${handle}`,
      memberList: members,
    })

    console.log(res)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      content={
        <>
          <div className='text-2xl mb-8'>Create Group</div>
          <div className={'gap-6 flex flex-col'}>
            <div>
              <button className={'btn-primary'} onClick={onCreateFollowersGroup}>
                Create Followers Group
              </button>
            </div>
          </div>
        </>
      }
    />
  )
}

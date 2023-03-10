import {Modal, Spinner} from '../style'
import {useQuery} from '@apollo/client'
import {GET_FOLLOWERS} from '../../graphql/GetFollowers'
import {useAccount} from 'wagmi'
import {useAppStore} from '../../store/app'
import TIM from 'tim-js-sdk'
import {useTownsContract} from '../../hooks/contract'
import dayjs from 'dayjs'
import BigNumber from 'bignumber.js'
import {toast} from 'react-hot-toast'
import {useRouter} from 'next/router'
import {useState} from 'react'

export const CreateGroupModal = ({
  open,
  onClose,
  handle,
}: {
  open: boolean
  onClose: any
  handle: string | undefined
}) => {
  const router = useRouter()
  const litClient = useAppStore((state) => state.litClient)
  const timClient = useAppStore((state) => state.timClient)
  const {address} = useAccount()
  const {data: followersRes, loading} = useQuery(GET_FOLLOWERS, {
    variables: {
      handle: handle,
      me: address,
    },
  })

  const [doing, setDoing] = useState(false)

  const followers = followersRes?.profileByHandle?.followers?.edges
  const townsContract = useTownsContract()
  const data = useAppStore((state) => state.primaryProfile)
  const primaryProfile: any = data?.address?.wallet?.primaryProfile

  const onCreateFollowersGroup = async () => {
    setDoing(true)
    const tokenId = await townsContract?.leader2TokenIds(address)
    const chatId = dayjs().unix()

    if (new BigNumber(tokenId.toString()).gt(0)) {
      const town = await townsContract?.tokenId2Towns(tokenId.toString())
      toast.success('Had created group')
      router.push(`/group/GROUP${town.chatId}`)
    } else {
      try {
        const name = primaryProfile?.handle + ' fans'
        const description = primaryProfile?.handle + ' fans group'
        const res = await timClient.createGroup({
          name: name,
          type: TIM.TYPES.GRP_MEETING,
          groupID: chatId.toString(),
          memberList: [
            {
              userID: address,
            },
          ],
        })
        const tx = await townsContract?.mintLeaderTown(address, chatId.toString(), name, description, '2')
        toast.error('Create group successfully')
        router.push(`/group/GROUP${chatId}`)
      } catch (e) {
        console.error('create group: ', e)
      }
    }
    setDoing(false)
    // const members = followers?.map((f: any) => {
    //   return {userID: f?.node?.address?.address}
    // })
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
              <button className={'btn-primary w-[260px]'} onClick={onCreateFollowersGroup} disabled={doing}>
                {doing && <Spinner />}
                Create Followers Group
              </button>
            </div>
          </div>
        </>
      }
    />
  )
}

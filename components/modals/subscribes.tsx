import {Modal} from '../style'
import {useQuery} from '@apollo/client'
import {GET_SUBSCRIBERS} from '../../graphql/GetSubscribers'
import {DEFAULT_AVATAR} from '../../config/image'
import {ellipseAddress} from '../../helpers/display'
import {Avatar} from '../avatar'
import {ChatBubbleLeftIcon} from '@heroicons/react/24/outline'
import {useRouter} from 'next/router'

export const SubscribesModal = ({
  open,
  onClose,
  address,
}: {
  open: boolean
  onClose: any
  address: string | undefined
}) => {
  const router = useRouter()
  const {data: subscribersRes, loading} = useQuery(GET_SUBSCRIBERS, {
    variables: {
      address: address,
    },
  })

  const subscribers = subscribersRes?.address?.wallet?.primaryProfile?.subscribers?.edges

  return (
    <Modal
      open={open}
      onClose={onClose}
      content={
        <>
          <div className='text-2xl mb-8'>Subscribers</div>
          {subscribers &&
            subscribers?.map((sub: any) => (
              <div key={sub?.node?.wallet?.address} className={'flex items-center gap-4 mb-4'}>
                <Avatar address={sub?.node?.wallet?.address} size={40} />
                <div>
                  <div className={'text-lg font-medium'}>{sub?.node?.wallet?.primaryProfile?.handle}</div>
                  <div className={'text-sm text-gray-500'}>{ellipseAddress(sub?.node?.wallet?.address)}</div>
                </div>
                <ChatBubbleLeftIcon
                  className={'h-5 w-5 cursor-pointer ml-auto'}
                  onClick={() => {
                    router.push(`/dm/${sub?.node?.wallet?.address}`)
                    onClose()
                  }}
                />
              </div>
            ))}
        </>
      }
    />
  )
}

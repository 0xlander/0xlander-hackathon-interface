import {Modal} from '../style'
import {useQuery} from '@apollo/client'
import {GET_SUBSCRIBERS} from '../../graphql/GetSubscribers'
import {DEFAULT_AVATAR} from '../../config/image'
import {ellipseAddress} from '../../helpers/display'

export const SubscribesModal = ({
  open,
  onClose,
  address,
}: {
  open: boolean
  onClose: any
  address: string | undefined
}) => {
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
          <div className='text-2xl mb-8'>Subscribes</div>
          {subscribers &&
            subscribers?.map((sub: any) => (
              <div key={sub?.node?.wallet?.address} className={'flex items-center gap-4'}>
                <img src={DEFAULT_AVATAR} alt='avatar' className={'rounded-full'} width={48} height={48} />
                <div>
                  <div className={'text-lg font-medium'}>{sub?.node?.profile?.handle}</div>
                  <div className={'text-sm text-gray-500'}>{ellipseAddress(sub?.node?.wallet?.address)}</div>
                </div>
              </div>
            ))}
        </>
      }
    />
  )
}

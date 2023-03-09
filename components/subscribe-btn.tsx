import {useInterval} from '../hooks/profile'
import {useLazyQuery, useMutation, useQuery} from '@apollo/client'
import {CREATE_SET_SUBSCRIBE_DATA_TYPED_DATA} from '../graphql/CreateSetSubscribeTypedData'
import {CREATE_SUBSCRIBE_TYPED_DATA} from '../graphql/CreateSubscribeTypedData'
import {RELAY} from '../graphql/Relay'
import {RELAY_ACTION_STATUS} from '../graphql/RelayActionStatus'
import {useAccount} from 'wagmi'
import React, {ReactNode, useState} from 'react'
import {GET_PROFILE_BY_ADDRESS} from '../graphql/GetProfileByAddress'
import {toast} from 'react-hot-toast'
import {Spinner} from './style'

export const SubscribeBtn = ({targetAddress}: {targetAddress: string}) => {
  const [relayId, setRelayId] = useState('')

  const {address} = useAccount()
  const [createSubscribeTypedData] = useMutation(CREATE_SUBSCRIBE_TYPED_DATA)
  const [relay] = useMutation(RELAY)
  const [getRelayActionStatus] = useLazyQuery(RELAY_ACTION_STATUS)

  const [doing, setDoing] = useState(false)

  const {data: profileRes} = useQuery(GET_PROFILE_BY_ADDRESS, {
    variables: {
      address: targetAddress,
      me: address,
    },
  })
  const profile = profileRes?.address?.wallet?.primaryProfile
  const onSubscribe = async () => {
    setDoing(true)
    /* Create typed data in a readable format */
    const typedDataResult = await createSubscribeTypedData({
      variables: {
        input: {
          profileIDs: [profile?.profileID],
        },
      },
    })
    console.log(profile?.id)
    const typedData = typedDataResult.data?.createSubscribeTypedData?.typedData
    const message = typedData.data
    const typedDataID = typedData.id

    /* Get the signature for the message signed with the wallet */
    const params = [address, message]
    const method = 'eth_signTypedData_v4'
    // @ts-ignore
    const signature = await signer?.provider?.send(method, params)
    console.log(signature)

    /* Call the relay to broadcast the transaction */
    const relayResult = await relay({
      variables: {
        input: {
          typedDataID: typedDataID,
          signature: signature,
        },
      },
    })

    const relayActionId = relayResult?.data?.relay?.relayActionId

    const pollRelayActionStatus = async (id: string) => {
      console.log('start polling')
      const relayActionStatusResult = await getRelayActionStatus({
        variables: {relayActionId: relayId},
        fetchPolicy: 'network-only',
      })
      console.log('relayActionStatusResult', relayActionStatusResult)
      if (relayActionStatusResult.data?.relayActionStatus?.txHash) {
        return
      } else if (relayActionStatusResult.data?.relayActionStatus?.reason) {
        return
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await pollRelayActionStatus(id)
    }
    await pollRelayActionStatus(relayActionId)
    setDoing(false)
    toast.success('Subscribe successfully')
  }

  useInterval(
    async () => {
      if (relayId) {
        const res = await getRelayActionStatus({
          variables: {relayActionId: relayId},
          fetchPolicy: 'network-only',
        })

        console.log('res', res)
        console.log('res 3000', res.data.relayActionStatus)
        if (res.data.relayActionStatus.txStatus === 'SUCCESS') {
          return
        }
      }
    },
    2000,
    true
  )

  return (
    <div onClick={onSubscribe}>
      <button className={'btn-primary mt-8'} disabled={doing || profile?.isSubscribedByMe}>
        {doing && <Spinner />}
        {profile?.isSubscribedByMe ? 'Subscribed' : 'Subscribe'}
      </button>
    </div>
  )
}

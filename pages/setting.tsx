import React, {useEffect, useState} from 'react'
import {Layout} from '../components/layout'
import {useAppStore} from '../store/app'
import {isJsonString, sleep} from '../helpers'
import {useLazyQuery, useMutation} from '@apollo/client'
import {CREATE_SET_METADATA_TYPED_DATA} from '../graphql/CreateSetMetadataTypedData'
import {useSignTypedData} from 'wagmi'
import {RELAY} from '../graphql/Relay'
import {RELAY_ACTION_STATUS} from '../graphql/RelayActionStatus'
import {ProfileMetadata} from '../types/profile'
import {Spinner} from '../components/style'
import {handleCors, handleUri} from '../helpers/image'

const Setting = () => {
  const [email, setEmail] = useState('')
  const primaryProfile = useAppStore((state) => state.primaryProfile)
  const profile = primaryProfile?.address?.wallet?.primaryProfile
  console.log(profile)
  const [createSetMetadataTypedData] = useMutation(CREATE_SET_METADATA_TYPED_DATA)
  const {data: signMetadataSignature, signTypedDataAsync} = useSignTypedData()
  const [relay] = useMutation(RELAY)
  const [getRelayActionStatus] = useLazyQuery(RELAY_ACTION_STATUS)

  const [doing, setDoing] = useState(false)

  const [metadata, setMetadata] = useState<ProfileMetadata>()

  useEffect(() => {
    if (metadata) {
      setEmail(metadata.email)
    }
  }, [metadata])

  useEffect(() => {
    if (profile && profile.metadata) {
      if (isJsonString(profile.metadata)) {
        setMetadata(JSON.parse(profile.metadata))
      } else {
        const url = `ipfs://${profile.metadata}`
        fetch(handleCors(handleUri(url) ?? ''), {
          method: 'GET',
        })
          .then((res) => res.json())
          .then((res) => {
            console.log(res)
            setMetadata(res)
          })
          .catch((e) => console.error(e))
      }
    }
  }, [profile])

  const onSet = async () => {
    setDoing(true)
    try {
      const metadata: ProfileMetadata = {
        display_name: '',
        bio: '',
        email: email,
      }
      const typedDataResult = await createSetMetadataTypedData({
        variables: {
          input: {
            metadata: JSON.stringify(metadata),
            profileId: primaryProfile?.address?.wallet?.primaryProfile?.profileID,
          },
        },
      })

      console.log(typedDataResult)

      const typedData = typedDataResult.data?.createSetMetadataTypedData?.typedData

      const parsed = JSON.parse(typedData?.data)

      const signature = await signTypedDataAsync({
        domain: parsed.domain,
        types: parsed.types,
        value: parsed.message,
      })

      const relayResult = await relay({
        variables: {
          input: {
            typedDataID: typedData?.id,
            signature: signature,
          },
        },
      })

      for (let i = 0; i < 10000; i++) {
        const res = await getRelayActionStatus({
          variables: {relayActionId: relayResult?.data?.relay?.relayActionId},
          fetchPolicy: 'network-only',
        })

        console.log('res', res)
        console.log('res 3000', res.data.relayActionStatus)
        if (res.data.relayActionStatus.txStatus === 'SUCCESS') {
          break
        }

        await sleep(1000)
      }
    } catch (e) {
      console.error(e)
    }

    setDoing(false)
  }

  return (
    <Layout>
      <div className='w-[800px] max-w-full mx-auto pt-20'>
        <div className='text-4xl font-medium mb-10'>Setting</div>
        <div className={'form-group mb-8'}>
          <h4 className={'text-2md'}>ccProfile</h4>
          <input
            type='email'
            disabled={true}
            placeholder={primaryProfile?.address?.wallet?.primaryProfile?.handle}
            className={'input'}
          />
        </div>

        <div className={'form-group'}>
          <h4 className={'text-2md'}>Email</h4>
          <p className={'pb-2 text-xs text-gray-500'}>This cannot be edited after your project is created</p>
          <input type='email' value={email} className={'input'} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <button className={'btn-primary mt-14'} onClick={onSet} disabled={doing}>
          {doing && <Spinner />}
          Update
        </button>
      </div>
    </Layout>
  )
}

export default Setting

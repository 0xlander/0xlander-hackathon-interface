import {ReactNode, useEffect, useState} from 'react'
import {Header} from './header'
import {useAccount, useContractWrite, usePrepareContractWrite, useSignMessage} from 'wagmi'
import {Sidebar} from './sidebar'
import {ConnectButton} from '@rainbow-me/rainbowkit'
import {useIsLogged} from '../hooks/useIsLogged'
import {useMutation, useQuery} from '@apollo/client'
import {LOGIN_GET_MESSAGE} from '../graphql/LoginGetMessage'
import {LOGIN_VERIFY} from '../graphql/LoginVerify'
import {PRIMARY_PROFILE} from '../graphql'
import {getProfileContractAddress} from '../config/contract'
import {ProfileNFTABI} from '../config/abis/ProfileNFT'

let handled = false

export const Layout = ({children}: {children: ReactNode}) => {
  const {address} = useAccount()
  const isLogged = useIsLogged()

  const [handle, setHandle] = useState('')

  const {loading, data} = useQuery(PRIMARY_PROFILE, {
    variables: {
      address: address,
    },
    pollInterval: 10000,
  })

  const hadHandle = !!data?.address?.wallet?.primaryProfile

  const [loginGetMessage] = useMutation(LOGIN_GET_MESSAGE)
  const [loginVerify] = useMutation(LOGIN_VERIFY)

  const {signMessage} = useSignMessage({
    onSuccess: async (data) => {
      console.log(data)
      const accessTokenResult = await loginVerify({
        variables: {
          input: {
            address: address,
            domain: 'test.0xlander.com',
            signature: data,
          },
        },
      })
      const accessToken = accessTokenResult?.data?.loginVerify?.accessToken
      localStorage.setItem('accessToken', accessToken)
    },
  })

  useEffect(() => {
    if (!handled && address && !isLogged) {
      handled = true
      const handle = async () => {
        const messageResult = await loginGetMessage({
          variables: {
            input: {
              address: address,
              domain: 'test.0xlander.com',
            },
          },
        })
        const message = messageResult?.data?.loginGetMessage?.message
        signMessage({
          message: message,
        })
      }

      handle()
    }
  }, [])

  const {config, refetch} = usePrepareContractWrite({
    address: '0x57e12b7a5f38a7f9c23ebd0400e6e53f2a45f271',
    abi: ProfileNFTABI,
    functionName: 'createProfile',
    args: [
      {
        to: address,
        handle: handle,
        metadata: '',
        avatar: '',
        operator: '0x85AAc6211aC91E92594C01F8c9557026797493AE',
      },
      '0x',
      '0x',
    ],
    enabled: false,
  })

  const {write, isLoading, isSuccess} = useContractWrite(config)

  const onCreate = async () => {
    await refetch()
    if (handle) {
      write?.()
    }
  }

  return (
    <div className={'min-h-screen'}>
      {!isLogged && (
        <div className={'flex items-center justify-center'}>
          <div className='container h-screen'>
            <ConnectButton />
          </div>
        </div>
      )}
      {isLogged && !hadHandle && (
        <>
          <div className={'flex items-center justify-center'}>
            <div className='container'>
              <div className='flex flex-col gap-6'>
                <div className='form-group'>
                  <input type='text' className={'input'} value={handle} onChange={(e) => setHandle(e.target.value)} />
                </div>
                <button className={'btn btn-primary'} onClick={onCreate}>
                  Create
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {isLogged && hadHandle && (
        <>
          <Sidebar />
          <div>{children}</div>
        </>
      )}
    </div>
  )
}

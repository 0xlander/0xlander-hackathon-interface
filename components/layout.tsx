import {ReactNode, useEffect, useState} from 'react'
import {Header} from './header'
import {useAccount, useSignMessage} from 'wagmi'
import {Sidebar} from './sidebar'
import {ConnectButton} from '@rainbow-me/rainbowkit'
import {useIsLogged} from '../hooks/useIsLogged'
import {useMutation, useQuery} from '@apollo/client'
import {LOGIN_GET_MESSAGE} from '../graphql/LoginGetMessage'
import {LOGIN_VERIFY} from '../graphql/LoginVerify'
import {PRIMARY_PROFILE} from '../graphql'

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

  const onCreate = async () => {}

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
                <button className={'btn btn-primary'}>Create</button>
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

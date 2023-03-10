import {ReactNode, useEffect, useState} from 'react'
import {Header} from './header'
import {
  useAccount,
  useContract,
  useContractWrite,
  usePrepareContractWrite,
  useSigner,
  useSignMessage,
  useWaitForTransaction,
} from 'wagmi'
import {Sidebar} from './sidebar'
import {ConnectButton} from '@rainbow-me/rainbowkit'
import {useIsLogged} from '../hooks/useIsLogged'
import {useMutation, useQuery} from '@apollo/client'
import {LOGIN_GET_MESSAGE} from '../graphql/LoginGetMessage'
import {LOGIN_VERIFY} from '../graphql/LoginVerify'
import {PRIMARY_PROFILE} from '../graphql'
import {ProfileNFTABI} from '../config/abis/ProfileNFT'
import {getImage} from '../helpers/image'
import {CC_ACCESS_TOKEN_KEY, DOMAIN} from '../config/key'
import {Spinner} from './style'
import {toast} from 'react-hot-toast'
import useListConversations from '../hooks/useListConversations'
import useIsSSR from '../hooks/contract'
import {useDebounce} from 'usehooks-ts'

let handled = false

export const Layout = ({children}: {children: ReactNode}) => {
  const {data: signer} = useSigner()
  const {address} = useAccount()
  const {isLogged, isChecked} = useIsLogged()

  const [can, setCan] = useState(false)
  const [handle, setHandle] = useState('')
  const debounceHandle = useDebounce(handle, 1000)

  useListConversations()

  const {loading, data} = useQuery(PRIMARY_PROFILE, {variables: {address: address}, pollInterval: 2000})

  const hadHandle = !!data?.address?.wallet?.primaryProfile

  const [loginGetMessage] = useMutation(LOGIN_GET_MESSAGE)
  const [loginVerify] = useMutation(LOGIN_VERIFY)

  const {signMessage} = useSignMessage({
    onSuccess: async (data) => {
      const accessTokenResult = await loginVerify({
        variables: {
          input: {
            address: address,
            domain: DOMAIN,
            signature: data,
          },
        },
      })
      const accessToken = accessTokenResult?.data?.loginVerify?.accessToken
      localStorage.setItem(CC_ACCESS_TOKEN_KEY, accessToken)
    },
  })

  const onSignIn = async () => {
    try {
      const messageResult = await loginGetMessage({
        variables: {
          input: {
            address: address,
            domain: DOMAIN,
          },
        },
      })
      const message = messageResult?.data?.loginGetMessage?.message
      signMessage({
        message: message,
      })
    } catch (e) {
      console.error(e)
    }
  }

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
  })

  const contract = useContract({
    abi: ProfileNFTABI,
    address: '0x57e12b7a5f38a7f9c23ebd0400e6e53f2a45f271',
    signerOrProvider: signer?.provider,
  })

  useEffect(() => {
    const query = async () => {
      if (debounceHandle) {
        const id = await contract?.getProfileIdByHandle(debounceHandle)
        console.log(id)
        if (id.gt(0)) {
          setCan(false)
        } else {
          setCan(true)
        }
      } else {
        setCan(false)
      }
    }
    try {
      query()
    } catch (e) {
      console.error(e)
    }
  }, [debounceHandle])

  const {write, data: wd} = useContractWrite(config)
  const {isLoading} = useWaitForTransaction({
    hash: wd?.hash,
    onSuccess: () => {
      setHandle('')
      toast.success('Create profile successfully')
    },
  })

  const [doing, setDoing] = useState(false)

  const isSSR = useIsSSR()

  const onCreate = () => {
    write?.()
  }

  if (isSSR) {
    return <></>
  }

  return (
    <div className={'min-h-screen'}>
      {!address && (
        <div className={'min-h-screen flex justify-center items-center'}>
          <div className={'w-[400px] max-w-full flex flex-col items-center'}>
            <img src={getImage('logo.png')} alt='logo' className={'mx-auto'} width={300} />
            <div className='text-sm text-gray-600 text-center mt-2 mb-6'>
              0xLander，Social based web3 native community homebase
            </div>
            <ConnectButton showBalance={true} chainStatus={'none'} />
          </div>
        </div>
      )}

      {address && !isLogged && (
        <div className={'min-h-screen flex justify-center items-center'}>
          <div className={'w-[420px] max-w-full'}>
            <img src={getImage('logo.png')} alt='logo' className={'mx-auto'} width={300} />
            <div className='text-sm text-gray-600 text-center mt-2 mb-6'>
              0xLander，Social based web3 native community homebase
            </div>
            <div className={'text-center'}>
              <button className={'btn-primary'} onClick={onSignIn}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
      {isLogged && !hadHandle && !loading && (
        <div className={'min-h-screen flex justify-center items-center'}>
          <div className={'w-[420px] max-w-full'}>
            <div className='container'>
              <div className='flex flex-col gap-6'>
                <div className='text-4xl font-medium mb-6'>Create Your Profile</div>
                <div className='form-group'>
                  <h4>Handle</h4>
                  <p>Choose your ccProfile handle</p>
                  <input type='text' className={'input'} value={handle} onChange={(e) => setHandle(e.target.value)} />
                </div>
                <button className={'btn btn-primary mt-8'} onClick={onCreate} disabled={isLoading || !can}>
                  {isLoading && <Spinner />}
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
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

import React, {ReactNode, useCallback, useEffect, useState} from 'react'
import {useAccount, useSigner} from 'wagmi'
import {useIsLogged} from '../hooks/useIsLogged'
import {useQuery} from '@apollo/client'
import {PRIMARY_PROFILE} from '../graphql'
import {useAppStore} from '../store/app'
import {arrayify} from '@ethersproject/bytes'
import {
  NotifiContext,
  NotifiInputFieldsText,
  NotifiInputSeparators,
  NotifiSubscriptionCard,
} from '@notifi-network/notifi-react-card'
// @ts-ignore
import LitJsSdk from '@lit-protocol/sdk-browser'
import {Signer} from '@wagmi/core'
import {Client} from '@xmtp/xmtp-js'
import {loadKeys, storeKeys, wipeKeys} from '../helpers/xmtp'
import {getAppVersion, getEnv} from '../helpers/env'
import TIM from 'tim-js-sdk'
import {getAPIHost} from '../config/host'
import {usePost} from '../hooks/request'
import {TIM_ACCESS_TOKEN_KEY} from '../config/key'
import Moralis from 'moralis'
import {useInterval} from '../hooks/profile'

let initialized = false

export const Initializer = ({children}: {children: ReactNode}): JSX.Element => {
  const {data: signer} = useSigner()
  const {address} = useAccount()
  const isLogged = useIsLogged()
  const timConversations = useAppStore((state) => state.timConversations)
  const alchemyClient = useAppStore((state) => state.alchemyClient)
  const setAlchemyClient = useAppStore((state) => state.setAlchemyClient)
  const setTimConversations = useAppStore((state) => state.setTimConversations)
  const setPrimaryProfile = useAppStore((state) => state.setPrimaryProfile)
  const setLoadingConversations = useAppStore((state) => state.setLoadingConversations)
  const setLitClient = useAppStore((state) => state.setLitClient)
  const timClient = useAppStore((state) => state.timClient)
  const setTimClient = useAppStore((state) => state.setTimClient)
  const xmtpClient = useAppStore((state) => state.xmtpClient)
  const conversations = useAppStore((state) => state.conversations)
  const setConversations = useAppStore((state) => state.setConversations)
  const convoMessages = useAppStore((state) => state.convoMessages)
  const setXmtpClient = useAppStore((state) => state.setXmtpClient)
  const reset = useAppStore((state) => state.reset)
  const [isRequestPending, setIsRequestPending] = useState(false)

  const addTimMessages = useAppStore((state) => state.addTimMessages)
  const setTimIsReady = useAppStore((state) => state.setTimIsReady)
  const timIsReady = useAppStore((state) => state.timIsReady)

  const post = usePost()

  const {loading, data} = useQuery(PRIMARY_PROFILE, {
    variables: {
      address: address,
    },
    pollInterval: 10000,
  })

  useEffect(() => {
    if (!initialized) {
      initialized = true
      const init = async () => {
        const client = new LitJsSdk.LitNodeClient({debug: false})
        await client.connect()
        console.log('Lit protocol initialized')
        setLitClient(client)
      }

      try {
        Moralis.start({
          apiKey: 'QcorwcmEW17WbQWyRqyDAmy3uhX2f8qWYzBnfQ5qVbvXYRy2tw3p2ZcniEDqn18J',
        })
        init()
      } catch (e) {
        console.error(e)
        initialized = false
      }
    }
  })

  useEffect(() => {
    setPrimaryProfile(data)
  }, [data])

  const disconnect = () => {
    reset()
    if (signer) {
      wipeKeys(address ?? '')
    }
  }

  const initTimClient = useCallback(async () => {
    if (!timClient && address) {
      try {
        let options = {
          SDKAppID: 1721000070,
        }
        let tim = TIM.create(options)

        tim.setLogLevel(4)

        const result = await post(
          `${getAPIHost()}/login`,
          JSON.stringify({
            address: address,
          })
        )

        let onMessageReceived = function (event: any) {
          const messageList = event.data
          console.log(event.data)
          messageList.forEach((message: any) => {
            addTimMessages(message.conversationID, [message])
            if (message.type === TIM.TYPES.MSG_TEXT) {
            } else if (message.type === TIM.TYPES.MSG_IMAGE) {
            } else if (message.type === TIM.TYPES.MSG_GRP_SYS_NOTICE) {
            }
          })
        }

        tim.on(TIM.EVENT.MESSAGE_RECEIVED, onMessageReceived)
        tim.on(TIM.EVENT.SDK_READY, () => setTimIsReady(true))

        tim.on(TIM.EVENT.CONVERSATION_LIST_UPDATED, (e: any) => {
          // console.log('update', e.data)
        })

        if (localStorage.getItem(TIM_ACCESS_TOKEN_KEY) !== '') {
          let p = tim.login({userID: address, userSig: result.data})
          p.then(function (imResponse: any) {
            localStorage.setItem(TIM_ACCESS_TOKEN_KEY, result.data)
            if (imResponse.data.repeatLogin === true) {
              console.log(imResponse.data.errorInfo)
            }
          }).catch(function (imError: Error) {
            console.warn('login error:', imError)
          })
        }

        setTimClient(tim)
      } catch (e) {
        console.error(e)
        setTimClient(null)
      }
    }
  }, [timClient, address])

  useInterval(
    () => {
      if (timIsReady) {
        timClient
          .getConversationList()
          .then((res: any) => {
            setTimConversations(res?.data?.conversationList)
          })
          .catch((e: Error) => console.error(e))
      }
    },
    2000,
    true
  )

  const initClient = useCallback(
    async (wallet: Signer) => {
      if (wallet && !xmtpClient) {
        try {
          setIsRequestPending(true)
          let keys = loadKeys(address ?? '')
          if (!keys) {
            keys = await Client.getKeys(wallet, {
              env: getEnv(),
              appVersion: getAppVersion(),
            })
            storeKeys(address ?? '', keys)
          }
          const xmtp = await Client.create(null, {
            env: getEnv(),
            appVersion: getAppVersion(),
            privateKeyOverride: keys,
          })
          setXmtpClient(xmtp)
          setIsRequestPending(false)
        } catch (e) {
          console.error(e)
          setXmtpClient(null)
          setIsRequestPending(false)
        }
      }
    },
    [xmtpClient]
  )

  useEffect(() => {
    if (!isRequestPending) {
      signer ? initClient(signer) : disconnect()
    }
  }, [signer, initClient])

  useEffect(() => {
    if (address) {
      try {
        initTimClient()
      } catch (e) {
        console.error(e)
      }
    }
  }, [address, initTimClient])

  return (
    <>
      <NotifiContext
        dappAddress='0xlander'
        env='Development'
        signMessage={async (message: Uint8Array) => {
          const result = await signer?.signMessage(message)
          // @ts-ignore
          return arrayify(result)
        }}
        walletPublicKey={address ?? ''}
        walletBlockchain='BINANCE' // NOTE - Please update to the correct chain name.
      >
        {children}
      </NotifiContext>
    </>
  )
}

import {getEnv} from './env'
import type {Conversation, DecodedMessage} from '@xmtp/xmtp-js'
import {NextRouter} from 'next/router'

const ENCODING = 'binary'

export const buildLocalStorageKey = (walletAddress: string) => `xmtp:${getEnv()}:keys:${walletAddress}`

export const loadKeys = (walletAddress: string): Uint8Array | null => {
  const val = localStorage.getItem(buildLocalStorageKey(walletAddress))
  return val ? Buffer.from(val, ENCODING) : null
}

export const storeKeys = (walletAddress: string, keys: Uint8Array) => {
  localStorage.setItem(buildLocalStorageKey(walletAddress), Buffer.from(keys).toString(ENCODING))
}

export const wipeKeys = (walletAddress: string) => {
  localStorage.removeItem(buildLocalStorageKey(walletAddress))
}

export const getUniqueMessages = (msgObj: DecodedMessage[]): DecodedMessage[] => {
  const uniqueMessages = [...Array.from(new Map(msgObj.map((item) => [item['id'], item])).values())]
  uniqueMessages.sort((a, b) => {
    return (b.sent?.getTime() ?? 0) - (a.sent?.getTime() ?? 0)
  })

  return uniqueMessages ?? []
}

export const truncate = (str: string | undefined, length: number): string | undefined => {
  if (!str) {
    return str
  }
  if (str.length > length) {
    return `${str.substring(0, length - 3)}...`
  }
  return str
}

export const formatDate = (d: Date | undefined): string => (d ? d.toLocaleDateString('en-US') : '')

export const formatTime = (d: Date | undefined): string =>
  d
    ? d.toLocaleTimeString(undefined, {
        hour12: true,
        hour: 'numeric',
        minute: '2-digit',
      })
    : ''

export const checkPath = () => {
  return window.location.pathname !== '/' && window.location.pathname !== '/dm'
}

export const isEns = (address: string): boolean => {
  return address.endsWith('eth') || address.endsWith('.cb.id')
}

export const is0xAddress = (address: string): boolean => address.startsWith('0x') && address.length === 42

export const shortAddress = (addr: string): string =>
  addr.length > 10 && addr.startsWith('0x') ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : addr

export const getConversationKey = (conversation?: Conversation): string => {
  return conversation?.context?.conversationId
    ? `${conversation?.peerAddress}/${conversation?.context?.conversationId}`
    : conversation?.peerAddress ?? ''
}

export const getAddressFromPath = (router: NextRouter): string => {
  return Array.isArray(router.query.recipientWalletAddr)
    ? router.query.recipientWalletAddr[0]
    : (router.query.recipientWalletAddr as string)
}

import {create} from 'zustand'
import {Client, Conversation, DecodedMessage} from '@xmtp/xmtp-js'
import {getUniqueMessages} from '../helpers/xmtp'
import {Message} from 'tim-js-sdk'
import {getUniqueMessagesV2} from '../helpers/tim'

interface AppState {
  alchemyClient: any
  setAlchemyClient: (client: any) => void
  primaryProfile: any
  setPrimaryProfile: (profile: any) => void
  timIsReady: boolean
  setTimIsReady: (isReady: boolean) => void
  timClient: any
  setTimClient: (client: any) => void
  timConversations: Map<string, any>
  setTimConversations: (conversations: Map<string, any>) => void
  timConvoMessages: Map<string, Message[]>
  addTimMessages: (key: string, newMessages: Message[]) => number
  litClient: any
  setLitClient: (litClient: any) => void
  xmtpClient: Client | undefined | null
  setXmtpClient: (client: Client | undefined | null) => void
  conversations: Map<string, Conversation>
  setConversations: (conversations: Map<string, Conversation>) => void
  loadingConversations: boolean
  setLoadingConversations: (loadingConversations: boolean) => void
  convoMessages: Map<string, DecodedMessage[]>
  previewMessages: Map<string, DecodedMessage>
  setPreviewMessage: (key: string, message: DecodedMessage) => void
  setPreviewMessages: (previewMessages: Map<string, DecodedMessage>) => void
  addMessages: (key: string, newMessages: DecodedMessage[]) => number
  inbox: Map<string, any>
  addInbox: (key: string, value: any) => void
  hasNewInboxMessage: boolean
  setHasNewInboxMessage: (ok: boolean) => void
  reset: () => void
}

export const useAppStore = create<AppState>((set) => ({
  alchemyClient: undefined,
  setAlchemyClient: (alchemyClient: any) => set(() => ({alchemyClient})),
  primaryProfile: undefined,
  setPrimaryProfile: (primaryProfile) => set(() => ({primaryProfile})),
  timIsReady: false,
  setTimIsReady: (timIsReady) => set(() => ({timIsReady})),
  timClient: undefined,
  setTimClient: (timClient: any) => set(() => ({timClient})),
  timConversations: new Map(),
  setTimConversations: (timConversations: Map<string, any>) => set(() => ({timConversations})),
  litClient: undefined,
  setLitClient: (litClient) => set(() => ({litClient})),
  xmtpClient: undefined,
  setXmtpClient: (xmtpClient: Client | undefined | null) => set(() => ({xmtpClient})),
  conversations: new Map(),
  setConversations: (conversations: Map<string, Conversation>) => set(() => ({conversations})),
  loadingConversations: false,
  setLoadingConversations: (loadingConversations: boolean) => set(() => ({loadingConversations})),
  timConvoMessages: new Map<string, Message[]>(),
  addTimMessages: (key: string, newMessages: Message[]) => {
    let numAdded = 0
    set((state) => {
      const timConvoMessages = new Map(state.timConvoMessages)
      const existing = state.timConvoMessages.get(key) || []
      const updated = getUniqueMessagesV2([...existing, ...newMessages])
      numAdded = updated.length - existing.length
      if (!numAdded) {
        return {timConvoMessages: state.timConvoMessages}
      }
      timConvoMessages.set(key, updated)
      return {timConvoMessages}
    })
    return numAdded
  },
  convoMessages: new Map(),
  previewMessages: new Map(),
  setPreviewMessage: (key: string, message: DecodedMessage) =>
    set((state) => {
      const newPreviewMessages = new Map(state.previewMessages)
      newPreviewMessages.set(key, message)
      return {previewMessages: newPreviewMessages}
    }),
  setPreviewMessages: (previewMessages) => set(() => ({previewMessages})),
  addMessages: (key: string, newMessages: DecodedMessage[]) => {
    let numAdded = 0
    set((state) => {
      const convoMessages = new Map(state.convoMessages)
      const existing = state.convoMessages.get(key) || []
      const updated = getUniqueMessages([...existing, ...newMessages])
      numAdded = updated.length - existing.length
      // If nothing has been added, return the old item to avoid unnecessary refresh
      if (!numAdded) {
        return {convoMessages: state.convoMessages}
      }
      convoMessages.set(key, updated)
      return {convoMessages}
    })
    return numAdded
  },
  inbox: new Map<string, any>(),
  addInbox: (key: string, value: any) => {
    set((state) => {
      const newInbox = new Map(state.inbox)
      newInbox.set(key, value)
      return {inbox: newInbox, hasNewInboxMessage: true}
    })
  },
  hasNewInboxMessage: false,
  setHasNewInboxMessage: (ok: boolean) => {
    set((state) => {
      return {hasNewInboxMessage: ok}
    })
  },
  reset: () =>
    set(() => {
      return {
        xmtpClient: undefined,
        conversations: new Map(),
        convoMessages: new Map(),
        previewMessages: new Map(),
      }
    }),
}))

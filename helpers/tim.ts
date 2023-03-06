import {Message} from 'tim-js-sdk'

export const getUniqueMessagesV2 = (msgObj: Message[]): Message[] => {
  const uniqueMessages = [...Array.from(new Map(msgObj.map((item) => [item['ID'], item])).values())]
  uniqueMessages.sort((a, b) => {
    return (b.time ?? 0) - (a.time ?? 0)
  })

  return uniqueMessages ?? []
}

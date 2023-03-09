import {Spinner} from './style'
import React, {useState} from 'react'
import {toast} from 'react-hot-toast'
import {useAppStore} from '../store/app'
import {useRouter} from 'next/router'

export const JoinButton = ({chatId}: {chatId: string}) => {
  const router = useRouter()
  const [doing, setDoing] = useState(false)
  const timClient = useAppStore((state) => state.timClient)
  const onJoin = async () => {
    setDoing(true)
    const res = await timClient.joinGroup({
      groupID: chatId,
    })
    console.log(res)
    if (res?.code === 0) {
      toast.success('Join group successfully')
      router.push(`/group/GROUP${chatId}`)
      window.location.reload()
    }
    setDoing(false)
  }
  return (
    <button className={'btn-primary'} onClick={onJoin} disabled={doing}>
      {doing && <Spinner />}
      Join
    </button>
  )
}

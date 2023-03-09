import {UserGroupIcon} from '@heroicons/react/24/outline'
import React from 'react'

export const SubscriberGroupAvatar = () => {
  return (
    <div className={'w-[48px] h-[48px] rounded-lg bg-rose-400 flex items-center justify-center'}>
      <UserGroupIcon className={'h-6 w-6 text-white'} />
    </div>
  )
}

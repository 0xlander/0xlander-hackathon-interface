import {useState} from 'react'
import {useInterval} from './profile'
import {useAccount} from 'wagmi'
import {CC_ACCESS_TOKEN_KEY} from '../config/key'

export const useIsLogged = () => {
  const [isLogged, setIsLogged] = useState(false)
  const [checked, setChecked] = useState(false)

  useInterval(
    () => {
      const token = localStorage.getItem(CC_ACCESS_TOKEN_KEY)
      setIsLogged(Boolean(token))
      setChecked(true)
    },
    2000,
    true
  )

  return {isLogged, isChecked: checked}
}

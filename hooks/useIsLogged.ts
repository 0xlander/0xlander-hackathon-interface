import {useEffect, useState} from 'react'
import {useInterval} from './profile'

export const useIsLogged = () => {
  const [isLogged, setIsLogged] = useState(false)

  useInterval(
    () => {
      const token = localStorage.getItem('accessToken')
      setIsLogged(Boolean(token))
    },
    2000,
    true
  )

  return isLogged
}

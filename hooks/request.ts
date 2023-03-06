import {useCallback} from 'react'

export const usePost = () => {
  return useCallback((url: string, body: string) => {
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    })
      .then((res) => res.json())
      .then((value) => {
        return value
      })
  }, [])
}

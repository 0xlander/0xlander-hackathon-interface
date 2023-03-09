import {useQuery} from '@apollo/client'
import {PRIMARY_PROFILE_POSTS} from '../graphql/PrimaryProfilePosts'
import {useEffect} from 'react'

export const useSubscribe = (address: string | undefined) => {
  const {data: postsRes, loading} = useQuery(PRIMARY_PROFILE_POSTS, {
    variables: {
      address: address,
    },
  })

  const profile = postsRes?.address?.wallet?.primaryProfile

  return {
    profile: profile,
    posts: profile?.posts?.edges,
    postCount: profile?.postCount,
    subscriberCount: profile?.subscriberCount,
    loading,
  }
}

export const usePosts = (address: string | undefined) => {
  const {
    data: postsRes,
    loading,
    startPolling,
    stopPolling,
  } = useQuery(PRIMARY_PROFILE_POSTS, {
    variables: {
      address: address,
    },
  })

  useEffect(() => {
    startPolling(3000)
    return () => stopPolling()
  }, [])

  const profile = postsRes?.address?.wallet?.primaryProfile

  return {
    posts: profile?.posts?.edges,
    postCount: profile?.postCount,
    loading,
  }
}

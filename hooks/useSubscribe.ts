import {useQuery} from '@apollo/client'
import {PRIMARY_PROFILE_POSTS} from '../graphql/PrimaryProfilePosts'

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

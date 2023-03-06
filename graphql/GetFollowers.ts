import {gql} from '@apollo/client'

export const GET_FOLLOWERS = gql`
  query getFollowersByHandle($handle: String!, $me: AddressEVM!) {
    profileByHandle(handle: $handle) {
      followerCount
      isFollowedByMe(me: $me)
      followers {
        totalCount
        pageInfo {
          hasPreviousPage
          startCursor
          hasNextPage
        }
        edges {
          node {
            address {
              address
              wallet {
                primaryProfile {
                  handle
                }
              }
            }
          }
        }
      }
    }
  }
`

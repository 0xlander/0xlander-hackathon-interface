import {gql} from '@apollo/client'

export const GET_PROFILE_BY_ADDRESS = gql`
  query getFollowingsByAddressEVM($address: AddressEVM!, $me: AddressEVM!) {
    address(address: $address) {
      followingCount
      wallet {
        primaryProfile {
          handle
          profileID
          metadata
          avatar
          followerCount
          postCount
          commentCount
          isFollowedByMe(me: $me)
          isSubscribedByMe(me: $me)
        }
      }
    }
  }
`

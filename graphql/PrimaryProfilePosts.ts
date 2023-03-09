import {gql} from '@apollo/client'

export const PRIMARY_PROFILE_POSTS = gql`
  query PrimaryProfilePosts($address: AddressEVM!) {
    address(address: $address) {
      wallet {
        primaryProfile {
          id
          profileID
          handle
          avatar
          subscriberCount
          namespace {
            name
          }
          subscribeNFT
          subscribeMw {
            contractAddress
            type
            data
          }
          postCount
          posts {
            totalCount
            edges {
              node {
                ... on Post {
                  contentID
                  title
                  body
                  digest
                  arweaveTxHash
                  createdAt
                  updatedAt
                  likeCount
                  dislikeCount
                  title
                }
              }
            }
          }
        }
      }
    }
  }
`

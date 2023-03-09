import {gql} from '@apollo/client'

export const GET_POST_META = gql`
  query getPostMeta($id: String!, $me: AddressEVM!) {
    content(id: $id) {
      contentID
      commentCount
      likeCount
      likedStatus(me: $me) {
        liked
        disliked
      }
      comments {
        totalCount
        edges {
          node {
            ... on Comment {
              body
              digest
              arweaveTxHash
              createdAt
              updatedAt
              title
              authorAddress
              authorHandle
            }
          }
        }
      }
    }
  }
`

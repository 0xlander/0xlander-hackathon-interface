import {gql} from '@apollo/client'

export const GET_SUBSCRIBERS = gql`
query GetSubscribers($address: AddressEVM!) {
    address(address: $address) {
      wallet {
        primaryProfile {
          id
          profileID
          handle
          avatar
          subscriberCount
          subscribers {
            totalCount
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
            edges {
              cursor
              node {
                wallet {
                    address
                    primaryProfile {
                        handle
                        owner {
                          address
                        }
                      }
                }
                profile {
                  owner {
                    address
                  }
                  avatar
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

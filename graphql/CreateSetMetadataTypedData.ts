import {gql} from '@apollo/client'

export const CREATE_SET_METADATA_TYPED_DATA = gql`
  mutation createSetMetadataTypedData($input: CreateSetMetadataTypedDataInput!) {
    createSetMetadataTypedData(input: $input) {
      typedData {
        id
        data
        sender
      }
    }
  }
`

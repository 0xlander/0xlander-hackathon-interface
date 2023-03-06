// @ts-ignore
import LitJsSdk from '@lit-protocol/sdk-browser'

export const encryptWithLit = async (profileId: number, data: any) => {
  const client = new LitJsSdk.LitNodeClient()
  await client.connect()
  const chain = 'bscTestnet'

  const onlySubscriberCondition = [
    {
      conditionType: 'evmContract',
      permanent: false,
      contractAddress: '0x0561d367868B2d8E405B1241Ba568C40aB8fD2c8',
      functionName: 'isSubscribedByMe',
      functionParams: [String(profileId), ':userAddress'],
      functionAbi: {
        inputs: [
          {
            internalType: 'uint256',
            name: 'profileId',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'me',
            type: 'address',
          },
        ],
        name: 'isSubscribedByMe',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      chain: chain,
      returnValueTest: {
        key: '',
        comparator: '=',
        value: 'true',
      },
    },
  ]

  const authSig = await LitJsSdk.checkAndSignAuthMessage({
    chain: chain,
  })
  const {encryptedString, symmetricKey} = await LitJsSdk.encryptString(data)

  const encryptedSymmetricKey = await client?.saveEncryptionKey({
    accessControlConditions: onlySubscriberCondition,
    symmetricKey,
    authSig,
    chain: chain,
  })

  return {
    encryptedString,
    encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, 'base16'),
  }
}

export const nftHolderEncryptWithLit = async (litClient: any, contractAddress: string, data: any) => {
  const chain = 'bscTestnet'

  const accessControlConditions = [
    {
      standardContractType: 'ERC721',
      contractAddress: contractAddress,
      method: 'balanceOf',
      parameters: [':userAddress'],
      chain: chain,
      returnValueTest: {
        comparator: '>',
        value: '0',
      },
    },
  ]

  const authSig = await LitJsSdk.checkAndSignAuthMessage({
    chain: chain,
  })
  const {encryptedString, symmetricKey} = await LitJsSdk.encryptString(data)

  const encryptedSymmetricKey = await litClient?.saveEncryptionKey({
    accessControlConditions,
    symmetricKey,
    authSig,
    chain: chain,
  })

  return {
    encryptedString,
    encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, 'base16'),
  }
}

export const getNftHolderDecryptKey = async (
  litClient: any,
  encryptedSymmetricKey: string,
  contractAddress: string
) => {
  const chain = 'bscTestnet'
  const authSig = await LitJsSdk.checkAndSignAuthMessage({chain: chain})

  const accessControlConditions = [
    {
      standardContractType: 'ERC721',
      contractAddress: contractAddress,
      method: 'balanceOf',
      parameters: [':userAddress'],
      chain: chain,
      returnValueTest: {
        comparator: '>',
        value: '0',
      },
    },
  ]
  return await litClient.getEncryptionKey({
    accessControlConditions,
    toDecrypt: encryptedSymmetricKey,
    chain: chain,
    authSig,
  })
}
export const nftHolderDecryptWithLit = async (
  litClient: any,
  encryptedSymmetricKey: string,
  encryptedString: Blob,
  contractAddress: string
) => {
  const symmetricKey = await getNftHolderDecryptKey(litClient, encryptedSymmetricKey, contractAddress)

  return await LitJsSdk.decryptString(encryptedString, symmetricKey)
}

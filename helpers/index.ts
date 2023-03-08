export const pinFileToIPFS = async (file: any) => {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`

  let data = new FormData()
  data.append('file', file)

  //pinataOptions are optional
  const pinataOptions = JSON.stringify({
    cidVersion: 1,
    customPinPolicy: {
      regions: [
        {
          id: 'FRA1',
          desiredReplicationCount: 1,
        },
        {
          id: 'NYC1',
          desiredReplicationCount: 2,
        },
      ],
    },
  })
  const metadata = JSON.stringify({
    name: 'Subscribe content',
  })
  // data.append('pinataMetadata', metadata)
  // data.append('pinataOptions', pinataOptions)

  return fetch(url, {
    method: 'POST',
    body: data,
    headers: {
      Authorization:
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI1NGU3YzkzZC1kN2I4LTQ2NjYtOGQ0Yi1mNzQzY2M4MGNkNTciLCJlbWFpbCI6ImNhaWNoYW8ueHVAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siaWQiOiJOWUMxIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjU1MmE4M2IxZmJmZjQzYWY1MzZhIiwic2NvcGVkS2V5U2VjcmV0IjoiNjYxOTg4MTRjYTZjZmJjNzZlMDZlZDEyZmM5ZWQxYzEwZDM1MjRiZWNhMjc0YTA2OTE2Zjk3NTE1ZTM5OTBlMiIsImlhdCI6MTY3MDg0Nzk5NH0.C8TNhbFV-GzkExEuPYJxP-x8bxo6VBInFMdMUT4B-5Y',
    },
  })
    .then((res) => res.json())
    .then(function (response: any) {
      if (response?.IpfsHash) {
        return response?.IpfsHash
      }
      throw new Error(JSON.stringify(response))
    })
    .catch((error) => {
      throw error
    })
}

export const pinJSONToIPFS = async (json: {[key: string]: any}) => {
  const data = JSON.stringify(json)
  const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'

  return fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization:
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI1NGU3YzkzZC1kN2I4LTQ2NjYtOGQ0Yi1mNzQzY2M4MGNkNTciLCJlbWFpbCI6ImNhaWNoYW8ueHVAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siaWQiOiJOWUMxIiwiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjF9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjU1MmE4M2IxZmJmZjQzYWY1MzZhIiwic2NvcGVkS2V5U2VjcmV0IjoiNjYxOTg4MTRjYTZjZmJjNzZlMDZlZDEyZmM5ZWQxYzEwZDM1MjRiZWNhMjc0YTA2OTE2Zjk3NTE1ZTM5OTBlMiIsImlhdCI6MTY3MDg0Nzk5NH0.C8TNhbFV-GzkExEuPYJxP-x8bxo6VBInFMdMUT4B-5Y',
    },
    method: 'POST',
    body: JSON.stringify({
      pinataContent: json,
    }),
  })
    .then((res) => res.json())
    .then((response: any) => {
      return response?.IpfsHash
    })
    .catch((error) => {
      throw error
    })
}

export const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay))

export function blobToHex(blob: Blob) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader()
    fileReader.onload = () => {
      const arrayBuffer: ArrayBuffer = fileReader.result as ArrayBuffer
      const uint8Array = new Uint8Array(arrayBuffer)
      const hexString = uint8Array.reduce((acc, i) => acc + ('0' + i.toString(16)).slice(-2), '')
      resolve(hexString)
    }
    fileReader.onerror = () => {
      reject(new Error('Failed to convert Blob to HEX string.'))
    }
    fileReader.readAsArrayBuffer(blob)
  })
}
export function hexToBlob(hexString: string, mimeType: string) {
  if (!hexString) return
  // @ts-ignore
  const bytes = new Uint8Array(hexString?.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))
  return new Blob([bytes], {type: mimeType})
}

export function arrayBufferToHex(arrayBuffer: ArrayBuffer) {
  const byteArray = new Uint8Array(arrayBuffer)
  const hexString = Array.from(byteArray)
    .map((byte) => ('0' + byte.toString(16)).slice(-2))
    .join('')
  return hexString
}

export function hexToArrayBuffer(hexString: string) {
  const length = hexString.length / 2
  const arrayBuffer = new ArrayBuffer(length)
  const byteArray = new Uint8Array(arrayBuffer)
  for (let i = 0; i < length; i++) {
    byteArray[i] = parseInt(hexString.substr(i * 2, 2), 16)
  }
  return arrayBuffer
}

export function isJsonString(str: string) {
  try {
    JSON.parse(str)
  } catch (e) {
    return false
  }
  return true
}

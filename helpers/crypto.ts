import {hexToArrayBuffer} from './index'
import {str2ab} from './convertor'

export const generateAesKey = async () => {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-CBC',
      length: 128,
    },
    true,
    ['encrypt', 'decrypt'] // key usages
  )
}

export const exportAesKey = async (key: CryptoKey) => {
  return await crypto.subtle.exportKey('raw', key)
}

export const importAesKey = async (rawKey: ArrayBuffer) => {
  return await crypto.subtle.importKey('raw', rawKey, 'AES-CBC', false, ['encrypt', 'decrypt'])
}

export const aesEncrypt = async (iv: ArrayBuffer, key: CryptoKey, content: string) => {
  return await crypto.subtle.encrypt(
    {
      name: 'AES-CBC',
      iv,
      length: 128,
    },
    key,
    str2ab(content)
  )
}

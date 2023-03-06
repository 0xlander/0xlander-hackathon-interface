import LogoImage from '../assets/images/logo.png'
import BannerImage from '../assets/images/banner.png'

export const getImage = (name: string) => {
  switch (name) {
    case 'logo':
      return LogoImage.src
    case 'banner':
      return BannerImage.src
    default:
      return LogoImage.src
  }
}

export const handleCors = (uri: string) => {
  return `https://0xlander-api-4ever9-0xlander.vercel.app/api/proxy?url=${uri}`
}
export const handleUri = (uri: string) => {
  if (!uri) return
  if (uri.includes('ipfs://')) {
    return handleIpfsUri(uri)
  }

  return uri
}
export const handleIpfsUri = (uri: string) => {
  if (!uri) return
  return 'https://gateway.pinata.cloud/ipfs/' + uri.replace('ipfs://', '')
  // return 'https://0xlander.infura-ipfs.io/ipfs/' + uri.replace('ipfs://', '')
  // return 'https://ipfs.cyberconnect.dev/ipfs/' + uri.replace('ipfs://', '')
}

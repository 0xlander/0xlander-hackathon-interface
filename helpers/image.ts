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

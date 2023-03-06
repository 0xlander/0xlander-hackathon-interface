const CC_PROD_HOST = 'https://api.cyberconnect.dev'
const CC_DEV_HOST = 'https://api.cyberconnect.dev/testnet/'

export const getHost = () => {
  return CC_DEV_HOST
  // return CC_PROD_HOST
}

export const getAPIHost = () => {
  return 'https://0xlander-4n3nf7ulb-0xlander.vercel.app/api'
}

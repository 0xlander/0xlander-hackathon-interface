import '../styles/globals.css'
import type {AppProps} from 'next/app'
import '@rainbow-me/rainbowkit/styles.css'
import {configureChains, createClient, WagmiConfig} from 'wagmi'
import {publicProvider} from 'wagmi/providers/public'
import {getDefaultWallets, lightTheme, RainbowKitProvider} from '@rainbow-me/rainbowkit'
import {Toaster} from 'react-hot-toast'
import {NftProvider} from 'use-nft'
import {getDefaultProvider} from 'ethers'
import {Network} from '@ethersproject/networks'
import {CHAINS} from '../config/chain'

export const mumbai: Network = {
  name: 'mumbai',
  chainId: 80001,
  _defaultProvider: (providers) => new providers.JsonRpcProvider('https://rpc-mumbai.maticvigil.com'),
}

const {chains, provider} = configureChains(CHAINS, [publicProvider()])

const {connectors} = getDefaultWallets({
  appName: '0xstarter',
  chains,
})

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
})

const ethersConfig = {
  provider: getDefaultProvider(mumbai),
}

export default function App({Component, pageProps}: AppProps) {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains} theme={lightTheme()} showRecentTransactions={true}>
        <NftProvider fetcher={['ethers', ethersConfig]}>
          <Toaster />
          <Component {...pageProps} />
        </NftProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  )
}

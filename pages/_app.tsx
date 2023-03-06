import '../styles/globals.css'
import type {AppProps} from 'next/app'
import '@rainbow-me/rainbowkit/styles.css'
import {configureChains, createClient, WagmiConfig} from 'wagmi'
import {getDefaultWallets, lightTheme, RainbowKitProvider} from '@rainbow-me/rainbowkit'
import {Toaster} from 'react-hot-toast'
import {CHAINS} from '../config/chain'
import {ApolloProvider} from '@apollo/client'
import {apolloClient} from '../apollo'
import {jsonRpcProvider} from 'wagmi/providers/jsonRpc'
import {Initializer} from '../components/initializer'
import '@notifi-network/notifi-react-card/dist/index.css'
import {NotifiInputFieldsText, NotifiInputSeparators} from '@notifi-network/notifi-react-card'

// const {chains, provider} = configureChains(CHAINS, [alchemyProvider({apiKey: 'x0IqOekv_eQ-ru9cQExzB1nQVrNwap8t'})])

const {chains, provider} = configureChains(CHAINS, [
  // alchemyProvider({apiKey: 'x0IqOekv_eQ-ru9cQExzB1nQVrNwap8t'}),
  // infuraProvider({apiKey: 'f064dd62c6b646a788786d0dfb59623a'}),
  // publicProvider(),
  jsonRpcProvider({
    rpc: (chain) => ({
      http: `https://rpc.ankr.com/bsc_testnet_chapel/0cb241c8dd80dfa18209f99f12582029a5fd2415371ae2b5a277cd3c8c637c1e`,
    }),
  }),
])

const {connectors} = getDefaultWallets({
  appName: '0xLander',
  chains,
})

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
})

export default function App({Component, pageProps}: AppProps) {
  return (
    <ApolloProvider client={apolloClient}>
      <WagmiConfig client={wagmiClient}>
        <RainbowKitProvider chains={chains} theme={lightTheme()} showRecentTransactions={true}>
          <Initializer>
            <Toaster />
            <Component {...pageProps} />
          </Initializer>
        </RainbowKitProvider>
      </WagmiConfig>
    </ApolloProvider>
  )
}

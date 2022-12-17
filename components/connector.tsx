import {ConnectButton} from '@rainbow-me/rainbowkit'

export const Connector = () => {
  return (
    <ConnectButton.Custom>
      {({account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted}) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== 'loading'
        const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated')

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button onClick={openConnectModal} className={'btn-primary'}>
                    Connect Wallet
                  </button>
                )
              }

              if (chain.unsupported) {
                return (
                  <button onClick={openChainModal} type='button' className={'btn-primary'}>
                    Wrong network
                  </button>
                )
              }

              return (
                <>
                  <button onClick={openAccountModal} className={'btn'}>
                    {account.displayName}
                  </button>
                </>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}

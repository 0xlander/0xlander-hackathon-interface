import {ReactNode} from 'react'
import {Header} from './header'

export const Layout = ({children}: {children: ReactNode}) => {
  return (
    <div className={'min-h-screen'}>
      <Header />
      <div className={'pt-14'}>{children}</div>
    </div>
  )
}

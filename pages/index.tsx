import {Layout} from '../components/layout'
import {useEssence} from '../hooks/useEssence'
import {InboxIcon} from '@heroicons/react/24/solid'

export default function Home() {
  const {data: essences} = useEssence()
  console.log(essences)

  return (
    <Layout>
      <div className='flex'>
        <div className={'w-[400px] border-r border-r-gray-200 ml-[88px] h-screen pt-8 px-8'}>
          <div className='text-lg font-medium mb-8'>Conversations</div>
          <div className={'p- flex items-start gap-4 cursor-pointer'}>
            <div className={'w-[50px] h-[50px] bg-blue-500 rounded-lg flex items-center justify-center'}>
              <InboxIcon className={'h-6 w-6 text-white'} />
            </div>
            <div>
              <div className='text-base font-medium'>Subscribes</div>
              <div className={'text-sm text-gray-400'}>You haven`t created any badges yet.</div>
            </div>
          </div>
        </div>
        <div>2</div>
      </div>
    </Layout>
  )
}

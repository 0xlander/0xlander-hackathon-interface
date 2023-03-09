import {Dialog, Transition} from '@headlessui/react'
import {Fragment, ReactNode} from 'react'

export const Modal = ({open, onClose, content}: {open: boolean; onClose: any; content: ReactNode}) => {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as='div' className='relative z-10' onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-black bg-opacity-70' />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4 text-center'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <Dialog.Panel className='w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-10 text-left align-middle shadow-xl transition-all'>
                {content}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
export function classNames(...classes: (string | null)[]) {
  return classes.filter(Boolean).join(' ')
}
export const Spinner = ({className}: {className?: string}) => {
  return (
    <svg
      fill={'none'}
      className={classNames(className ?? 'text-primary', 'animate-spin h-5 w-5 -ml-1 mr-3')}
      viewBox='0 0 24 24'
    >
      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
      <path
        className='opacity-75'
        fill='currentColor'
        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
      />
    </svg>
  )
}

type StyledLoaderProps = {
  headingText?: string
  subHeadingText: string
  isLoading: boolean
}

export const Loader = ({headingText, subHeadingText, isLoading}: StyledLoaderProps): JSX.Element => (
  <div className='grid place-items-center h-full mt-2'>
    <div className='columns-1 text-center'>
      <Spinner />
      {headingText && <div className='text-xl md:text-lg text-n-200 md:text-n-300 font-bold'>{headingText}</div>}
      <div className='text-lx md:text-md text-n-200 font-normal'>{subHeadingText}</div>
    </div>
  </div>
)

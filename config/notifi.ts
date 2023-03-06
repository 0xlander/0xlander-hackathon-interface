import {NotifiInputFieldsText, NotifiInputSeparators} from '@notifi-network/notifi-react-card'

export const inputLabels: NotifiInputFieldsText = {
  label: {
    email: 'Email',
    // sms: 'Text Message',
    // telegram: 'Telegram',
  },
  placeholderText: {
    email: 'Email',
  },
}

export const inputSeparators: NotifiInputSeparators = {
  // smsSeparator: {
  //   content: 'OR',
  // },
  emailSeparator: {
    content: 'OR',
  },
}

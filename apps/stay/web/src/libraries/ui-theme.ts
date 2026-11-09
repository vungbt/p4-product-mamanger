import { defineTheme } from '@itclabs/react-ui';
import {
  ArrowLeftIcon,
  BellIcon,
  BoltIcon,
  BuildingIcon,
  ChartIcon,
  ClipboardTextIcon,
  CreditCardIcon,
  HomeIcon,
  KeyIcon,
  LogoutIcon,
  MailIcon,
  MenuIcon,
  MessagesIcon,
  MoneyTimeIcon,
  ReceiptIcon,
  SettingsIcon,
  SignalOffIcon,
  UsersIcon,
} from '@itclabs/react-ui/icons/outline';

// Register only the glyphs Stay uses, keeping the full catalog out of the bundle.
export const uiTheme = defineTheme({
  icons: {
    overrides: {
      arrowLeft: ArrowLeftIcon,
      bell: BellIcon,
      bolt: BoltIcon,
      building: BuildingIcon,
      chart: ChartIcon,
      clipboardText: ClipboardTextIcon,
      creditCard: CreditCardIcon,
      home: HomeIcon,
      key: KeyIcon,
      logout: LogoutIcon,
      mail: MailIcon,
      menu: MenuIcon,
      messages: MessagesIcon,
      moneyTime: MoneyTimeIcon,
      receipt: ReceiptIcon,
      settings: SettingsIcon,
      signalOff: SignalOffIcon,
      users: UsersIcon,
    },
  },
});

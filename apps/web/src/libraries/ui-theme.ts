import { defineTheme } from '@itclabs/react-ui';
import {
  ArrowRightIcon,
  BellIcon,
  BriefcaseIcon,
  ChartIcon,
  ChevronDownIcon,
  GridIcon,
  HomeIcon,
  KeyIcon,
  LogoutIcon,
  MailIcon,
  MoonIcon,
  PhoneIcon,
  ReceiptSearchIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
  StoreIcon,
  SunIcon,
} from '@itclabs/react-ui/icons/outline';

// Register only the glyphs P4 uses, keeping the full catalog out of the bundle.
export const uiTheme = defineTheme({
  icons: {
    overrides: {
      sun: SunIcon,
      moon: MoonIcon,
      store: StoreIcon,
      phone: PhoneIcon,
      shieldCheck: ShieldCheckIcon,
      briefcase: BriefcaseIcon,
      receiptSearch: ReceiptSearchIcon,
      chart: ChartIcon,
      grid: GridIcon,
      home: HomeIcon,
      key: KeyIcon,
      bell: BellIcon,
      mail: MailIcon,
      chevronDown: ChevronDownIcon,
      arrowRight: ArrowRightIcon,
      settings: SettingsIcon,
      logout: LogoutIcon,
      search: SearchIcon,
    },
  },
});

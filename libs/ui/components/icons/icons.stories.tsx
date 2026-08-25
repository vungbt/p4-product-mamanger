import type { Meta, StoryObj } from '@storybook/react-vite';
import { type IconName, RenderIcon } from './index';

// Kept in sync manually with the `iconMap` in `./index.tsx` — this gallery exists so a reviewer
// can spot a missing/renamed icon at a glance instead of grepping the map.
const ICON_NAMES: IconName[] = [
  'home',
  'add',
  'briefcase',
  'graph',
  'frame',
  'receipt-search',
  'arrow-up-tray',
  'loading',
  'magnifying-glass',
  'envelope',
  'key',
  'phone',
  'check-circle',
  'eye',
  'eye-slash',
  'check',
  'minus',
  'trash',
  'exclamation-triangle',
  'exclamation-circle',
  'x-mark',
  'x-circle',
  'chevron-down',
  'chevron-double-left',
  'chevron-double-right',
  'cloud-arrow-up',
  'user',
  'calendar',
  'calendar-days',
  'calendar-date-range',
  'clock',
  'undo',
  'redo',
  'bold',
  'italic',
  'underline',
  'strikethrough',
  'code',
  'link',
  'link-off',
  'h1',
  'h2',
  'paragraph',
  'list',
  'list-ordered',
  'left',
  'center',
  'right',
  'justify',
  'menu',
  'search',
  'eraser',
  'image',
  'video',
  'quote',
  'pencil',
  'pencil-square',
  'user-group',
  'users',
  'building-storefront',
  'collapse-left',
  'collapse-right',
  'bell',
  'adjustments-vertical',
  'ellipsis-vertical',
  'plus',
  'information-circle',
  'arrow-down-tray',
  'printer',
  'trophy',
  'handshake',
  'landmark',
  'package',
  'settings',
  'shield-check',
  'arrow-right',
  'shopping-cart',
  'log-out',
];

function IconGallery() {
  return (
    <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-8">
      {ICON_NAMES.map((name) => (
        <div
          key={name}
          className="flex flex-col items-center gap-2 rounded-lg border border-neutral-border p-3"
        >
          <RenderIcon name={name} className="!h-6 !w-6 text-neutral-text-primary" />
          <span className="break-all text-center text-[10px] text-neutral-text-secondary">
            {name}
          </span>
        </div>
      ))}
    </div>
  );
}

const meta = {
  title: 'Components/Icons',
  component: IconGallery,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'All icon aliases exposed by `RenderIcon`/`IconName` (backed by `lucide-react`). If a component needs a new icon, add it to `iconMap` in `components/icons/index.tsx` first, then reference it here.',
      },
    },
  },
} satisfies Meta<typeof IconGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {};

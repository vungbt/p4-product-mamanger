import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Switch } from './index';

const COLORS = ['primary', 'secondary', 'success', 'error', 'pending', 'neutral'] as const;
const SIZES = ['small', 'middle', 'large'] as const;

const meta = {
  title: 'Components/Switch',
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'select', options: COLORS },
    size: { control: 'select', options: SIZES },
    labelPlacement: { control: 'select', options: ['left', 'right'] },
  },
  args: {
    color: 'primary',
    size: 'middle',
    label: 'Enable notifications',
    labelPlacement: 'right',
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Render(args) {
    const [checked, setChecked] = useState(false);
    return <Switch {...args} checked={checked} onChange={(e) => setChecked(e.target.checked)} />;
  },
};

export const Controlled: Story = {
  render: function Render() {
    const [checked, setChecked] = useState(true);
    return (
      <div className="flex flex-col gap-4">
        <Switch
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          label={checked ? 'Bật' : 'Tắt'}
        />
        <p className="text-13 text-neutral-text-secondary">
          State: <strong>{checked ? 'ON' : 'OFF'}</strong>
        </p>
      </div>
    );
  },
};

export const Uncontrolled: Story = {
  args: { defaultChecked: true, label: 'Default checked (uncontrolled)' },
  render: (args) => <Switch {...args} checked={undefined} />,
};

export const AllSizes: Story = {
  render: function Render() {
    const [values, setValues] = useState({ small: true, middle: false, large: true });
    return (
      <div className="flex flex-col gap-4">
        {SIZES.map((size) => (
          <Switch
            key={size}
            size={size}
            checked={values[size]}
            onChange={(e) => setValues((prev) => ({ ...prev, [size]: e.target.checked }))}
            label={`${size} — ${values[size] ? 'ON' : 'OFF'}`}
          />
        ))}
      </div>
    );
  },
};

export const AllColors: Story = {
  render: function Render() {
    return (
      <div className="flex flex-col gap-3">
        {COLORS.map((color) => (
          <Switch key={color} color={color} defaultChecked label={color} />
        ))}
      </div>
    );
  },
};

export const LabelLeft: Story = {
  render: function Render() {
    const [checked, setChecked] = useState(false);
    return (
      <Switch
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        label="Dark mode"
        labelPlacement="left"
      />
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Switch disabled checked={false} label="Disabled OFF" />
      <Switch disabled checked={true} label="Disabled ON" />
    </div>
  ),
};

export const FormExample: Story = {
  render: function Render() {
    const [settings, setSettings] = useState({
      notifications: true,
      marketing: false,
      darkMode: false,
    });

    const toggle = (key: keyof typeof settings) => () =>
      setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

    return (
      <div className="w-80 rounded-xl border border-neutral-border p-5">
        <h3 className="mb-4 text-title-2 font-bold">Cài đặt</h3>
        <div className="flex flex-col gap-4">
          <Switch
            checked={settings.notifications}
            onChange={toggle('notifications')}
            label="Thông báo đẩy"
          />
          <Switch
            checked={settings.marketing}
            onChange={toggle('marketing')}
            label="Email marketing"
            color="success"
          />
          <Switch
            checked={settings.darkMode}
            onChange={toggle('darkMode')}
            label="Dark mode"
            color="secondary"
          />
        </div>
      </div>
    );
  },
};

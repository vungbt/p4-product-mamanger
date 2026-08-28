import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../../components/button';
import { Checkbox } from '../../components/checkbox';
import { Input } from '../../components/input';
import { InputPassword } from '../../components/input-password';
import { Textarea } from '../../components/textarea';
import { DatePicker } from '../datepicker/datepicker';
import { type DateRange, DateRangePicker } from '../daterangepicker/daterangepicker';
import { RadioGroup } from '../radio-group';
import { Select, type SelectOption } from '../select/select';
import { TimePicker } from '../timepicker/timepicker';
import { Form, useAppForm, z } from './form';
import { FormField } from './form-field';

function LoginFormDemo() {
  const form = useAppForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      // eslint-disable-next-line no-console
      console.log('submit', value);
    },
  });

  const schema = {
    email: z.string().email('Email is invalid'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  };

  return (
    <Form form={form} schema={schema} className="w-80 space-y-4">
      <FormField name="email" label="Email" required>
        <Input type="email" icon="envelope" placeholder="you@example.com" />
      </FormField>

      <FormField name="password" label="Password" required>
        <InputPassword icon="key" placeholder="••••••••" />
      </FormField>

      <Button type="submit" className="w-full">
        Sign in
      </Button>
    </Form>
  );
}

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'keyboard', label: 'Bàn phím' },
  { value: 'headphone', label: 'Tai nghe' },
  { value: 'ssd', label: 'SSD' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Thấp' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'high', label: 'Cao' },
];

// Demo/verify: every field type available in the lib (Input, Textarea, Checkbox, RadioGroup, Select,
// DatePicker, DateRangePicker, TimePicker) can bind through `FormField` — but not every field
// accepts a plain value/standard ChangeEvent like `Input` does, so this notes which fields need
// `mapValue`/`mapOnChange` to bridge, and which can be used directly.
function AllFieldTypesDemo() {
  const form = useAppForm({
    defaultValues: {
      name: '',
      bio: '',
      category: '',
      priority: 'medium',
      agree: false,
      birthday: null as Date | null,
      workRange: null as DateRange | null,
      meetingTime: null as string | null,
    },
    onSubmit: async ({ value }) => {
      // eslint-disable-next-line no-console
      console.log('submit', value);
    },
  });

  const schema = {
    name: z.string().min(1, 'Vui lòng nhập tên'),
    bio: z.string().max(200, 'Tối đa 200 ký tự'),
    category: z.string().min(1, 'Vui lòng chọn danh mục'),
    agree: z.literal(true, { message: 'Bạn cần đồng ý điều khoản' }),
    // No `.nullable()` — the default value is `null` (no date chosen yet); if null were always allowed
    // through, the field could never show an error even when left empty — `z.date()` correctly fails on null.
    birthday: z.date({ message: 'Vui lòng chọn ngày sinh' }),
    workRange: z
      .tuple([z.date().nullable(), z.date().nullable()])
      .nullable()
      .refine((r) => !!r?.[0] && !!r?.[1], 'Vui lòng chọn đủ khoảng ngày'),
  };

  return (
    <Form form={form} schema={schema} className="w-96 space-y-4">
      {/* Input — used directly, no mapValue/mapOnChange needed */}
      <FormField name="name" label="Tên" required>
        <Input placeholder="Nguyễn Văn A" />
      </FormField>

      {/* Textarea — also a standard ChangeEvent, used directly */}
      <FormField name="bio" label="Giới thiệu">
        <Textarea placeholder="Vài dòng giới thiệu…" rows={3} />
      </FormField>

      {/* Checkbox — value is boolean, FormField reads `checked` from the ChangeEvent itself, used directly */}
      <FormField name="agree" label="Điều khoản">
        <Checkbox label="Tôi đồng ý điều khoản sử dụng" />
      </FormField>

      {/* RadioGroup — onChange(value) returns a plain string, not a ChangeEvent, used directly */}
      <FormField name="priority" label="Độ ưu tiên">
        <RadioGroup options={PRIORITY_OPTIONS} />
      </FormField>

      {/*
        Select (react-select) — onChange returns the whole `{value,label}` object (or an array of
        objects if isMulti), not a scalar/ChangeEvent like other fields → `mapValue`
        (scalar in form state -> option object for display) and `mapOnChange` (the option object the
        user picked -> extract the scalar `.value` to store in form state) are REQUIRED. Forgetting
        either prop means the form stores the whole object instead of a string, and the `z.string()` schema will always fail.
      */}
      <FormField
        name="category"
        label="Danh mục"
        required
        mapValue={(value) => CATEGORY_OPTIONS.find((opt) => opt.value === value) ?? null}
        mapOnChange={(option) => (option as SelectOption | null)?.value ?? ''}
      >
        <Select options={CATEGORY_OPTIONS} placeholder="Chọn danh mục…" />
      </FormField>

      {/* DatePicker — onChange(date: Date|null) returns a plain Date, not a ChangeEvent, used directly.
          Renders its own error internally, so FormField doesn't draw FormErrorMessage a second time. */}
      <FormField name="birthday" label="Ngày sinh" required>
        <DatePicker />
      </FormField>

      {/* DateRangePicker — onChange(range: [Date|null, Date|null]) returns a plain tuple, used directly.
          Also renders its own error internally (a recent addition — it used to accept `error` but never
          displayed the error text, so the form would silently swallow the validation error). */}
      <FormField name="workRange" label="Thời gian làm việc" required>
        <DateRangePicker />
      </FormField>

      {/* TimePicker — onChange(time: string|null) returns a plain string, used directly. Has no validators
          so it isn't required — it's only here to show the last field can bind too. */}
      <FormField name="meetingTime" label="Giờ họp (tuỳ chọn)">
        <TimePicker />
      </FormField>

      <Button type="submit" className="w-full">
        Gửi
      </Button>
    </Form>
  );
}

const meta = {
  title: 'Modules/Form',
  component: LoginFormDemo,
  tags: ['autodocs'],
  parameters: {
    chromatic: { disableSnapshot: true },
    docs: {
      description: {
        component:
          '`Form` + `FormField` wire up `@tanstack/react-form` with our zod-based validators. `LoginExample` mirrors the real login form in `apps/web`. `AllFieldTypes` demonstrates every field component in the lib — Input/Textarea/Checkbox/RadioGroup/DatePicker/DateRangePicker/TimePicker bind directly, while `Select` (react-select) needs `mapValue`/`mapOnChange` since it exchanges option objects instead of scalars.',
      },
    },
  },
} satisfies Meta<typeof LoginFormDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoginExample: Story = {};

export const AllFieldTypes: Story = {
  render: () => <AllFieldTypesDemo />,
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../../components/button';
import { Checkbox } from '../../components/checkbox';
import { Input } from '../../components/input';
import { InputPassword } from '../../components/input-password';
import { QuantitySelector } from '../../components/quantity-selector';
import { Textarea } from '../../components/textarea';
import { DatePicker } from '../datepicker/datepicker';
import { type DateRange, DateRangePicker } from '../daterangepicker/daterangepicker';
import { Editor } from '../editor';
import { RadioGroup } from '../radio-group';
import { Select, type SelectOption } from '../select/select';
import { TimePicker } from '../timepicker/timepicker';
import { Form, useAppForm, v } from './form';
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
    email: v.pipe(v.string(), v.email('Email is invalid')),
    password: v.pipe(v.string(), v.minLength(6, 'Password must be at least 6 characters')),
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

function AllFieldTypesDemo() {
  const form = useAppForm({
    defaultValues: {
      name: '',
      bio: '',
      description: '',
      category: '',
      priority: 'medium',
      agree: false,
      birthday: null as Date | null,
      workRange: null as DateRange | null,
      meetingTime: null as string | null,
      quantity: 1,
    },
    onSubmit: async ({ value }) => {
      // eslint-disable-next-line no-console
      console.log('submit', value);
    },
  });

  const schema = {
    name: v.pipe(v.string(), v.minLength(1, 'Vui lòng nhập tên')),
    bio: v.pipe(v.string(), v.maxLength(200, 'Tối đa 200 ký tự')),
    description: v.pipe(v.string(), v.minLength(1, 'Vui lòng nhập mô tả chi tiết')),
    category: v.pipe(v.string(), v.minLength(1, 'Vui lòng chọn danh mục')),
    agree: v.pipe(
      v.boolean(),
      v.check((val) => val === true, 'Bạn cần đồng ý điều khoản'),
    ),
    birthday: v.pipe(
      v.nullable(v.date()),
      v.check((val) => val !== null, 'Vui lòng chọn ngày sinh'),
    ),
    workRange: v.pipe(
      v.nullable(v.tuple([v.nullable(v.date()), v.nullable(v.date())])),
      v.check((r) => !!r?.[0] && !!r?.[1], 'Vui lòng chọn đủ khoảng ngày'),
    ),
    quantity: v.number(),
  };

  return (
    <Form form={form} schema={schema} className="w-96 space-y-4">
      <FormField name="name" label="Tên" required>
        <Input placeholder="Nguyễn Văn A" />
      </FormField>

      <FormField name="bio" label="Giới thiệu">
        <Textarea placeholder="Vài dòng giới thiệu…" rows={3} />
      </FormField>

      <FormField name="description" label="Mô tả chi tiết" required>
        <Editor placeholder="Nhập mô tả chi tiết…" minHeight={140} />
      </FormField>

      <FormField name="agree" label="Điều khoản">
        <Checkbox label="Tôi đồng ý điều khoản sử dụng" />
      </FormField>

      <FormField name="priority" label="Độ ưu tiên">
        <RadioGroup options={PRIORITY_OPTIONS} />
      </FormField>

      <FormField
        name="category"
        label="Danh mục"
        required
        mapValue={(value) => CATEGORY_OPTIONS.find((opt) => opt.value === value) ?? null}
        mapOnChange={(option) => (option as SelectOption | null)?.value ?? ''}
      >
        <Select options={CATEGORY_OPTIONS} placeholder="Chọn danh mục…" />
      </FormField>

      <FormField name="birthday" label="Ngày sinh" required>
        <DatePicker />
      </FormField>

      <FormField name="workRange" label="Thời gian làm việc" required>
        <DateRangePicker />
      </FormField>

      <FormField name="meetingTime" label="Giờ họp (tuỳ chọn)">
        <TimePicker />
      </FormField>

      <FormField name="quantity" label="Số lượng">
        <QuantitySelector min={1} max={100} />
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
    docs: {
      description: {
        component:
          '`Form` + `FormField` wire up `@tanstack/react-form` with valibot validators. `LoginExample` mirrors the real login form in `apps/web`. `AllFieldTypes` demonstrates every field component in the lib.',
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

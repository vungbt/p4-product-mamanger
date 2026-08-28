import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Carousel } from './index';

const meta = {
  title: 'Components/Carousel',
  component: Carousel,
  tags: ['autodocs'],
  argTypes: {
    slidesPerView: { control: 'number' },
    gap: { control: 'number' },
    loop: { control: 'boolean' },
    showDots: { control: 'boolean' },
    showArrows: { control: 'boolean' },
    autoplay: { control: 'boolean' },
  },
  args: {
    slidesPerView: 3,
    gap: 16,
    loop: true,
    showDots: true,
    showArrows: true,
    autoplay: false,
    onSlideChange: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-[800px] mx-auto px-8 py-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const SampleSlide = ({ index, emoji }: { index: number; emoji: string }) => (
  <div className="bg-neutral-white border border-neutral-border rounded-xl p-4 flex flex-col gap-3">
    <div className="aspect-[4/3] bg-neutral-bg rounded-lg flex items-center justify-center text-[28px]">
      {emoji}
    </div>
    <div className="text-ui-body-strong">Product {index + 1}</div>
    <div className="text-15 font-extrabold text-primary">
      {(250000 + index * 150000).toLocaleString('vi-VN')} ₫
    </div>
  </div>
);

const SAMPLE_ITEMS = [
  { id: 'kb', emoji: '⌨' },
  { id: 'mouse', emoji: '🖱' },
  { id: 'headphone', emoji: '🎧' },
  { id: 'lamp', emoji: '💡' },
  { id: 'camera', emoji: '📷' },
  { id: 'mic', emoji: '🎙' },
  { id: 'ssd', emoji: '💾' },
  { id: 'speaker', emoji: '🔊' },
];

export const Playground: Story = {
  args: {
    children: SAMPLE_ITEMS.map((item, i) => (
      <SampleSlide key={item.id} index={i} emoji={item.emoji} />
    )),
  },
};

export const WithAutoplay: Story = {
  args: {
    autoplay: { delay: 3000 },
    loop: true,
    slidesPerView: 3,
    children: SAMPLE_ITEMS.map((item, i) => (
      <SampleSlide key={item.id} index={i} emoji={item.emoji} />
    )),
  },
};

export const SingleSlide: Story = {
  args: {
    slidesPerView: 1,
    showArrows: true,
    showDots: true,
    loop: true,
    children: SAMPLE_ITEMS.slice(0, 4).map((item, i) => (
      <div
        key={item.id}
        className="h-[200px] rounded-xl bg-primary-background border border-primary-border flex items-center justify-center"
      >
        <span className="text-[48px]">{item.emoji}</span>
      </div>
    )),
  },
};

export const FourPerView: Story = {
  args: {
    slidesPerView: 4,
    gap: 14,
    loop: false,
    showArrows: true,
    showDots: true,
    children: SAMPLE_ITEMS.map((item, i) => (
      <SampleSlide key={item.id} index={i} emoji={item.emoji} />
    )),
  },
};

export const NoArrows: Story = {
  args: {
    slidesPerView: 3,
    showArrows: false,
    showDots: true,
    autoplay: { delay: 3500 },
    loop: true,
    children: SAMPLE_ITEMS.slice(0, 5).map((item, i) => (
      <SampleSlide key={item.id} index={i} emoji={item.emoji} />
    )),
  },
};

export const NoDots: Story = {
  args: {
    slidesPerView: 2,
    showArrows: true,
    showDots: false,
    loop: true,
    gap: 20,
    children: SAMPLE_ITEMS.slice(0, 6).map((item, i) => (
      <SampleSlide key={item.id} index={i} emoji={item.emoji} />
    )),
  },
};

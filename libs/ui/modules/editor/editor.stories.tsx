import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Editor, type EditorLabels, type EditorProps } from './index';
import { EditorViewer } from './viewer';

const VIETNAMESE_LABELS: EditorLabels = {
  headingOne: 'Tiêu đề 1',
  headingTwo: 'Tiêu đề 2',
  paragraph: 'Đoạn văn',
  bold: 'In đậm',
  italic: 'In nghiêng',
  underline: 'Gạch chân',
  strikethrough: 'Gạch ngang',
  code: 'Code',
  alignLeft: 'Căn trái',
  alignCenter: 'Căn giữa',
  alignRight: 'Căn phải',
  alignJustify: 'Căn đều',
  bulletList: 'Danh sách',
  orderedList: 'Danh sách đánh số',
  blockquote: 'Trích dẫn',
  insertLink: 'Chèn liên kết',
  removeLink: 'Bỏ liên kết',
  insertImage: 'Chèn ảnh',
  insertImageDisabled: 'Chưa cấu hình onUploadImage',
  insertVideo: 'Chèn video',
  insertVideoDisabled: 'Chưa cấu hình onUploadVideo',
  clearFormatting: 'Xoá định dạng',
  undo: 'Hoàn tác',
  redo: 'Làm lại',
  imageUploadFailed: 'Tải ảnh lên thất bại',
  videoUploadFailed: 'Tải video lên thất bại',
  linkDialogTitle: 'Chèn liên kết',
  linkDialogUrlLabel: 'URL',
  linkDialogUrlPlaceholder: 'https://…',
  linkDialogRemove: 'Bỏ liên kết',
  linkDialogCancel: 'Huỷ',
  linkDialogSubmit: 'Chèn',
  linkUrlRequired: 'URL không được để trống',
  linkUrlInvalid: 'URL không hợp lệ — vd: https://example.com',
};

const mockUploadImage: EditorProps['onUploadImage'] = async (file) => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { url: `https://placehold.co/600x400?text=${encodeURIComponent(file.name)}` };
};

const mockUploadVideo: EditorProps['onUploadVideo'] = async () => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' };
};

function EditorWithLivePreview(args: EditorProps) {
  const [value, setValue] = useState(args.value ?? '');
  return (
    <div className="flex flex-col gap-6">
      <Editor {...args} value={value} onChange={setValue} />
      <div>
        <p className="mb-2 text-ui-label text-neutral-text-secondary">
          EditorViewer — render lại HTML đã lưu
        </p>
        <div className="rounded-lg border border-neutral-border p-4">
          <EditorViewer html={value} />
        </div>
      </div>
    </div>
  );
}

const meta: Meta<typeof Editor> = {
  title: 'Modules/Editor',
  component: Editor,
  tags: ['autodocs'],
  args: {
    label: 'Mô tả sản phẩm',
    placeholder: 'Nhập mô tả sản phẩm…',
    onUploadImage: mockUploadImage,
    onUploadVideo: mockUploadVideo,
    labels: VIETNAMESE_LABELS,
  },
  decorators: [
    (Story) => (
      <div className="p-6">
        <Story />
      </div>
    ),
  ],
  render: (args) => <EditorWithLivePreview {...args} />,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: '<p>Sản phẩm chất lượng cao, <strong>bảo hành 12 tháng</strong>.</p>',
  },
};

export const WithError: Story = {
  args: {
    error: 'Mô tả sản phẩm là bắt buộc',
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    value: '<p>Nội dung chỉ đọc.</p>',
    disabled: true,
  },
};

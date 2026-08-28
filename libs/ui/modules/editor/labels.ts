export type EditorLabels = {
  headingOne: string;
  headingTwo: string;
  paragraph: string;
  bold: string;
  italic: string;
  underline: string;
  strikethrough: string;
  code: string;
  alignLeft: string;
  alignCenter: string;
  alignRight: string;
  alignJustify: string;
  bulletList: string;
  orderedList: string;
  blockquote: string;
  insertLink: string;
  removeLink: string;
  insertImage: string;
  insertImageDisabled: string;
  insertVideo: string;
  insertVideoDisabled: string;
  clearFormatting: string;
  undo: string;
  redo: string;
  imageUploadFailed: string;
  videoUploadFailed: string;
  linkDialogTitle: string;
  linkDialogUrlLabel: string;
  linkDialogUrlPlaceholder: string;
  linkDialogRemove: string;
  linkDialogCancel: string;
  linkDialogSubmit: string;
  linkUrlRequired: string;
  linkUrlInvalid: string;
};

export const DEFAULT_EDITOR_LABELS: EditorLabels = {
  headingOne: 'Heading 1',
  headingTwo: 'Heading 2',
  paragraph: 'Paragraph',
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
  strikethrough: 'Strikethrough',
  code: 'Code',
  alignLeft: 'Align left',
  alignCenter: 'Align center',
  alignRight: 'Align right',
  alignJustify: 'Justify',
  bulletList: 'Bullet list',
  orderedList: 'Numbered list',
  blockquote: 'Quote',
  insertLink: 'Insert link',
  removeLink: 'Remove link',
  insertImage: 'Insert image',
  insertImageDisabled: 'Image upload is not configured',
  insertVideo: 'Insert video',
  insertVideoDisabled: 'Video upload is not configured',
  clearFormatting: 'Clear formatting',
  undo: 'Undo',
  redo: 'Redo',
  imageUploadFailed: 'Image upload failed',
  videoUploadFailed: 'Video upload failed',
  linkDialogTitle: 'Insert link',
  linkDialogUrlLabel: 'URL',
  linkDialogUrlPlaceholder: 'https://…',
  linkDialogRemove: 'Remove link',
  linkDialogCancel: 'Cancel',
  linkDialogSubmit: 'Insert',
  linkUrlRequired: 'URL is required',
  linkUrlInvalid: 'Enter a valid URL, e.g. https://example.com',
};

import ImageExtension from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { EditorContent, type Editor as TiptapEditorInstance, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { FormLabel } from '../../components/form-label';
import { cn } from '../../helpers/utils';
import './editor.css';
import { DEFAULT_EDITOR_LABELS, type EditorLabels } from './labels';
import { type EditorUploadHandler, Toolbar } from './toolbar';
import { Video } from './video-extension';

export { DEFAULT_EDITOR_LABELS, type EditorLabels } from './labels';
export type { EditorUploadHandler, EditorUploadResult } from './toolbar';
export { EditorViewer, type EditorViewerProps } from './viewer';

export type EditorProps = {
  value?: string;
  onChange?: (html: string) => void;
  onUploadImage?: EditorUploadHandler;
  onUploadVideo?: EditorUploadHandler;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  minHeight?: number;
  className?: string;
  labels?: Partial<EditorLabels>;
  customClasses?: {
    root?: string;
    label?: string;
    toolbar?: string;
    content?: string;
    helperText?: string;
    error?: string;
  };
};

export const Editor = forwardRef<TiptapEditorInstance, EditorProps>(
  (
    {
      value,
      onChange,
      onUploadImage,
      onUploadVideo,
      placeholder = 'Type something…',
      label,
      helperText,
      error,
      required,
      disabled,
      minHeight = 200,
      className,
      labels,
      customClasses,
    },
    ref,
  ) => {
    const mergedLabels: EditorLabels = { ...DEFAULT_EDITOR_LABELS, ...labels };
    const isInitialUpdate = useRef(true);
    const editor = useEditor({
      extensions: [
        StarterKit.configure({ link: { openOnClick: false } }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        ImageExtension,
        Video,
        Placeholder.configure({ placeholder }),
      ],
      content: value,
      editable: !disabled,
      editorProps: { attributes: { class: 'tiptap' } },
      onUpdate: ({ editor: e }) => {
        if (isInitialUpdate.current) {
          isInitialUpdate.current = false;
          return;
        }
        onChange?.(e.isEmpty ? '' : e.getHTML());
      },
    });

    useImperativeHandle(ref, () => editor, [editor]);

    useEffect(() => {
      if (!editor || value === undefined) return;
      const currentHtml = editor.isEmpty ? '' : editor.getHTML();
      if (value !== currentHtml) editor.commands.setContent(value, { emitUpdate: false });
    }, [editor, value]);

    useEffect(() => {
      editor?.setEditable(!disabled);
    }, [editor, disabled]);

    if (!editor) return null;

    const colorClass = error
      ? 'border-error bg-error-bg'
      : 'border-neutral-border bg-neutral-white focus-within:border-primary focus-within:shadow-focus-ring';

    return (
      <div className={cn('w-full', customClasses?.root)}>
        {label && (
          <FormLabel required={required} className={customClasses?.label}>
            {label}
          </FormLabel>
        )}

        <div
          className={cn(
            'w-full rounded-lg border transition-all ease-in-out',
            colorClass,
            disabled && 'opacity-50 cursor-not-allowed',
            className,
          )}
        >
          <Toolbar
            editor={editor}
            disabled={disabled}
            onUploadImage={onUploadImage}
            onUploadVideo={onUploadVideo}
            labels={mergedLabels}
            className={customClasses?.toolbar}
          />
          <div
            className={cn('p4-editor-content px-4 py-3', customClasses?.content)}
            style={{ minHeight }}
          >
            <EditorContent editor={editor} />
          </div>
        </div>

        {error ? (
          <p className={cn('mt-1 text-14 text-error', customClasses?.error)}>{error}</p>
        ) : helperText ? (
          <p className={cn('mt-1 text-14 text-neutral-placeholder', customClasses?.helperText)}>
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Editor.displayName = 'Editor';

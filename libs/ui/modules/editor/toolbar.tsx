import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { type ChangeEvent, type ReactNode, useRef, useState } from 'react';
import { IconButton } from '../../components/icon-button';
import type { IconName } from '../../components/icons';
import { toastError } from '../../components/toast';
import { cn } from '../../helpers/utils';
import type { EditorLabels } from './labels';
import { LinkDialog } from './link-dialog';

export type EditorUploadResult = { url: string };
export type EditorUploadHandler = (file: File) => Promise<EditorUploadResult>;

type ToolbarProps = {
  editor: Editor;
  disabled?: boolean;
  onUploadImage?: EditorUploadHandler;
  onUploadVideo?: EditorUploadHandler;
  labels: EditorLabels;
  className?: string;
};

function ToolbarButton({
  icon,
  active,
  disabled,
  title,
  onClick,
}: {
  icon: IconName;
  active?: boolean;
  disabled?: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <IconButton
      type="button"
      icon={icon}
      title={title}
      disabled={disabled}
      onClick={onClick}
      variant={active ? 'subtle' : 'ghost'}
      color={active ? 'primary' : 'neutral'}
      shape="square"
      className={cn('!h-8 !w-8', disabled && 'opacity-40 cursor-not-allowed')}
      iconClassName="!h-4 !w-4"
    />
  );
}

function ToolbarDivider() {
  return <div className="w-px self-stretch bg-neutral-divider" />;
}

function ToolbarGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-1">{children}</div>;
}

export function Toolbar({
  editor,
  disabled,
  onUploadImage,
  onUploadVideo,
  labels,
  className,
}: ToolbarProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      code: e.isActive('code'),
      h1: e.isActive('heading', { level: 1 }),
      h2: e.isActive('heading', { level: 2 }),
      paragraph: e.isActive('paragraph'),
      bulletList: e.isActive('bulletList'),
      orderedList: e.isActive('orderedList'),
      blockquote: e.isActive('blockquote'),
      link: e.isActive('link'),
      alignLeft: e.isActive({ textAlign: 'left' }),
      alignCenter: e.isActive({ textAlign: 'center' }),
      alignRight: e.isActive({ textAlign: 'right' }),
      alignJustify: e.isActive({ textAlign: 'justify' }),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const currentLinkUrl = editor.getAttributes('link').href as string | undefined;

  const applyLink = (url: string) => {
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    setLinkDialogOpen(false);
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setLinkDialogOpen(false);
  };

  const handleUploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !onUploadImage) return;
    setUploadingImage(true);
    try {
      const { url } = await onUploadImage(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch {
      toastError(labels.imageUploadFailed);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUploadVideo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !onUploadVideo) return;
    setUploadingVideo(true);
    try {
      const { url } = await onUploadVideo(file);
      editor.chain().focus().setVideo({ src: url, title: file.name }).run();
    } catch {
      toastError(labels.videoUploadFailed);
    } finally {
      setUploadingVideo(false);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1.5 border-b border-neutral-border p-1.5',
        disabled && 'opacity-50 pointer-events-none',
        className,
      )}
    >
      <ToolbarGroup>
        <ToolbarButton
          icon="h1"
          title={labels.headingOne}
          active={state.h1}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        />
        <ToolbarButton
          icon="h2"
          title={labels.headingTwo}
          active={state.h2}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          icon="paragraph"
          title={labels.paragraph}
          active={state.paragraph}
          onClick={() => editor.chain().focus().setParagraph().run()}
        />
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup>
        <ToolbarButton
          icon="bold"
          title={labels.bold}
          active={state.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          icon="italic"
          title={labels.italic}
          active={state.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          icon="underline"
          title={labels.underline}
          active={state.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          icon="strikethrough"
          title={labels.strikethrough}
          active={state.strike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
        <ToolbarButton
          icon="code"
          title={labels.code}
          active={state.code}
          onClick={() => editor.chain().focus().toggleCode().run()}
        />
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup>
        <ToolbarButton
          icon="left"
          title={labels.alignLeft}
          active={state.alignLeft}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        />
        <ToolbarButton
          icon="center"
          title={labels.alignCenter}
          active={state.alignCenter}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        />
        <ToolbarButton
          icon="right"
          title={labels.alignRight}
          active={state.alignRight}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        />
        <ToolbarButton
          icon="justify"
          title={labels.alignJustify}
          active={state.alignJustify}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        />
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup>
        <ToolbarButton
          icon="list"
          title={labels.bulletList}
          active={state.bulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          icon="list-ordered"
          title={labels.orderedList}
          active={state.orderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          icon="quote"
          title={labels.blockquote}
          active={state.blockquote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup>
        <ToolbarButton
          icon="link"
          title={labels.insertLink}
          active={state.link}
          onClick={() => setLinkDialogOpen(true)}
        />
        <ToolbarButton
          icon="link-off"
          title={labels.removeLink}
          disabled={!state.link}
          onClick={() => editor.chain().focus().unsetLink().run()}
        />
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup>
        <ToolbarButton
          icon={uploadingImage ? 'loading' : 'image'}
          title={onUploadImage ? labels.insertImage : labels.insertImageDisabled}
          disabled={!onUploadImage || uploadingImage}
          onClick={() => imageInputRef.current?.click()}
        />
        <ToolbarButton
          icon={uploadingVideo ? 'loading' : 'video'}
          title={onUploadVideo ? labels.insertVideo : labels.insertVideoDisabled}
          disabled={!onUploadVideo || uploadingVideo}
          onClick={() => videoInputRef.current?.click()}
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleUploadImage}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          hidden
          onChange={handleUploadVideo}
        />
      </ToolbarGroup>

      <ToolbarDivider />

      <ToolbarGroup>
        <ToolbarButton
          icon="eraser"
          title={labels.clearFormatting}
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        />
        <ToolbarButton
          icon="undo"
          title={labels.undo}
          disabled={!state.canUndo}
          onClick={() => editor.chain().focus().undo().run()}
        />
        <ToolbarButton
          icon="redo"
          title={labels.redo}
          disabled={!state.canRedo}
          onClick={() => editor.chain().focus().redo().run()}
        />
      </ToolbarGroup>

      <LinkDialog
        isOpen={linkDialogOpen}
        initialUrl={currentLinkUrl}
        labels={labels}
        onClose={() => setLinkDialogOpen(false)}
        onSubmit={applyLink}
        onRemove={currentLinkUrl ? removeLink : undefined}
      />
    </div>
  );
}

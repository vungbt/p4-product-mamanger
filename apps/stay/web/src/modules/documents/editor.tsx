import { Button, Icon, type IconName } from '@itclabs/react-ui';
import { isTemplateVariable } from '@stay/shared';
import Highlight from '@tiptap/extension-highlight';
import { TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import { Plugin } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { EditorContent, Extension, Mark, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/** Keep missing-field markers through unrelated edits so sending stays blocked. */
const DocumentVariable = Mark.create({
  name: 'documentVariable',
  inclusive: false,
  addAttributes() {
    return {
      missing: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-missing'),
        renderHTML: (attributes) =>
          attributes.missing ? { 'data-missing': attributes.missing } : {},
      },
      variable: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-variable'),
        renderHTML: (attributes) =>
          attributes.variable ? { 'data-variable': attributes.variable } : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-missing]' }, { tag: 'span[data-variable]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
});

/** Decorations flag typos without changing the persisted template HTML. */
const UnknownVariables = Extension.create({
  name: 'unknownVariables',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];

            state.doc.descendants((node, position) => {
              if (!node.isText || !node.text) return;
              for (const match of node.text.matchAll(/\{\{\s*([a-z_]+(?:\.[a-z_]+)*)\s*\}\}/g)) {
                if (!isTemplateVariable(match[1] ?? ''))
                  decorations.push(
                    Decoration.inline(
                      position + (match.index ?? 0),
                      position + (match.index ?? 0) + match[0].length,
                      { class: 'text-danger-700 underline decoration-wavy' },
                    ),
                  );
              }
            });
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

export function DocumentEditor({
  value,
  onChange,
  insert,
  readOnly = false,
}: {
  value: string;
  onChange: (html: string) => void;
  insert?: { text: string; sequence: number };
  readOnly?: boolean;
}) {
  const { t } = useTranslation('documents');
  const editor = useEditor({
    extensions: [
      UnknownVariables,
      DocumentVariable,
      StarterKit,
      TableKit,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class:
          'pod-rich-text min-h-64 p-4 outline-none [&_[data-missing]]:text-danger-700 [&_[data-missing]]:font-semibold',
        'aria-label': t('body'),
      },
    },
    // Only edits made while the editor has focus (typing, paste, toolbar, variable picker) count:
    // normalisation on load (e.g. table fixing) must not mark a saved draft as edited.
    onUpdate: ({ editor }) => {
      if (editor.isFocused) onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value)
      editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  useEffect(() => {
    if (insert) editor?.chain().focus().insertContent(insert.text).run();
  }, [editor, insert]);

  useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [editor, readOnly]);

  const controls: { icon: IconName; label: string; run: () => void }[] = editor
    ? [
        {
          icon: 'bold',
          label: t('bold'),
          run: () => {
            editor.chain().focus().toggleBold().run();
          },
        },
        {
          icon: 'italic',
          label: t('italic'),
          run: () => {
            editor.chain().focus().toggleItalic().run();
          },
        },
        {
          icon: 'heading',
          label: t('heading'),
          run: () => {
            editor.chain().focus().toggleHeading({ level: 2 }).run();
          },
        },
        {
          icon: 'list',
          label: t('bulletList'),
          run: () => {
            editor.chain().focus().toggleBulletList().run();
          },
        },
        {
          icon: 'listOrdered',
          label: t('orderedList'),
          run: () => {
            editor.chain().focus().toggleOrderedList().run();
          },
        },
        {
          icon: 'table',
          label: t('table'),
          run: () => {
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
          },
        },
        ...(['left', 'center', 'right', 'justify'] as const).map((align) => ({
          icon: (
            {
              left: 'textAlignLeft',
              center: 'textAlignCenter',
              right: 'textAlignRight',
              justify: 'textJustify',
            } as const
          )[align],
          label: t(align),
          run: () => {
            editor.chain().focus().setTextAlign(align).run();
          },
        })),
      ]
    : [];

  return (
    <div className="min-w-0 rounded-control border border-line bg-surface">
      {!readOnly && (
        <div className="flex flex-wrap gap-1 border-b border-line p-2">
          {controls.map((control) => (
            <Button
              key={control.icon}
              size="sm"
              variant="ghost"
              aria-label={control.label}
              onClick={control.run}
            >
              <Icon name={control.icon} className="size-4" aria-hidden />
            </Button>
          ))}
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

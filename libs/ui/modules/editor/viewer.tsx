import DOMPurify from 'dompurify';
import { cn } from '../../helpers/utils';
import './editor.css';

export type EditorViewerProps = {
  html: string;
  className?: string;
  customClasses?: { root?: string };
};

export function EditorViewer({ html, className, customClasses }: EditorViewerProps) {
  const safeHtml = DOMPurify.sanitize(html);

  return (
    <div className={cn('p4-editor-content', className, customClasses?.root)}>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized */}
      <div className="tiptap" dangerouslySetInnerHTML={{ __html: safeHtml }} />
    </div>
  );
}

EditorViewer.displayName = 'EditorViewer';

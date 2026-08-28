import { mergeAttributes, Node } from '@tiptap/core';

export type SetVideoOptions = {
  src: string;
  title?: string;
  width?: number;
  height?: number;
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: SetVideoOptions) => ReturnType;
    };
  }
}

export type VideoOptions = {
  HTMLAttributes: Record<string, unknown>;
};

export const Video = Node.create<VideoOptions>({
  name: 'video',
  group: 'block',
  draggable: true,
  atom: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      src: { default: null },
      title: { default: null },
      width: { default: null },
      height: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'video[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'video',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { controls: 'true' }),
    ];
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: options }),
    };
  },
});

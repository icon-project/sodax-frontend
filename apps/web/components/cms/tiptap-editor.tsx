'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Quote,
  Code,
} from 'lucide-react';
import { useState } from 'react';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function TiptapEditor({ content, onChange, placeholder = 'Start writing...' }: TiptapEditorProps) {
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: 'font-bold text-[var(--espresso)]',
          },
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'list-disc pl-6 my-4 space-y-2',
          },
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'list-decimal pl-6 my-4 space-y-2',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'leading-relaxed',
          },
        },
        paragraph: {
          HTMLAttributes: {
            class: 'leading-relaxed mb-4',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-[var(--cherry-soda)] pl-6 italic my-4',
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class:
              'bg-[var(--espresso)] text-[var(--cream-white)] rounded-lg p-4 my-4 font-mono text-sm overflow-x-auto',
          },
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[var(--cherry-soda)] underline hover:text-[var(--cherry-dark)] transition-colors font-medium',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[300px] px-4 py-3',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/cms/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const { url } = await response.json();
        editor.chain().focus().setImage({ src: url }).run();
      } catch (error) {
        console.error('Image upload error:', error);
        alert('Failed to upload image');
      } finally {
        setIsUploading(false);
      }
    };
    input.click();
  };

  const handleAddLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const ToolbarButton = ({
    onClick,
    active,
    disabled,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
  }) => (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={`h-8 w-8 p-0 transition-colors border ${
        active
          ? 'bg-[var(--cherry-soda)] text-white border-[var(--cherry-soda)] hover:bg-[var(--cherry-dark)] hover:border-[var(--cherry-dark)] hover:text-white'
          : 'bg-white text-[var(--espresso)] border-[var(--cherry-grey)] hover:bg-[var(--cream-white)] hover:border-[var(--cherry-soda)]'
      }`}
    >
      {children}
    </Button>
  );

  return (
    <div className="border-2 border-[var(--cherry-grey)] rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Toolbar */}
      <div className="border-b border-[var(--cherry-grey)] bg-[var(--cream-white)] p-2 flex flex-wrap gap-1">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
          <Bold className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
          <Italic className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-8 bg-[var(--cherry-grey)] mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-8 bg-[var(--cherry-grey)] mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
        >
          <List className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-8 bg-[var(--cherry-grey)] mx-1" />

        <ToolbarButton onClick={handleAddLink} active={editor.isActive('link')}>
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton onClick={handleImageUpload} disabled={isUploading}>
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-8 bg-[var(--cherry-grey)] mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div className="tiptap">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

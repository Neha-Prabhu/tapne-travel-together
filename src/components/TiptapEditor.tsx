import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExt from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered, Heading2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef } from "react";

interface TiptapEditorProps {
  content: string;
  onChange: (json: string) => void;
  placeholder?: string;
  className?: string;
}

const TiptapEditor = ({ content, onChange, placeholder = "Start writing…", className }: TiptapEditorProps) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      ImageExt.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: content ? (() => { try { return JSON.parse(content); } catch { return content; } })() : "",
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
    editorProps: {
      attributes: {
        class: "outline-none min-h-[200px] px-4 py-3 text-sm leading-relaxed",
      },
    },
  });

  // Sync external content changes only on initial mount
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
  }, [content]);

  const insertImage = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      editor.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [editor]);

  if (!editor) return null;

  const btn = (active: boolean) =>
    cn("h-8 w-8 p-0 rounded", active ? "bg-accent text-accent-foreground" : "");

  return (
    <div className={cn("rounded-md border border-input bg-background overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/30 px-2 py-1">
        <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <div className="mx-1 h-4 w-px bg-border" />
        <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading">
          <Heading2 className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>
        <div className="mx-1 h-4 w-px bg-border" />
        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={insertImage} title="Insert Image">
          <ImagePlus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className={cn(
          "prose prose-sm dark:prose-invert max-w-none text-foreground",
          "[&_.tiptap]:outline-none",
          "[&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_p.is-editor-empty:first-child::before]:h-0",
          "[&_img]:rounded-lg [&_img]:my-4 [&_img]:max-w-full",
          "[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2",
          "[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1",
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
          "[&_li]:my-0.5 [&_li]:ml-1"
        )}
      />

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
};

export default TiptapEditor;

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered,
  Palette
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Digite aqui...",
  disabled = false,
  className = ""
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Desabilitar underline do StarterKit para evitar duplicação
        underline: false,
      }),
      TextStyle,
      Color,
      Underline,
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[120px] p-3',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const colors = [
    '#000000', '#374151', '#6B7280', '#9CA3AF',
    '#EF4444', '#F97316', '#EAB308', '#22C55E',
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'
  ];

  return (
    <div className={`border border-gray-300 rounded-md ${disabled ? 'bg-gray-100' : 'bg-white'} ${className}`}>
      {/* Toolbar */}
      {!disabled && (
        <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1" style={{ backgroundColor: '#f8fffe' }}>
          {/* Formatação básica */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded transition-all duration-200 ${
              editor.isActive('bold') 
                ? 'text-white' 
                : 'text-gray-700 hover:text-white'
            }`}
            style={{
              backgroundColor: editor.isActive('bold') ? '#2CB20B' : 'transparent',
              ...(editor.isActive('bold') ? {} : {
                ':hover': { backgroundColor: '#2CB20B' }
              })
            }}
            onMouseEnter={(e) => {
              if (!editor.isActive('bold')) {
                e.currentTarget.style.backgroundColor = '#2CB20B';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (!editor.isActive('bold')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#374151';
              }
            }}
            title="Negrito"
          >
            <Bold size={16} />
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded transition-all duration-200 ${
              editor.isActive('italic') 
                ? 'text-white' 
                : 'text-gray-700 hover:text-white'
            }`}
            style={{
              backgroundColor: editor.isActive('italic') ? '#2CB20B' : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!editor.isActive('italic')) {
                e.currentTarget.style.backgroundColor = '#2CB20B';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (!editor.isActive('italic')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#374151';
              }
            }}
            title="Itálico"
          >
            <Italic size={16} />
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded transition-all duration-200 ${
              editor.isActive('underline') 
                ? 'text-white' 
                : 'text-gray-700 hover:text-white'
            }`}
            style={{
              backgroundColor: editor.isActive('underline') ? '#2CB20B' : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!editor.isActive('underline')) {
                e.currentTarget.style.backgroundColor = '#2CB20B';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (!editor.isActive('underline')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#374151';
              }
            }}
            title="Sublinhado"
          >
            <UnderlineIcon size={16} />
          </button>

          {/* Separador */}
          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          {/* Listas */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded transition-all duration-200 ${
              editor.isActive('bulletList') 
                ? 'text-white' 
                : 'text-gray-700 hover:text-white'
            }`}
            style={{
              backgroundColor: editor.isActive('bulletList') ? '#2CB20B' : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!editor.isActive('bulletList')) {
                e.currentTarget.style.backgroundColor = '#2CB20B';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (!editor.isActive('bulletList')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#374151';
              }
            }}
            title="Lista com marcadores"
          >
            <List size={16} />
          </button>
          
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded transition-all duration-200 ${
              editor.isActive('orderedList') 
                ? 'text-white' 
                : 'text-gray-700 hover:text-white'
            }`}
            style={{
              backgroundColor: editor.isActive('orderedList') ? '#2CB20B' : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!editor.isActive('orderedList')) {
                e.currentTarget.style.backgroundColor = '#2CB20B';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (!editor.isActive('orderedList')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#374151';
              }
            }}
            title="Lista numerada"
          >
            <ListOrdered size={16} />
          </button>

          {/* Separador */}
          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          {/* Cores */}
          <div className="relative group">
            <button
              type="button"
              className="p-2 rounded flex items-center gap-1 text-gray-700 hover:text-white transition-all duration-200"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2CB20B';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#374151';
              }}
              title="Cor do texto"
            >
              <Palette size={16} />
            </button>
            
            {/* Paleta de cores */}
            <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-300 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="grid grid-cols-4 gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => editor.chain().focus().setColor(color).run()}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={`Cor: ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className={`${disabled ? 'cursor-not-allowed' : ''}`}>
        <EditorContent 
          editor={editor} 
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
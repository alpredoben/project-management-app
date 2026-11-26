import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Unlink,
  Undo,
  Redo,
  RemoveFormatting,
  Code2,
  Eye,
} from 'lucide-react';
import { cn } from '@/shared/libs/cn';

export interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  minHeight?: string;
  className?: string;
  /**
   * Set to true to show file/image upload button in the toolbar.
   * Default is false. File upload is explicitly disabled for Milestone descriptions.
   */
  allowFileUpload?: boolean;
}

export interface RichTextEditorRef {
  focus: () => void;
  getHtml: () => string;
  setHtml: (html: string) => void;
}

function isHtmlEmpty(html?: string | null): boolean {
  if (!html) return true;
  const stripped = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  return stripped === '';
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  function RichTextEditor(
    {
      value = '',
      onChange,
      label,
      error,
      hint,
      placeholder = 'Type description or breakdown details here...',
      required = false,
      disabled = false,
      minHeight = '140px',
      className,
      allowFileUpload = false, // Explicitly disabled by default per specifications
    },
    ref,
  ) {
    const id = useId();
    const errorId = `${id}-error`;
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [viewSource, setViewSource] = useState(false);
    const [activeFormats, setActiveFormats] = useState<{
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      strikeThrough?: boolean;
      insertUnorderedList?: boolean;
      insertOrderedList?: boolean;
    }>({});

    // Expose imperative handle
    useImperativeHandle(ref, () => ({
      focus: () => {
        editorRef.current?.focus();
      },
      getHtml: () => editorRef.current?.innerHTML || '',
      setHtml: (html: string) => {
        if (editorRef.current) {
          editorRef.current.innerHTML = html;
        }
      },
    }));

    // Update active format states for visual feedback
    const checkActiveFormats = useCallback(() => {
      if (typeof document === 'undefined' || viewSource) return;
      try {
        setActiveFormats({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          strikeThrough: document.queryCommandState('strikeThrough'),
          insertUnorderedList: document.queryCommandState('insertUnorderedList'),
          insertOrderedList: document.queryCommandState('insertOrderedList'),
        });
      } catch {
        // queryCommandState might throw if selection is out of range
      }
    }, [viewSource]);

    // Synchronize parent value with editor content
    useEffect(() => {
      if (editorRef.current && !viewSource) {
        if (editorRef.current.innerHTML !== (value || '')) {
          editorRef.current.innerHTML = value || '';
        }
      }
    }, [value, viewSource]);

    // Handle user typing or pasting inside the editable div
    const handleInput = () => {
      if (!editorRef.current) return;
      const html = editorRef.current.innerHTML;
      const cleanValue = isHtmlEmpty(html) ? '' : html;
      onChange?.(cleanValue);
      checkActiveFormats();
    };

    // Generic command runner with selection preservation
    const exec = (command: string, cmdValue: string | undefined = undefined) => {
      if (disabled || viewSource) return;
      editorRef.current?.focus();
      document.execCommand(command, false, cmdValue);
      handleInput();
      checkActiveFormats();
    };

    const formatBlock = (tag: string) => {
      if (disabled || viewSource) return;
      editorRef.current?.focus();
      document.execCommand('formatBlock', false, `<${tag}>`);
      handleInput();
      checkActiveFormats();
    };

    const handleAddLink = () => {
      if (disabled || viewSource) return;
      const url = window.prompt('Enter link URL (e.g. https://example.com):', 'https://');
      if (url && url.trim()) {
        exec('createLink', url.trim());
      }
    };

    const handleRemoveLink = () => {
      if (disabled || viewSource) return;
      exec('unlink');
    };

    const isEmpty = isHtmlEmpty(value);

    return (
      <div className={cn('space-y-1.5', className)}>
        {/* Label */}
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={id}
              className="block text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              {label}
              {required && <span className="ml-0.5 text-red-600 dark:text-red-400">*</span>}
            </label>
            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
              {viewSource ? 'HTML Source Mode' : 'WYSIWYG Editor'}
            </span>
          </div>
        )}

        {/* Editor Box */}
        <div
          className={cn(
            'group relative overflow-hidden rounded-xl border bg-white transition-all dark:bg-gray-900',
            isFocused
              ? 'border-brand-500 ring-3 ring-brand-500/10 dark:border-brand-600'
              : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600',
            error && 'border-red-500 ring-red-500/20 dark:border-red-500',
            disabled && 'cursor-not-allowed bg-gray-50 opacity-60 dark:bg-gray-800/40',
          )}
        >
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200/90 bg-gray-50/90 px-2 py-1.5 text-gray-600 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-300">
            {/* History */}
            <div className="flex items-center gap-0.5 pr-1">
              <button
                type="button"
                disabled={disabled || viewSource}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec('undo')}
                className="rounded p-1.5 hover:bg-gray-200/80 disabled:opacity-40 dark:hover:bg-gray-700/80 transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <Undo className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={disabled || viewSource}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec('redo')}
                className="rounded p-1.5 hover:bg-gray-200/80 disabled:opacity-40 dark:hover:bg-gray-700/80 transition-colors"
                title="Redo (Ctrl+Y)"
              >
                <Redo className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-0.5" />

            {/* Block Formatters */}
            <div className="flex items-center gap-0.5 px-0.5">
              <button
                type="button"
                disabled={disabled || viewSource}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => formatBlock('h2')}
                className="rounded px-2 py-1 text-xs font-bold hover:bg-gray-200/80 disabled:opacity-40 dark:hover:bg-gray-700/80 transition-colors"
                title="Heading 2"
              >
                <Heading2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={disabled || viewSource}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => formatBlock('h3')}
                className="rounded px-2 py-1 text-xs font-bold hover:bg-gray-200/80 disabled:opacity-40 dark:hover:bg-gray-700/80 transition-colors"
                title="Heading 3"
              >
                <Heading3 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={disabled || viewSource}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => formatBlock('p')}
                className="rounded px-2 py-1 text-xs font-semibold hover:bg-gray-200/80 disabled:opacity-40 dark:hover:bg-gray-700/80 transition-colors"
                title="Paragraph"
              >
                P
              </button>
            </div>

            <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-0.5" />

            {/* Inline Formatting */}
            <div className="flex items-center gap-0.5 px-0.5">
              <button
                type="button"
                disabled={disabled || viewSource}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec('bold')}
                className={cn(
                  'rounded p-1.5 hover:bg-gray-200/80 disabled:opacity-40 dark:hover:bg-gray-700/80 transition-colors',
                  activeFormats.bold && 'bg-brand-100 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300',
                )}
                title="Bold (Ctrl+B)"
              >
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={disabled || viewSource}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec('italic')}
                className={cn(
                  'rounded p-1.5 hover:bg-gray-200/80 disabled:opacity-40 dark:hover:bg-gray-700/80 transition-colors',
                  activeFormats.italic && 'bg-brand-100 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300',
                )}
                title="Italic (Ctrl+I)"
              >
                <Italic className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={disabled || viewSource}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec('underline')}
                className={cn(
                  'rounded p-1.5 hover:bg-gray-200/80 disabled:opacity-40 dark:hover:bg-gray-700/80 transition-colors',
                  activeFormats.underline && 'bg-brand-100 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300',
                )}
                title="Underline (Ctrl+U)"
              >
                <Underline className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={disabled || viewSource}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec('strikeThrough')}
                className={cn(
                  'rounded p-1.5 hover:bg-gray-200/80 disabled:opacity-40 dark:hover:bg-gray-700/80 transition-colors',
                  activeFormats.strikeThrough && 'bg-brand-100 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300',
                )}
                title="Strikethrough"
              >
                <Strikethrough className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-0.5" />

            {/* Lists & Structures */}
            <div className="flex items-center gap-0.5 px-0.5">
              <button
                type="button"
                disabled={disabled || viewSource}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec('insertUnorderedList')}
                className={cn(
                  'rounded p-1.5 hover:bg-gray-200/80 disabled:opacity-40 dark:hover:bg-gray-700/80 transition-colors',
                  activeFormats.insertUnorderedList && 'bg-brand-100 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300',
                )}
                title="Bulleted List"
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={disabled || viewSource}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec('insertOrderedList')}
                className={cn(
                  'rounded p-1.5 hover:bg-gray-200/80 disabled:opacity-40 dark:hover:bg-gray-700/80 transition-colors',
                  activeFormats.insertOrderedList && 'bg-brand-100 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300',
                )}
                title="Numbered List"
              >
                <ListOrdered className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={disabled || viewSource}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => formatBlock('blockquote')}
                className="rounded p-1.5 hover:bg-gray-200/80 disabled:opacity-40 dark:hover:bg-gray-700/80 transition-colors"
                title="Blockquote"
              >
                <Quote className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={disabled || viewSource}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => formatBlock('pre')}
                className="rounded p-1.5 hover:bg-gray-200/80 disabled:opacity-40 dark:hover:bg-gray-700/80 transition-colors"
                title="Code Block"
              >
                <Code className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-0.5" />

            {/* Links & Cleanup */}
            <div className="flex items-center gap-0.5 px-0.5">
              <button
                type="button"
                disabled={disabled || viewSource}
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleAddLink}
                className="rounded p-1.5 hover:bg-gray-200/80 disabled:opacity-40 dark:hover:bg-gray-700/80 transition-colors"
                title="Insert Link"
              >
                <Link className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={disabled || viewSource}
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleRemoveLink}
                className="rounded p-1.5 hover:bg-gray-200/80 disabled:opacity-40 dark:hover:bg-gray-700/80 transition-colors"
                title="Remove Link"
              >
                <Unlink className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={disabled || viewSource}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec('removeFormat')}
                className="rounded p-1.5 hover:bg-gray-200/80 disabled:opacity-40 dark:hover:bg-gray-700/80 transition-colors"
                title="Clear Formatting"
              >
                <RemoveFormatting className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* File Upload is strictly omitted / disabled when allowFileUpload is false */}
            {allowFileUpload && (
              <span className="text-[10px] text-gray-400 italic">File upload enabled</span>
            )}

            {/* Source View Toggle */}
            <div className="ml-auto flex items-center gap-1 pl-1">
              <button
                type="button"
                disabled={disabled}
                onClick={() => setViewSource((prev) => !prev)}
                className={cn(
                  'flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors',
                  viewSource
                    ? 'bg-brand-600 text-white shadow-2xs'
                    : 'text-gray-600 hover:bg-gray-200/80 dark:text-gray-300 dark:hover:bg-gray-700/80',
                )}
                title={viewSource ? 'Switch to Visual Editor' : 'Switch to HTML Code View'}
              >
                {viewSource ? (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    <span>Visual</span>
                  </>
                ) : (
                  <>
                    <Code2 className="h-3.5 w-3.5" />
                    <span>HTML</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="relative">
            {/* Visual Editor (WYSIWYG) */}
            <div
              className={cn(
                'relative w-full',
                viewSource ? 'hidden' : 'block',
              )}
            >
              {isEmpty && !isFocused && (
                <div
                  onClick={() => editorRef.current?.focus()}
                  className="pointer-events-none absolute left-3.5 top-3 select-none text-xs text-gray-400 dark:text-gray-500"
                >
                  {placeholder}
                </div>
              )}
              <div
                ref={editorRef}
                contentEditable={!disabled}
                onFocus={() => {
                  setIsFocused(true);
                  checkActiveFormats();
                }}
                onBlur={() => {
                  setIsFocused(false);
                  checkActiveFormats();
                }}
                onInput={handleInput}
                onKeyUp={checkActiveFormats}
                onMouseUp={checkActiveFormats}
                style={{ minHeight }}
                className={cn(
                  'max-h-[360px] overflow-y-auto px-3.5 py-3 text-sm text-gray-900 outline-none transition-colors dark:text-gray-100',
                  // Typography styling inside the content editable
                  '[&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-900 dark:[&_h2]:text-white [&_h2]:my-2',
                  '[&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-gray-900 dark:[&_h3]:text-white [&_h3]:my-1.5',
                  '[&_p]:my-1 leading-relaxed',
                  '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5',
                  '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5',
                  '[&_li]:my-0.5',
                  '[&_blockquote]:border-l-3 [&_blockquote]:border-brand-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600 dark:[&_blockquote]:text-gray-400 [&_blockquote]:my-2',
                  '[&_pre]:bg-gray-100 dark:[&_pre]:bg-gray-800/80 [&_pre]:p-2.5 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-xs [&_pre]:my-2 [&_pre]:overflow-x-auto',
                  '[&_a]:text-brand-600 dark:[&_a]:text-brand-400 [&_a]:underline',
                )}
              />
            </div>

            {/* Raw HTML Code Editor Mode */}
            {viewSource && (
              <textarea
                id={id}
                rows={6}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder="<div><h3>Scope</h3><ol><li>Item 1</li></ol></div>"
                className="w-full resize-y bg-gray-900 p-3.5 font-mono text-xs text-emerald-400 outline-none focus:outline-none dark:bg-gray-950"
                style={{ minHeight }}
              />
            )}
          </div>
        </div>

        {/* Hints & Errors */}
        {hint && !error && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  },
);

RichTextEditor.displayName = 'RichTextEditor';

import { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Heading1, Heading2, Type, Palette, Highlighter, Table, Undo, Redo } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

type Props = { value: string; onChange: (html: string) => void; placeholder?: string };

export function WordEditor({ value, onChange, placeholder }: Props) {
  const { locale } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const isRTL = locale === 'ar';

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    ref.current?.focus();
    onChange(ref.current?.innerHTML || '');
  };

  const onInput = () => onChange(ref.current?.innerHTML || '');

  const insertTable = () => {
    const html = '<table style="width:100%;border-collapse:collapse;margin:12px 0"><tr><td style="border:1px solid #d1d5db;padding:8px"></td><td style="border:1px solid #d1d5db;padding:8px"></td></tr><tr><td style="border:1px solid #d1d5db;padding:8px"></td><td style="border:1px solid #d1d5db;padding:8px"></td></tr></table><p><br/></p>';
    document.execCommand('insertHTML', false, html);
    onChange(ref.current?.innerHTML || '');
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      {/* Word-like toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-neutral-50 px-2 py-2">
        <div className="flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white p-0.5">
          <button type="button" onClick={() => exec('undo')} className="rounded p-1.5 hover:bg-neutral-100" title="Undo"><Undo className="h-4 w-4 text-neutral-600" /></button>
          <button type="button" onClick={() => exec('redo')} className="rounded p-1.5 hover:bg-neutral-100" title="Redo"><Redo className="h-4 w-4 text-neutral-600" /></button>
        </div>
        <div className="h-6 w-px bg-neutral-200 mx-1" />
        <select onChange={(e) => exec('formatBlock', e.target.value)} defaultValue="" className="h-8 rounded border border-neutral-200 bg-white px-2 text-xs">
          <option value="">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote</option>
        </select>
        <select onChange={(e) => exec('fontName', e.target.value)} defaultValue="" className="h-8 rounded border border-neutral-200 bg-white px-2 text-xs hidden sm:inline">
          <option value="">Font</option>
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times</option>
          <option value="Calibri">Calibri</option>
          <option value="Tajawal">Tajawal (AR)</option>
        </select>
        <select onChange={(e) => exec('fontSize', e.target.value)} defaultValue="" className="h-8 w-16 rounded border border-neutral-200 bg-white px-1 text-xs">
          <option value="">Size</option>
          <option value="1">10</option>
          <option value="2">12</option>
          <option value="3">14</option>
          <option value="4">16</option>
          <option value="5">18</option>
          <option value="6">24</option>
          <option value="7">32</option>
        </select>
        <div className="flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white p-0.5">
          <button type="button" onClick={() => exec('bold')} className="rounded p-1.5 hover:bg-neutral-100"><Bold className="h-4 w-4 text-neutral-700" /></button>
          <button type="button" onClick={() => exec('italic')} className="rounded p-1.5 hover:bg-neutral-100"><Italic className="h-4 w-4 text-neutral-700" /></button>
          <button type="button" onClick={() => exec('underline')} className="rounded p-1.5 hover:bg-neutral-100"><Underline className="h-4 w-4 text-neutral-700" /></button>
          <button type="button" onClick={() => exec('strikeThrough')} className="rounded p-1.5 hover:bg-neutral-100"><Strikethrough className="h-4 w-4 text-neutral-700" /></button>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white p-0.5">
          <button type="button" onClick={() => exec('justifyLeft')} className="rounded p-1.5 hover:bg-neutral-100"><AlignLeft className="h-4 w-4" /></button>
          <button type="button" onClick={() => exec('justifyCenter')} className="rounded p-1.5 hover:bg-neutral-100"><AlignCenter className="h-4 w-4" /></button>
          <button type="button" onClick={() => exec('justifyRight')} className="rounded p-1.5 hover:bg-neutral-100"><AlignRight className="h-4 w-4" /></button>
          <button type="button" onClick={() => exec('justifyFull')} className="rounded p-1.5 hover:bg-neutral-100"><AlignJustify className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white p-0.5">
          <button type="button" onClick={() => exec('insertUnorderedList')} className="rounded p-1.5 hover:bg-neutral-100"><List className="h-4 w-4" /></button>
          <button type="button" onClick={() => exec('insertOrderedList')} className="rounded p-1.5 hover:bg-neutral-100"><ListOrdered className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white p-0.5">
          <label className="rounded p-1.5 hover:bg-neutral-100 cursor-pointer" title="Text color"><Palette className="h-4 w-4" /><input type="color" onChange={(e) => exec('foreColor', e.target.value)} className="sr-only" /></label>
          <label className="rounded p-1.5 hover:bg-neutral-100 cursor-pointer" title="Highlight"><Highlighter className="h-4 w-4" /><input type="color" onChange={(e) => exec('hiliteColor', e.target.value)} className="sr-only" /></label>
        </div>
        <button type="button" onClick={insertTable} className="rounded border border-neutral-200 bg-white p-1.5 hover:bg-neutral-100"><Table className="h-4 w-4" /></button>
      </div>

      {/* Ruler */}
      <div className="h-6 bg-[#f8f9fa] border-b border-neutral-200 flex items-center px-4 text-[10px] text-neutral-400 select-none">
        <span className="hidden sm:inline">A4 · 210 × 297 mm · Margins: Normal</span><span className="sm:hidden">Word Editor</span><span className="ml-auto">{isRTL ? 'RTL' : 'LTR'}</span>
      </div>

      {/* Paper */}
      <div className="bg-[#e5e7eb] p-4 sm:p-6 flex justify-center min-h-[420px]">
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={onInput}
          dir={isRTL ? 'rtl' : 'ltr'}
          className="w-full max-w-[640px] min-h-[380px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.12)] rounded-sm p-8 sm:p-10 outline-none prose prose-sm max-w-none focus:ring-2 focus:ring-primary-100"
          style={{ fontFamily: isRTL ? 'Tajawal, IBM Plex Sans Arabic, sans-serif' : 'Calibri, Arial, sans-serif', lineHeight: '1.6' }}
          data-placeholder={placeholder}
        />
      </div>

      <style>{`
        [contenteditable][data-placeholder]:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }
        .prose h1 { font-size: 1.875rem; font-weight: 700; margin: 0.8em 0 0.4em; }
        .prose h2 { font-size: 1.5rem; font-weight: 700; margin: 0.7em 0 0.3em; }
        .prose h3 { font-size: 1.2rem; font-weight: 600; margin: 0.6em 0 0.3em; }
        .prose blockquote { border-left: 3px solid #e5e7eb; padding-left: 1em; color: #6b7280; }
        .prose table { width: 100%; }
      `}</style>
    </div>
  );
}

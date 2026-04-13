import { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Copy, Download, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function OutputDisplay({ content, type, testId }) {
  const [copied, setCopied] = useState(false);
  const contentRef = useRef(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = contentRef.current;
      const opt = {
        margin: [0.75, 0.75, 0.75, 0.75],
        filename: `${type.toLowerCase()}-${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(element).save();
      toast.success('PDF downloaded!');
    } catch {
      toast.error('PDF download failed');
    }
  };

  const formatContent = (text) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (/^(TITLE|QUIZ|LESSON|OVERVIEW|KEY CONCEPTS|REAL-WORLD|SUMMARY|DISCUSSION|SECTION|ANSWER KEY|SCORING|QUESTIONS):?/i.test(trimmed)) {
        return <h2 key={i} className="text-lg font-semibold text-violet-300 mt-6 mb-2" style={{ fontFamily: 'Outfit' }}>{trimmed}</h2>;
      }
      if (/^---+$/.test(trimmed)) {
        return <hr key={i} className="border-white/10 my-4" />;
      }
      if (/^Q\d+[\.\)]/.test(trimmed)) {
        return <p key={i} className="text-white font-medium mt-3 mb-1">{trimmed}</p>;
      }
      if (/^\s*[a-d]\)/.test(line)) {
        return <p key={i} className="text-slate-300 pl-6 mb-0.5">{trimmed}</p>;
      }
      if (/^\d+\.\s/.test(trimmed)) {
        return <p key={i} className="text-slate-200 mt-2 mb-1">{trimmed}</p>;
      }
      if (!trimmed) {
        return <div key={i} className="h-2" />;
      }
      return <p key={i} className="text-slate-300 leading-relaxed">{trimmed}</p>;
    });
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden animate-fade-in" data-testid={testId}>
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-white/[0.01] no-print">
        <span className="text-sm font-medium text-slate-400">{type} Output</span>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleCopy}
            variant="ghost"
            size="sm"
            data-testid={`${testId}-copy-button`}
            className="text-slate-400 hover:text-white hover:bg-white/5 h-8 px-3 text-xs"
          >
            {copied ? <Check size={14} className="mr-1.5 text-emerald-400" /> : <Copy size={14} className="mr-1.5" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button
            onClick={handleDownloadPDF}
            variant="ghost"
            size="sm"
            data-testid={`${testId}-download-button`}
            className="text-slate-400 hover:text-white hover:bg-white/5 h-8 px-3 text-xs"
          >
            <Download size={14} className="mr-1.5" />
            Download PDF
          </Button>
        </div>
      </div>

      <div ref={contentRef} className="p-6 md:p-8 print-content content-output" data-testid={`${testId}-content`}>
        {formatContent(content)}
      </div>
    </div>
  );
}

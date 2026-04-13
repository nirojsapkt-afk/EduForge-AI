import { useState } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { FileText, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import OutputDisplay from '../components/OutputDisplay';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function WorksheetGenerator() {
  const [form, setForm] = useState({ subject: '', grade_level: '', topic: '', difficulty: 'medium' });
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!form.subject || !form.grade_level || !form.topic) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setOutput('');
    try {
      const { data } = await axios.post(`${API}/generate/worksheet`, form, { withCredentials: true });
      setOutput(data.content);
      toast.success('Worksheet generated successfully!');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Generation failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto animate-fade-in" data-testid="worksheet-page">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center">
            <FileText size={20} className="text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>
            Worksheet Generator
          </h1>
        </div>
        <p className="text-sm text-slate-400">
          Generate professional worksheets with multiple choice and short answer questions.
        </p>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 md:p-8 mb-8" data-testid="worksheet-form">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm text-slate-300">Subject *</Label>
            <Input
              data-testid="worksheet-subject-input"
              placeholder="e.g., Mathematics, Science, History"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-slate-300">Grade Level *</Label>
            <Select value={form.grade_level} onValueChange={(v) => setForm({ ...form, grade_level: v })}>
              <SelectTrigger data-testid="worksheet-grade-select" className="bg-black/20 border-white/10 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent className="bg-[#120E2C] border-white/10">
                {['1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade', 'College'].map(g => (
                  <SelectItem key={g} value={g} className="text-slate-200 focus:bg-violet-600/20 focus:text-white">{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-sm text-slate-300">Topic *</Label>
            <Input
              data-testid="worksheet-topic-input"
              placeholder="e.g., Quadratic Equations, Photosynthesis, World War II"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-slate-300">Difficulty</Label>
            <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
              <SelectTrigger data-testid="worksheet-difficulty-select" className="bg-black/20 border-white/10 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#120E2C] border-white/10">
                <SelectItem value="easy" className="text-slate-200 focus:bg-violet-600/20 focus:text-white">Easy</SelectItem>
                <SelectItem value="medium" className="text-slate-200 focus:bg-violet-600/20 focus:text-white">Medium</SelectItem>
                <SelectItem value="hard" className="text-slate-200 focus:bg-violet-600/20 focus:text-white">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          data-testid="generate-worksheet-button"
          className="mt-6 bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-8 py-2.5 font-medium disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 size={16} className="mr-2 animate-spin" />Generating...</>
          ) : (
            <><Sparkles size={16} className="mr-2" />Generate Worksheet</>
          )}
        </Button>
      </div>

      {loading && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 mb-8" data-testid="loading-state">
          <div className="space-y-4">
            <div className="h-4 rounded shimmer w-3/4" />
            <div className="h-4 rounded shimmer w-1/2" />
            <div className="h-4 rounded shimmer w-5/6" />
            <div className="h-4 rounded shimmer w-2/3" />
            <div className="h-4 rounded shimmer w-4/5" />
          </div>
          <p className="text-center text-sm text-slate-500 mt-6">AI is crafting your worksheet...</p>
        </div>
      )}

      {output && <OutputDisplay content={output} type="Worksheet" testId="worksheet-output" />}
    </div>
  );
}

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { cn } from '../utils/helpers';
import { Upload, FileJson, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

interface ImportPageProps {
  onLoadDemo: () => void;
  onLoadCustom: (data: any) => void;
  isLoading: boolean;
  error: string | null;
}

export function ImportPage({ onLoadDemo, onLoadCustom, isLoading, error }: ImportPageProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      processFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const processFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum size is 10MB.');
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setFileName(file.name);
      setPreviewData({
        activities: parsed.activities?.length || 0,
        timelineEvents: parsed.timelineEvents?.length || 0,
        interests: parsed.interests?.length || 0,
        skills: parsed.skills?.length || 0,
      });
    } catch (err) {
      alert('Invalid JSON file. Please check the format.');
    }
  };

  const handleLoadCustom = () => {
    if (fileInputRef.current?.files?.[0]) {
      onLoadCustom(fileInputRef.current.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-signal-bg flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-signal-accent/10 flex items-center justify-center">
            <Upload className="w-8 h-8 text-signal-accent" />
          </div>
          <h1 className="font-display text-3xl font-bold text-signal-fg mb-2">Load Your Data</h1>
          <p className="text-signal-fgMuted">Import a JSON file or explore with our demo dataset</p>
        </motion.div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="card p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-signal-accent/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
            <Button
              variant="secondary"
              className="w-full py-4"
              onClick={onLoadDemo}
              disabled={isLoading}
            >
              <FileJson className="w-5 h-5 mr-2" />
              <span>Use Demo Dataset</span>
            </Button>
            <p className="text-center text-sm text-signal-fgMuted mt-3">
              6 months · 2,800+ activities · 32 timeline events · 12 interests · 8 skills
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-signal-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-signal-bg text-signal-fgSubtle">or</span>
              </div>
            </div>

            <div
              className={cn(
                'border-2 border-dashed rounded-xl p-8 transition-all duration-200',
                dragActive
                  ? 'border-signal-accent bg-signal-accent/5'
                  : 'border-signal-border hover:border-signal-borderHover'
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                id="file-upload"
                onChange={handleFileSelect}
              />
              <label htmlFor="file-upload" className="cursor-pointer block text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-signal-bgElevated border border-signal-border flex items-center justify-center">
                  <FileJson className="w-7 h-7 text-signal-fgMuted" />
                </div>
                <p className="text-signal-fg mb-1 font-medium">Drop JSON file here or click to browse</p>
                <p className="text-sm text-signal-fgSubtle">Max 10MB · Must contain activities array</p>
              </label>
            </div>

            {fileName && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-signal-bgElevated border border-signal-border rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-signal-accent" />
                    <div>
                      <p className="font-medium text-signal-fg">{fileName}</p>
                      <p className="text-xs text-signal-fgMuted">
                        {previewData && (
                          <>
                            {previewData.activities} activities · {previewData.timelineEvents} events · {previewData.interests} interests · {previewData.skills} skills
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setFileName(''); setPreviewData(null); fileInputRef.current!.value = ''; }}>
                    Remove
                  </Button>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-signal-danger/10 border border-signal-danger/30 rounded-lg flex items-center gap-3 text-signal-danger"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </motion.div>
            )}

            <Button
              className="w-full mt-4 py-3"
              onClick={handleLoadCustom}
              disabled={isLoading || !fileName}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Load Custom Data
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="card p-4"
          >
            <h3 className="font-semibold text-signal-fg mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-signal-warning" />
              Expected JSON Format
            </h3>
            <pre className="bg-signal-bg border border-signal-border rounded-lg p-4 text-xs text-signal-fgMuted overflow-x-auto text-left">
{`{
  "activities": [
    {
      "id": "act_1",
      "date": "2025-06-15",
      "category": "coding",
      "title": "Built API endpoint",
      "duration": 90,
      "platform": "VS Code",
      "tags": ["TypeScript", "REST"],
      "impactScore": 75
    }
  ],
  "timelineEvents": [...],
  "interests": [...],
  "skills": [...]
}`}</pre>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
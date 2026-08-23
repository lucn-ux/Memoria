import React, { useState } from 'react';
import { Download, Upload, FileText, Check, AlertCircle, X, Archive } from 'lucide-react';
import { exportFullArchiveJSON, importArchiveJSON } from '../lib/db';
import { MemoryItem } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryItem[];
  onDataRestored: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  memories,
  onDataRestored,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Export full JSON Vault
  const handleExportJSON = async () => {
    try {
      const json = await exportFullArchiveJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memoria-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to export JSON backup');
    }
  };

  // Export as formatted Markdown archive
  const handleExportMarkdown = () => {
    let mdContent = `# Memoria Archive\n*Exported on ${new Date().toLocaleDateString()}*\n\n---\n\n`;

    memories.forEach((mem) => {
      mdContent += `## ${mem.title || 'Untitled Memory'}\n`;
      mdContent += `**Date:** ${new Date(mem.date).toLocaleDateString()}  \n`;
      if (mem.location) mdContent += `**Location:** ${mem.location}  \n`;
      mdContent += `**Mood:** ${mem.mood}  \n`;
      if (mem.tags.length > 0) mdContent += `**Tags:** #${mem.tags.join(' #')}  \n`;
      mdContent += `\n${mem.content || ''}\n\n`;

      if (mem.aiReflection) {
        mdContent += `> **Poetic Reflection:** ${mem.aiReflection.poeticSummary}\n`;
        mdContent += `> ${mem.aiReflection.reflection}\n\n`;
      }
      mdContent += `---\n\n`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memoria-journal-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle Restore file import
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setImportStatus(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const count = await importArchiveJSON(text);
        setImportStatus(`Successfully restored ${count} memories!`);
        setTimeout(() => {
          onDataRestored();
          onClose();
        }, 1200);
      } catch (err: any) {
        setError(err.message || 'Invalid backup file format');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      id="export-backup-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        id="export-backup-modal-dialog"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Backup & Export Vault
              </h3>
              <p className="text-xs text-slate-500">Protect your curated memories</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {importStatus && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}

        {/* Options */}
        <div className="space-y-3">
          <button
            id="btn-export-full-json"
            onClick={handleExportJSON}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <Archive className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <span className="block font-semibold text-xs text-slate-900 dark:text-slate-100">
                  Export Full Vault (.json)
                </span>
                <span className="text-[11px] text-slate-500">
                  Includes all written notes, tags, media structures & AI reflections
                </span>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400" />
          </button>

          <button
            id="btn-export-markdown-scrapbook"
            onClick={handleExportMarkdown}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div>
                <span className="block font-semibold text-xs text-slate-900 dark:text-slate-100">
                  Export as Markdown Document (.md)
                </span>
                <span className="text-[11px] text-slate-500">
                  Formatted for reading in Obsidian, Notion, or text editors
                </span>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400" />
          </button>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label
              htmlFor="input-restore-backup"
              className="w-full p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-between text-left cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <span className="block font-semibold text-xs text-slate-900 dark:text-slate-100">
                    Restore from Backup
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Upload a previously exported .json archive
                  </span>
                </div>
              </div>
              <input
                id="input-restore-backup"
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

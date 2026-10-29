'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

type ParsedRow = {
  name: string;
  phone: string;
  tags: string;
  valid: boolean;
  duplicate: boolean;
  errors: string[];
};

export default function ImportClientsPage() {
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function parseCSV(text: string): string[][] {
    const lines: string[][] = [];
    const delimiter = text.includes(';') ? ';' : ',';
    let current = '';
    let inQuotes = false;
    let field = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        current += '\n';
        field = '';
      } else if (char === '\n' && !inQuotes) {
        lines.push(current.split('\n'));
        current = '';
        field = '';
      } else if (char !== '\r') {
        current += char;
        field += char;
      }
    }
    if (current) lines.push(current.split('\n'));
    return lines;
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      toast.error('Veuillez selectionner un fichier CSV');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = (ev.target?.result as string) || '';
      const lines = parseCSV(text);

      if (lines.length < 2) {
        toast.error('Le fichier doit contenir au moins une ligne d entete et une ligne de donnees');
        return;
      }

      // Detect header
      const header = lines[0].map((h) => h.trim().toLowerCase());
      const nameIdx = header.findIndex((h) => h.includes('nom') || h.includes('name'));
      const phoneIdx = header.findIndex((h) => h.includes('tel') || h.includes('phone') || h.includes('telephone'));
      const tagsIdx = header.findIndex((h) => h.includes('tag') || h.includes('label'));

      // Fetch existing clients for duplicate detection
      const supabase = createClient();
      const { data: existing } = await supabase
        .from('clients')
        .select('name, phone');
      const existingPhones = new Set((existing || []).map((c) => c.phone.replace(/[\s\-().]/g, '')));
      const existingNames = new Set((existing || []).map((c) => c.name.toLowerCase()));

      const parsed: ParsedRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i];
        if (cols.length < 2) continue;

        const name = (nameIdx >= 0 ? cols[nameIdx] : cols[0]) || '';
        const phone = (phoneIdx >= 0 ? cols[phoneIdx] : cols[1]) || '';
        const tags = (tagsIdx >= 0 ? cols[tagsIdx] : cols[2] || '') || '';

        const errors: string[] = [];
        if (name.trim().length < 2) errors.push('Nom trop court');
        const phoneDigits = phone.trim().replace(/[\s\-().]/g, '');
        if (phoneDigits.length < 8) errors.push('Numero invalide');

        const isDuplicate = existingPhones.has(phoneDigits) || existingNames.has(name.trim().toLowerCase());

        parsed.push({
          name: name.trim(),
          phone: phone.trim(),
          tags: tags.trim(),
          valid: errors.length === 0,
          duplicate: isDuplicate,
          errors,
        });
      }

      setRows(parsed);
      setStep('preview');
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    setImporting(true);
    const supabase = createClient();
    const validRows = rows.filter((r) => r.valid && !r.duplicate);

    let count = 0;
    for (const row of validRows) {
      const { error } = await supabase.from('clients').insert({
        name: row.name,
        phone: row.phone,
        tags: row.tags,
      });
      if (!error) count++;
    }

    setImportedCount(count);
    setImporting(false);
    setStep('done');
    toast.success(`${count} client(s) importe(s)`);
  }

  const validCount = rows.filter((r) => r.valid && !r.duplicate).length;
  const duplicateCount = rows.filter((r) => r.duplicate).length;
  const invalidCount = rows.filter((r) => !r.valid).length;

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/clients">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">Importer des clients</h1>
      </div>

      {step === 'upload' && (
        <Card className="p-6">
          <div
            className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-border p-8 text-center"
            onClick={() => fileRef.current?.click()}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Selectionnez un fichier CSV</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Cliquez pour choisir un fichier
              </p>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFile}
          />

          <div className="mt-6 rounded-lg bg-accent/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Format attendu</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Colonne 1: Nom, Colonne 2: Telephone, Colonne 3: Tags (optionnel)
            </p>
            <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 text-xs text-muted-foreground">{`nom,tel,tags
Mariam Diop,+221771234567,VIP
Fatou Ndiaye,+221781234567,Grossiste`}</pre>
          </div>
        </Card>
      )}

      {step === 'preview' && (
        <div>
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{fileName}</span>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2">
            <Card className="p-3 text-center">
              <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-green-500" />
              <p className="text-lg font-bold text-green-600">{validCount}</p>
              <p className="text-xs text-muted-foreground">Valides</p>
            </Card>
            <Card className="p-3 text-center">
              <AlertTriangle className="mx-auto mb-1 h-5 w-5 text-amber-500" />
              <p className="text-lg font-bold text-amber-600">{duplicateCount}</p>
              <p className="text-xs text-muted-foreground">Doublons</p>
            </Card>
            <Card className="p-3 text-center">
              <XCircle className="mx-auto mb-1 h-5 w-5 text-red-500" />
              <p className="text-lg font-bold text-red-600">{invalidCount}</p>
              <p className="text-xs text-muted-foreground">Invalides</p>
            </Card>
          </div>

          <div className="mb-4 max-h-80 space-y-2 overflow-y-auto">
            {rows.map((row, idx) => (
              <Card
                key={idx}
                className={`p-3 ${!row.valid ? 'border-red-200 bg-red-50' : row.duplicate ? 'border-amber-200 bg-amber-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {row.name || '(vide)'}
                    </p>
                    <p className="text-xs text-muted-foreground">{row.phone}</p>
                    {row.tags && (
                      <p className="text-xs text-muted-foreground">Tags: {row.tags}</p>
                    )}
                  </div>
                  <div className="ml-2 shrink-0">
                    {!row.valid ? (
                      <span className="flex items-center gap-1 text-xs text-red-500">
                        <XCircle className="h-3.5 w-3.5" />
                        {row.errors.join(', ')}
                      </span>
                    ) : row.duplicate ? (
                      <span className="flex items-center gap-1 text-xs text-amber-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Doublon
                      </span>
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {validCount > 0 && (
            <Button
              className="w-full"
              onClick={handleImport}
              disabled={importing}
            >
              {importing
                ? 'Import en cours...'
                : `Importer ${validCount} client${validCount > 1 ? 's' : ''}`}
            </Button>
          )}

          <Button
            variant="outline"
            className="mt-2 w-full"
            onClick={() => {
              setStep('upload');
              setRows([]);
              setFileName('');
              if (fileRef.current) fileRef.current.value = '';
            }}
          >
            Choisir un autre fichier
          </Button>
        </div>
      )}

      {step === 'done' && (
        <Card className="p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-green-500" />
          <h2 className="text-lg font-bold text-foreground">Import termine</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {importedCount} client{importedCount > 1 ? 's' : ''} importe{importedCount > 1 ? 's' : ''} avec succes
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={() => router.push('/clients')}>
              Voir les clients
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStep('upload');
                setRows([]);
                setFileName('');
                setImportedCount(0);
                if (fileRef.current) fileRef.current.value = '';
              }}
            >
              Importer un autre fichier
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

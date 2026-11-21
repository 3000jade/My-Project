import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Database, Download, Upload, ShieldCheck, FileText, ArchiveRestore } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import dataManagementService from '@/services/dataManagementService';

function downloadTextFile(filename, content, contentType = 'application/json') {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminDataManagementPage() {
  const [activeTab, setActiveTab] = useState('import-export');
  const [resource, setResource] = useState('properties');
  const [jsonInput, setJsonInput] = useState('[\n  { "title": "Sample Residence", "price": 12000000 }\n]');
  const [preview, setPreview] = useState(null);
  const [health, setHealth] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadHealth = useCallback(async () => {
    try {
      const data = await dataManagementService.getDataHealth();
      setHealth(data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to load data health.');
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  const handlePreview = async () => {
    setError('');
    setStatusMessage('');
    setBusy(true);
    try {
      const parsed = JSON.parse(jsonInput);
      const result = await dataManagementService.previewImport(resource, parsed);
      setPreview(result);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Invalid JSON input.');
    } finally {
      setBusy(false);
    }
  };

  const handleCommit = async () => {
    if (!preview?.validRows?.length) return;
    setError('');
    setBusy(true);
    try {
      const result = await dataManagementService.commitImport(resource, preview.validRows);
      setStatusMessage(`Saved ${result.insertedCount} record(s) and recorded an audit receipt.`);
      setPreview(null);
      await loadHealth();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to save import.');
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async (format) => {
    setError('');
    setBusy(true);
    try {
      const result = await dataManagementService.exportRecords(resource, format);
      downloadTextFile(result.filename, result.body, result.contentType);
      setStatusMessage(`Exported ${result.count} ${resource} record(s) as ${format.toUpperCase()}.`);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Export failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleSnapshot = async () => {
    setError('');
    setBusy(true);
    try {
      const snapshot = await dataManagementService.exportSnapshot();
      const filename = `cp-kerby-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
      downloadTextFile(filename, JSON.stringify(snapshot, null, 2));
      setStatusMessage('Backup snapshot downloaded and recorded in the audit log.');
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Backup snapshot failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Data Management</h1>
          <p className="text-sm text-slate-500">
            Preview changes before saving, export scoped records, and protect system data.
          </p>
        </div>
        <Badge variant="outline" className="w-fit gap-1.5 border-teal-200 bg-teal-50 text-teal-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          Safety-First Rulebook Active
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {statusMessage && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700">
          <AlertDescription>{statusMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="import-export" className="gap-2">
            <Upload className="h-4 w-4" />
            Import & Export
          </TabsTrigger>
          <TabsTrigger value="backups" className="gap-2">
            <Database className="h-4 w-4" />
            Backups & Health
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <FileText className="h-4 w-4" />
            Site Content
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import-export" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import (Dry-Run Preview)</CardTitle>
              <CardDescription>
                Paste JSON rows to check for missing fields before anything is written to the database.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {['properties', 'inquiries', 'sales'].map((item) => (
                  <Button
                    key={item}
                    type="button"
                    variant={resource === item ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setResource(item);
                      setPreview(null);
                    }}
                  >
                    {item}
                  </Button>
                ))}
              </div>

              <textarea
                aria-label="Import JSON rows"
                className="min-h-32 w-full rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
              />

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={handlePreview} disabled={busy}>
                  Preview Import
                </Button>
                <Button type="button" variant="outline" onClick={() => handleExport('csv')} disabled={busy}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button type="button" variant="outline" onClick={() => handleExport('json')} disabled={busy}>
                  <Download className="mr-2 h-4 w-4" />
                  Export JSON
                </Button>
              </div>

              {preview && (
                <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-semibold text-slate-800">Preview Summary:</span>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      {preview.validCount} Valid
                    </Badge>
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                      {preview.invalidCount} Skipped
                    </Badge>
                  </div>
                  {preview.invalidRows.length > 0 && (
                    <ul className="list-disc pl-5 text-xs text-red-600">
                      {preview.invalidRows.map((err) => (
                        <li key={err.rowIndex}>
                          Row {err.rowIndex + 1}: {err.reason}
                        </li>
                      ))}
                    </ul>
                  )}
                  {preview.validCount > 0 && (
                    <Button type="button" onClick={handleCommit} disabled={busy}>
                      Confirm & Save {preview.validCount} Record(s)
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArchiveRestore className="h-5 w-5 text-teal-700" />
                System Data Health & Snapshots
              </CardTitle>
              <CardDescription>
                Review active vs. archived records and download a full JSON backup snapshot.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {health.map((row) => (
                  <div key={row.resource} className="rounded-md border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      {row.resource}
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-slate-800">{row.total}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.active} active · {row.archived} archived
                    </p>
                  </div>
                ))}
              </div>
              <Button type="button" onClick={handleSnapshot} disabled={busy}>
                <Download className="mr-2 h-4 w-4" />
                Download Full JSON Snapshot
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Site Content & Featured Collections</CardTitle>
              <CardDescription>
                Banners, FAQs, guides, and featured property groups live in the dedicated Website CMS workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/admin/cms">Open Website CMS</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

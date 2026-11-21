import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Database,
  Download,
  ShieldCheck,
  Copy,
  Check,
  RefreshCw,
  X,
  History,
  Building2,
  MessageSquare,
  TrendingUp,
  Archive,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import dataManagementService from '@/services/dataManagementService';

const BROWSER_LIMIT_BYTES = 50 * 1024 * 1024;
const COOLDOWN_SECONDS = 300;
const STALE_DAYS = 7;

const TABLE_META = {
  properties: { label: 'Properties', icon: Building2, hint: 'Active & archived listings' },
  inquiries: { label: 'Inquiries', icon: MessageSquare, hint: 'Client leads & messages' },
  sales: { label: 'Sales', icon: TrendingUp, hint: 'Closed & recorded deals' },
};

function getManilaDateStamp() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function formatBytesToMb(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

function formatCountdown(sec) {
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${mins}:${String(rem).padStart(2, '0')}`;
}

function getStalenessInfo(lastBackupAt) {
  if (!lastBackupAt) {
    return { label: 'Never backed up', detail: 'No snapshots yet', isStale: false };
  }
  const diffMs = Date.now() - new Date(lastBackupAt).getTime();
  const days = Math.floor(diffMs / 86400000);
  const exact = new Date(lastBackupAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const relative = days === 0 ? 'Today' : days === 1 ? '1 day ago' : `${days} days ago`;
  return {
    label: days >= STALE_DAYS ? 'Stale — 7+ days' : 'Up to date',
    detail: `Last backup: ${relative} · ${exact}`,
    isStale: days >= STALE_DAYS,
  };
}

function downloadJsonFile(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminDataManagementPage() {
  const [tables, setTables] = useState([]);
  const [estimatedBytes, setEstimatedBytes] = useState(0);
  const [lastBackupAt, setLastBackupAt] = useState(null);
  const [recentBackups, setRecentBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [copiedHash, setCopiedHash] = useState('');
  const [error, setError] = useState(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const triggerBtnRef = useRef(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dataManagementService.getBackupSummary();
      setTables(data.tables || []);
      setEstimatedBytes(data.estimatedBytes || 0);
      setLastBackupAt(data.lastBackupAt || null);
      setRecentBackups(data.recentBackups || []);
      if (data.cooldownRemainingSec > 0) {
        setCooldownSec(data.cooldownRemainingSec);
      }
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      if (status === 401) {
        setSessionExpired(true);
        return;
      }
      setError({
        message: err?.message || err?.data?.error || 'Failed to load backup summary.',
        retryAction: 'summary',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (cooldownSec <= 0) return undefined;
    const timer = setInterval(() => {
      setCooldownSec((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSec]);

  const handleDialogOpenChange = (open) => {
    setDialogOpen(open);
    if (!open) {
      requestAnimationFrame(() => triggerBtnRef.current?.focus());
    }
  };

  const handleDownloadSnapshot = async () => {
    setDialogOpen(false);
    setError(null);
    setReceipt(null);
    setDownloading(true);
    setLiveAnnouncement('Backup download started. Preparing snapshot.');

    try {
      const snapshot = await dataManagementService.exportSnapshot();
      const filename = `cp-kerby-backup-${getManilaDateStamp()}.json`;
      downloadJsonFile(filename, snapshot);

      const shortHash = snapshot?._metadata?.sha256 ? snapshot._metadata.sha256.slice(0, 12) : 'verified';
      setReceipt({ filename, sha256: shortHash });
      setCooldownSec(COOLDOWN_SECONDS);
      setLiveAnnouncement(`Backup snapshot downloaded. Verification hash ${shortHash}. Cooldown active for 5 minutes.`);
      await loadSummary();
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      if (status === 401) {
        setSessionExpired(true);
      } else if (status === 429) {
        const retryHeader = Number(err?.response?.headers?.['retry-after']);
        setCooldownSec(Number.isFinite(retryHeader) && retryHeader > 0 ? retryHeader : COOLDOWN_SECONDS);
        setLiveAnnouncement('Backup cooldown is active.');
      } else {
        setError({
          message: err?.message || err?.data?.error || 'Failed to download backup snapshot.',
          retryAction: 'download',
        });
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyHash = async (hash) => {
    try {
      await navigator.clipboard?.writeText(hash);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(''), 2000);
    } catch {
      // Clipboard API unavailable in restricted contexts
    }
  };

  const displayTables =
    tables.length > 0
      ? tables
      : [
          { table: 'properties', count: 0 },
          { table: 'inquiries', count: 0 },
          { table: 'sales', count: 0 },
        ];

  const totalRecords = displayTables.reduce((sum, item) => sum + item.count, 0);
  const sizePercent = Math.min(100, Math.round((estimatedBytes / BROWSER_LIMIT_BYTES) * 100));
  const isNearThreshold = sizePercent >= 80;
  const staleness = getStalenessInfo(lastBackupAt);
  const buttonDisabled = downloading || loading || cooldownSec > 0 || sessionExpired;

  return (
    <div className="space-y-6 p-6">
      <div className="sr-only" aria-live="polite">
        {liveAnnouncement}
      </div>

      <PageHeader
        className="mb-2"
        title="Data Management — Backups"
        subtitle="Create a verified JSON snapshot of core business records for disaster recovery and safekeeping."
        badge={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1.5 border-slate-200 bg-white text-slate-700">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
              Admin Only
            </Badge>
            <Badge
              variant="outline"
              className={
                staleness.isStale
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-slate-200 bg-slate-100 text-slate-600'
              }
            >
              {staleness.label}
            </Badge>
            <span className="text-xs text-slate-500">{staleness.detail}</span>
          </div>
        }
      />

      {sessionExpired && (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>Your session has expired. Please sign in again to download a backup.</span>
            <Button asChild size="sm" variant="outline">
              <Link to="/login">Sign In Again</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>{error.message}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={error.retryAction === 'summary' ? loadSummary : handleDownloadSnapshot}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {receipt && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>
                Downloaded <strong>{receipt.filename}</strong> · Audit receipt saved · SHA-256:{' '}
                <code className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-xs">
                  {receipt.sha256}
                </code>
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label="Copy SHA-256 hash"
                onClick={() => handleCopyHash(receipt.sha256)}
              >
                {copiedHash === receipt.sha256 ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <Button type="button" size="sm" variant="ghost" aria-label="Dismiss receipt" onClick={() => setReceipt(null)}>
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Row 1: 3-Column KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        {displayTables.map((item) => {
          const meta = TABLE_META[item.table] || { label: item.table, icon: Database, hint: 'Records included' };
          const Icon = meta.icon;
          return (
            <Card key={item.table} className="border-slate-200 bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    {item.table}
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-50 text-teal-700">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                {loading ? (
                  <div className="mt-3 space-y-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                ) : (
                  <div className="mt-2">
                    <p className="text-3xl font-bold tabular-nums text-slate-800">{item.count}</p>
                    <p className="mt-1 text-xs text-slate-500">{meta.hint}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Row 2: 2-Column Executive Workspace */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Snapshot Action & Capacity */}
        <Card className="border-slate-200 bg-white lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Database className="h-5 w-5 text-teal-700" />
              System Backup Snapshot
            </CardTitle>
            <CardDescription>
              Full JSON export with UTC timestamps, SHA-256 checksum verification, and automatic Audit Log receipt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-medium">Estimated Export Size</span>
                <span className={isNearThreshold ? 'font-semibold text-amber-700 tabular-nums' : 'tabular-nums'}>
                  {formatBytesToMb(estimatedBytes)} MB / 50 MB · {sizePercent}%
                </span>
              </div>
              <Progress
                value={sizePercent}
                className={isNearThreshold ? '[&_[data-slot=progress-indicator]]:bg-amber-500' : ''}
              />
              <p className="text-xs text-slate-500">
                Includes {totalRecords} total records across active and archived states.
              </p>
            </div>

            <AlertDialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
              <AlertDialogTrigger asChild>
                <Button ref={triggerBtnRef} type="button" className="w-full" disabled={buttonDisabled}>
                  {downloading ? (
                    <>
                      <Spinner size="sm" className="mr-2 text-white" />
                      Preparing Backup...
                    </>
                  ) : cooldownSec > 0 ? (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Available in {formatCountdown(cooldownSec)}
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download Backup Snapshot
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Download Full Backup Snapshot?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Includes {totalRecords} total records (~{formatBytesToMb(estimatedBytes)} MB) across {displayTables.length} tables (properties, inquiries, and sales) and records this download in the Audit Log.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDownloadSnapshot}>
                    Confirm Download
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Right: Recent Backup Activity Mini-Log */}
        <Card className="border-slate-200 bg-white lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                <History className="h-4 w-4 text-teal-700" />
                Recent Backup Activity
              </CardTitle>
              <CardDescription>Last 5 snapshot downloads recorded in the Audit Log.</CardDescription>
            </div>
            <Link to="/broker/audit" className="text-xs font-medium text-teal-700 hover:underline">
              View full Audit Log →
            </Link>
          </CardHeader>
          <CardContent>
            {recentBackups.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50/60 py-10 text-center">
                <Archive className="h-8 w-8 text-slate-400" />
                <p className="mt-2 text-sm font-medium text-slate-700">No backup snapshots recorded yet</p>
                <p className="mt-1 text-xs text-slate-500">
                  Downloaded snapshots and their SHA-256 verification codes will appear here.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Initiated By</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>SHA-256 Prefix</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBackups.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-xs text-slate-600">
                        {new Date(row.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-slate-800">{row.actorName}</TableCell>
                      <TableCell className="tabular-nums text-sm text-slate-800">{row.totalRecords}</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => handleCopyHash(row.sha256Prefix)}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700 hover:bg-slate-200"
                        >
                          {row.sha256Prefix}
                          <Copy className="h-3 w-3" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

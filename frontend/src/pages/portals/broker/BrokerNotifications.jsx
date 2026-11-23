import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/dashboard/PageHeader';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  KpiCard,
  useToast,
  Toaster
} from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '../../../components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import {
  RefreshCw,
  CheckCheck,
  AlertCircle,
  BellOff,
  Mail,
  ShieldCheck,
  Calendar,
  Banknote,
  Building2,
  Bell
} from 'lucide-react';
import { Spinner } from '../../../components/ui';
import { ListSkeleton } from '../../../components/dashboard/skeletons';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '../../../components/ui/empty';
import {
  notificationService,
  formatNotificationTime,
  getNotificationTargetPath,
} from '../../../services/notificationService';

export default function BrokerNotifications() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'READ'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err.message ? `Failed to load system notifications: ${err.message}` : 'Failed to load system notifications.';
      setError(msg);
      toast({ title: 'Notification Error', description: 'Could not synchronize notifications.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const filtered = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.is_read;
    if (filter === 'READ') return n.is_read;
    return true;
  });

  const toggleRead = async (id, currentStatus) => {
    const nextStatus = !currentStatus;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: nextStatus } : n));
    try {
      await notificationService.markAsRead(id, nextStatus);
      toast({
        title: nextStatus ? 'Marked as Read' : 'Marked as Unread',
        description: 'Notification status updated.',
        variant: 'default',
        duration: 2000
      });
    } catch (err) {
      console.warn('Error updating read status:', err.message);
    }
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      await notificationService.markAllAsRead();
      toast({
        title: 'All Caught Up',
        description: 'All system notifications marked as read.',
        variant: 'success',
      });
    } catch (err) {
      console.warn('Error marking all read:', err.message);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const readCount = notifications.length - unreadCount;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'inquiry':
        return <Mail className="size-5" />;
      case 'verification':
        return <ShieldCheck className="size-5" />;
      case 'appointment':
        return <Calendar className="size-5" />;
      case 'sale':
        return <Banknote className="size-5" />;
      default:
        return <Building2 className="size-5" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full font-sans" data-testid="broker-notifications-portal">
      <Toaster />
      <PageHeader
        title="Notifications & System Alerts"
        subtitle="Operational event feed for client inquiries, agent accreditation filings, and transaction milestones."
        className="mb-0"
        actions={
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto min-w-0">
            <Button
              type="button"
              variant="outline"
              onClick={loadNotifications}
              disabled={loading}
              aria-label="Refresh notifications"
              className="h-11 px-4 gap-2 border-[#E2E8F0] dark:border-slate-800"
            >
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="h-11 px-5 bg-[#0F766E] hover:bg-[#115E59] text-white gap-2"
            >
              <CheckCheck className="size-4" />
              <span>Mark All as Read</span>
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="destructive" className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-4 shrink-0" />
            <div>
              <AlertTitle>Notification Sync Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          </div>
          <Button type="button" size="sm" variant="destructive" onClick={loadNotifications}>
            Retry
          </Button>
        </Alert>
      )}

      {/* Top KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          variant="trend"
          title="Total Alerts"
          value={notifications.length}
          icon={Bell}
          footerText="All recorded system events"
        />

        <KpiCard
          variant="action"
          title="Unread Alerts"
          value={unreadCount}
          statusLabel={unreadCount > 0 ? 'Unread' : 'All Read'}
          statusVariant={unreadCount > 0 ? 'coral' : 'success'}
          footerText="Items awaiting review"
          actionLabel={unreadCount > 0 ? 'Filter unread' : undefined}
          onAction={() => setFilter('UNREAD')}
        />

        <KpiCard
          variant="progress"
          title="Read Alerts"
          value={readCount}
          progress={notifications.length ? Math.round((readCount / notifications.length) * 100) : 0}
          targetLabel="Previously acknowledged"
        />
      </div>

      {/* Asymmetric 8/4 Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 min-w-0 flex flex-col gap-4">
          <Tabs value={filter} onValueChange={setFilter} className="w-full">
            <TabsList className="bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 p-1 h-auto">
              <TabsTrigger value="ALL" className="text-xs font-semibold px-4 py-2">
                All Alerts ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="UNREAD" className="text-xs font-semibold px-4 py-2">
                Unread ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="READ" className="text-xs font-semibold px-4 py-2">
                Read ({readCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <ListSkeleton rows={5} />
          ) : filtered.length === 0 ? (
            <Card data-testid="broker-card" className="bg-white dark:bg-slate-900 rounded-xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs">
              <Empty className="p-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BellOff />
                  </EmptyMedia>
                  <EmptyTitle>No notifications found</EmptyTitle>
                  <EmptyDescription>
                    There are no notifications matching the {filter.toLowerCase()} filter.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(item => (
                <Card
                  key={item.id}
                  data-testid="broker-card"
                  onClick={async () => {
                    if (!item.is_read) await toggleRead(item.id, false);
                    navigate(getNotificationTargetPath(item, 'broker'));
                  }}
                  className={`border border-[#E2E8F0] dark:border-slate-800 shadow-xs transition-colors overflow-hidden cursor-pointer ${
                    !item.is_read ? 'bg-[#FF6B6B]/5 dark:bg-rose-950/20' : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <CardContent className="p-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          !item.is_read
                            ? 'bg-[#FF6B6B]/15 text-[#FF6B6B]'
                            : 'bg-[#0F766E]/10 text-[#0F766E] dark:text-teal-400'
                        }`}
                      >
                        {getNotificationIcon(item.type)}
                      </div>
                      <div className="flex flex-col gap-1 font-sans">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-[#1E293B] dark:text-slate-100">{item.title}</h4>
                          {!item.is_read && (
                            <span className="size-2 rounded-full bg-[#FF6B6B]" aria-label="Unread alert" />
                          )}
                        </div>
                        <p className="text-xs text-[#64748B] dark:text-slate-300 leading-relaxed max-w-xl">
                          {item.message}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-[#64748B] dark:text-slate-400 pt-1">
                          <span className="tabular-nums">{formatNotificationTime(item.created_at)}</span>
                          {item.related_record && (
                            <>
                              <span>•</span>
                              <span>Related ID: {item.related_record}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRead(item.id, item.is_read);
                      }}
                      aria-label={item.is_read ? "Mark Unread" : "Mark Read"}
                      className="text-xs font-semibold text-[#0F766E] dark:text-teal-400 shrink-0"
                    >
                      {item.is_read ? 'Mark Unread' : 'Mark Read'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="bg-white dark:bg-slate-900 border-[#E2E8F0] dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
              <CardTitle className="text-base font-bold text-[#1E293B] dark:text-slate-100">
                Alert Triage Summary
              </CardTitle>
              <CardDescription className="text-xs text-[#64748B] dark:text-slate-400">
                Quick actions for your notification inbox
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#64748B] dark:text-slate-400">Unread items</span>
                <Badge variant="outline" className="font-mono tabular-nums">
                  {unreadCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#64748B] dark:text-slate-400">Read items</span>
                <Badge variant="outline" className="font-mono tabular-nums">
                  {readCount}
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="pt-3 border-t border-[#E2E8F0] dark:border-slate-800 flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={markAllRead}
                disabled={unreadCount === 0}
                className="w-full h-11 gap-2"
              >
                <CheckCheck className="size-4" />
                <span>Mark All as Read</span>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

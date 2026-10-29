'use client';

import { useState } from 'react';
import { ScrollText } from 'lucide-react';
import { useAuditLogs } from '../../../../hooks/useAdmin';
import { ActionBadge, AdminPageHeader, AdminTableFooter } from '../../../../components/admin';
import { Avatar, Button, EmptyState, Input, Select } from '../../../../components/ui';
import { cn } from '../../../../lib/utils/cn';

const ENTITY_TYPE_OPTS = [
  { value: '', label: 'All entities' },
  { value: 'USER', label: 'User' },
  { value: 'PROVIDER', label: 'Provider' },
  { value: 'VEHICLE', label: 'Vehicle' },
  { value: 'BOOKING_REQUEST', label: 'Booking' },
  { value: 'PLATFORM_SETTING', label: 'Setting' },
];

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const [entityIdInput, setEntityIdInput] = useState('');

  const { data, isFetching } = useAuditLogs({
    entityType: entityType || undefined,
    entityId: entityId || undefined,
    page,
  });

  const logs = data?.data ?? [];
  const meta = data?.meta;
  const hasFilters = !!entityType || !!entityId;

  const clearFilters = () => {
    setEntityType('');
    setEntityId('');
    setEntityIdInput('');
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader title="Audit Logs" subtitle="Append-only record of all admin actions." />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(1);
          }}
          className="w-auto"
          aria-label="Filter by entity type"
        >
          {ENTITY_TYPE_OPTS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setEntityId(entityIdInput.trim());
            setPage(1);
          }}
          className="flex gap-2"
        >
          <Input
            type="text"
            placeholder="Entity ID…"
            value={entityIdInput}
            onChange={(e) => setEntityIdInput(e.target.value)}
            className="w-52 font-mono text-xs"
          />
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>

        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear
          </Button>
        )}

        {meta && (
          <p className="ml-auto font-mono text-xs text-text-faint">
            {meta.total.toLocaleString()} entries
          </p>
        )}
      </div>

      {/* Entries */}
      {logs.length === 0 && !isFetching ? (
        <EmptyState
          icon={ScrollText}
          title="No log entries"
          description={
            hasFilters
              ? 'Nothing matches these filters yet.'
              : 'Admin actions will appear here as they happen.'
          }
          action={
            hasFilters
              ? { label: 'Clear filters', onClick: clearFilters, variant: 'secondary' }
              : undefined
          }
        />
      ) : (
        <div
          className={cn(
            'overflow-hidden rounded-card border border-border-subtle bg-surface shadow-xs',
            isFetching && 'opacity-70 transition-opacity',
          )}
        >
          <div className="divide-y divide-border-subtle">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-surface-hover"
              >
                <div className="flex-shrink-0 pt-0.5">
                  <ActionBadge action={log.actionType} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="flex items-center gap-2">
                      <Avatar name={log.adminUser.name} size="sm" tone="ink" />
                      <span className="text-sm font-medium text-ink">{log.adminUser.name}</span>
                    </span>
                    <span className="text-xs text-text-faint">{log.adminUser.email}</span>
                  </div>

                  <p className="mt-1.5 font-mono text-xs text-text-muted">
                    {log.entityType}/{log.entityId.slice(0, 12)}…
                  </p>

                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <p className="mt-1 truncate text-xs text-text-muted">
                      {Object.entries(log.metadata)
                        .filter(([, v]) => v != null && v !== '')
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')}
                    </p>
                  )}

                  {log.ipAddress && (
                    <p className="mt-0.5 font-mono text-[11px] text-text-faint">
                      IP {log.ipAddress}
                    </p>
                  )}
                </div>

                <time className="flex-shrink-0 whitespace-nowrap pt-0.5 font-mono text-xs text-text-faint">
                  {new Date(log.createdAt).toLocaleString('en-PK', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </time>
              </div>
            ))}
          </div>
        </div>
      )}

      {meta && (
        <AdminTableFooter
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

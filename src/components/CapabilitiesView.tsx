import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  attenuateCapability,
  isCapabilityActive,
  revokeCapability,
  updateCapabilityMetadata,
  type CapabilityRight,
  type CapabilityScope,
  type CapabilityToken,
  type GraphNode,
} from '../core/ocapGraph';
import {
  translateUi,
  formatUi,
  type SupportedUiLocale,
} from '../core/locales';

interface CapabilitiesViewProps {
  nodes: GraphNode[];
  capabilities: CapabilityToken[];
  activeCapabilityId: string;
  uiLocale?: SupportedUiLocale;
  onUpdateCapabilities: (caps: CapabilityToken[], activeId: string) => void;
  onAnnounce: (severity: 'info' | 'warning' | 'success', summary: string) => void;
}

const ALL_RIGHTS: CapabilityRight[] = [
  'read',
  'create',
  'update',
  'delete',
  'batch',
  'delegate',
  'revoke',
];

export const CapabilitiesView: React.FC<CapabilitiesViewProps> = ({
  nodes,
  capabilities,
  activeCapabilityId,
  uiLocale = 'en',
  onUpdateCapabilities,
  onAnnounce,
}) => {
  const [attParentId, setAttParentId] = useState(activeCapabilityId);
  const [attLabel, setAttLabel] = useState('');
  const [attHolder, setAttHolder] = useState('');
  const [attScope, setAttScope] = useState<CapabilityScope>('Shard-B');
  const [attRights, setAttRights] = useState<CapabilityRight[]>(['read', 'update']);
  const [editingCapId, setEditingCapId] = useState<string | null>(null);
  const [editCapLabel, setEditCapLabel] = useState('');
  const [editCapHolder, setEditCapHolder] = useState('');
  const editCapLabelRef = useRef<HTMLInputElement>(null);
  const [ocapFeedback, setOcapFeedback] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  const activeCap = useMemo(
    () => capabilities.find((c) => c.id === activeCapabilityId) ?? capabilities[0],
    [capabilities, activeCapabilityId]
  );

  const activeCapValid = useMemo(
    () => (activeCap ? isCapabilityActive(activeCap.id, capabilities) : false),
    [activeCap, capabilities]
  );

  const reachableNodesForActive = useMemo(() => {
    if (!activeCap || !activeCapValid) return [];
    if (activeCap.scope === 'all') return nodes;
    return nodes.filter((n) => n.shard === activeCap.scope);
  }, [activeCap, activeCapValid, nodes]);

  const handleAttenuateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attLabel.trim() || !attHolder.trim()) {
      setOcapFeedback({
        type: 'error',
        text: 'Token label and holder name are required to mint an attenuated capability.',
      });
      return;
    }
    const newId = `cap-${Date.now().toString(36).slice(-4)}`;
    const result = attenuateCapability(attParentId, capabilities, {
      id: newId,
      label: attLabel,
      holder: attHolder,
      rights: attRights,
      scope: attScope,
    });
    if (!result.ok) {
      setOcapFeedback({ type: 'error', text: result.error });
      onAnnounce('warning', result.error);
      return;
    }
    onUpdateCapabilities([...capabilities, result.token], activeCapabilityId);
    setAttLabel('');
    setAttHolder('');
    const msg = `Minted attenuated capability "${result.token.label}" (${result.token.id}) scoped to ${result.token.scope}.`;
    setOcapFeedback({ type: 'success', text: msg });
    onAnnounce('success', msg);
  };

  const handleRevokeCap = (targetId: string) => {
    const res = revokeCapability(capabilities, targetId, activeCapabilityId);
    if (!res.ok) {
      setOcapFeedback({ type: 'error', text: res.error });
      onAnnounce('warning', res.error);
      return;
    }
    onUpdateCapabilities(res.caps, activeCapabilityId);
    if (editingCapId === targetId) setEditingCapId(null);
    const msg = `Revoked capability ${targetId} and invalidated any attenuated descendant tokens.`;
    setOcapFeedback({ type: 'success', text: msg });
    onAnnounce('warning', msg);
  };

  const handleSaveCapEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCapId) return;
    const res = updateCapabilityMetadata(
      capabilities,
      editingCapId,
      activeCapabilityId,
      {
        label: editCapLabel,
        holder: editCapHolder,
      }
    );
    if (!res.ok) {
      setOcapFeedback({ type: 'error', text: res.error });
      onAnnounce('warning', res.error);
      return;
    }
    onUpdateCapabilities(res.caps, activeCapabilityId);
    const msg = `Updated capability ${editingCapId} metadata (${editCapLabel.trim()} · holder: ${editCapHolder.trim()}). Scope and rights remain non-amplified.`;
    setOcapFeedback({ type: 'success', text: msg });
    onAnnounce('success', msg);
    setEditingCapId(null);
  };

  return (
    <section aria-labelledby="ocap-registry-heading" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-[var(--border-hairline)] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-xl">
          <h1
            id="ocap-registry-heading"
            className="text-2xl font-bold tracking-tight text-[var(--text-primary)]"
          >
            {translateUi(uiLocale, 'capRegistryTitle')}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {translateUi(uiLocale, 'capRegistrySubtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div
            className={`inline-flex items-center gap-2 text-xs font-semibold whitespace-nowrap ${
              activeCapValid
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {activeCapValid ? (
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            )}
            <span>
              {activeCapValid
                ? formatUi(uiLocale, 'activeCapStatusLine', {
                    label: activeCap?.label ?? '',
                    scope: activeCap?.scope ?? '',
                    detail: `${reachableNodesForActive.length}/${nodes.length}`,
                  })
                : `${activeCap?.label} (${activeCap?.scope}) · ${translateUi(uiLocale, 'tokenRevokedLabel')}`}
            </span>
          </div>
        </div>
      </div>

      {ocapFeedback && (
        <div
          role={ocapFeedback.type === 'error' ? 'alert' : 'status'}
          aria-live={ocapFeedback.type === 'error' ? 'assertive' : 'polite'}
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            ocapFeedback.type === 'error'
              ? 'border-red-500/50 bg-red-50 text-red-900 dark:bg-red-950/50 dark:text-red-200'
              : 'border-emerald-500/50 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
          }`}
        >
          {ocapFeedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Attenuation Form */}
        <form
          onSubmit={handleAttenuateSubmit}
          noValidate
          className="lg:col-span-5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden="true" />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              {translateUi(uiLocale, 'attenuateTitle')}
            </h2>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            {translateUi(uiLocale, 'attenuateSubtitle')}
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="att-parent"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
                {translateUi(uiLocale, 'parentTokenLabel')}
              </label>
              <select
                id="att-parent"
                value={attParentId}
                onChange={(e) => setAttParentId(e.target.value)}
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-primary)]"
              >
                {capabilities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} ({c.scope})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="att-scope"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
                {translateUi(uiLocale, 'confinedScopeLabel')}
              </label>
              <select
                id="att-scope"
                value={attScope}
                onChange={(e) => setAttScope(e.target.value as CapabilityScope)}
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-primary)]"
              >
                <option value="all">{translateUi(uiLocale, 'scopeAll')}</option>
                <option value="Shard-A">Shard-A</option>
                <option value="Shard-B">Shard-B</option>
                <option value="Shard-C">Shard-C</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="att-label"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
                {translateUi(uiLocale, 'newTokenNameLabel')}
              </label>
              <input
                id="att-label"
                type="text"
                value={attLabel}
                onChange={(e) => setAttLabel(e.target.value)}
                placeholder="e.g. Shard-B Batcher"
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label
                htmlFor="att-holder"
                className="block text-xs font-medium text-[var(--text-secondary)]"
              >
                {translateUi(uiLocale, 'holderPrincipalLabel')}
              </label>
              <input
                id="att-holder"
                type="text"
                value={attHolder}
                onChange={(e) => setAttHolder(e.target.value)}
                placeholder="e.g. Sync Worker"
                className="mt-1 w-full min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-primary)]"
              />
            </div>
          </div>

          <fieldset>
            <legend className="text-xs font-medium text-[var(--text-secondary)]">
              {translateUi(uiLocale, 'attenuatedRightsLabel')}
            </legend>
            <div className="mt-1.5 flex flex-wrap gap-3">
              {ALL_RIGHTS.map((r) => (
                <label
                  key={r}
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--text-primary)] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={attRights.includes(r)}
                    onChange={(e) => {
                      setAttRights((prev) =>
                        e.target.checked
                          ? [...prev, r]
                          : prev.filter((item) => item !== r)
                      );
                    }}
                    className="h-3.5 w-3.5 accent-[var(--accent-primary)]"
                  />
                  <span className="font-mono">{r}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            className="min-h-[40px] w-full rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-xs font-semibold text-[var(--accent-text-on)] hover:bg-[var(--accent-primary-hover)] cursor-pointer"
          >
            {translateUi(uiLocale, 'mintAttenuatedToken')}
          </button>
        </form>

        {/* Capability Registry */}
        <div className="lg:col-span-7 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              {formatUi(uiLocale, 'delegationChainTitle', { count: capabilities.length })}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {translateUi(uiLocale, 'delegationChainSubtitle')}
            </p>
          </div>

          {editingCapId && (
            <form
              onSubmit={handleSaveCapEdit}
              className="rounded-lg bg-[var(--bg-subtle)] p-4 space-y-3"
              aria-label={`Edit metadata for capability ${editingCapId}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-[var(--text-primary)]">
                  {formatUi(uiLocale, 'editingCapTitle', { id: editingCapId })}
                </h3>
                <span className="font-mono text-[11px] text-[var(--text-muted)]">
                  {translateUi(uiLocale, 'scopeRightsLocked')}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="edit-cap-label"
                    className="block text-xs font-medium text-[var(--text-secondary)]"
                  >
                    {translateUi(uiLocale, 'tokenLabelField')}
                  </label>
                  <input
                    ref={editCapLabelRef}
                    id="edit-cap-label"
                    type="text"
                    value={editCapLabel}
                    onChange={(e) => setEditCapLabel(e.target.value)}
                    className="mt-1 w-full min-h-[38px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-cap-holder"
                    className="block text-xs font-medium text-[var(--text-secondary)]"
                  >
                    {translateUi(uiLocale, 'holderPrincipalLabel')}
                  </label>
                  <input
                    id="edit-cap-holder"
                    type="text"
                    value={editCapHolder}
                    onChange={(e) => setEditCapHolder(e.target.value)}
                    className="mt-1 w-full min-h-[38px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCapId(null)}
                  className="min-h-[34px] rounded-lg border border-[var(--border-hairline)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  {translateUi(uiLocale, 'cancelBtn')}
                </button>
                <button
                  type="submit"
                  className="min-h-[34px] rounded-lg bg-[var(--accent-primary)] px-3.5 py-1 text-xs font-semibold text-[var(--accent-text-on)] hover:bg-[var(--accent-primary-hover)] cursor-pointer"
                >
                  {translateUi(uiLocale, 'saveMetadataBtn')}
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] text-[var(--text-muted)]">
                  <th scope="col" className="py-2 pr-2">{translateUi(uiLocale, 'colTokenParent')}</th>
                  <th scope="col" className="py-2 pr-2">{translateUi(uiLocale, 'colScope')}</th>
                  <th scope="col" className="py-2 pr-2">{translateUi(uiLocale, 'colRights')}</th>
                  <th scope="col" className="py-2 pr-2">{translateUi(uiLocale, 'colStatus')}</th>
                  <th scope="col" className="py-2 text-right">{translateUi(uiLocale, 'colAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                {capabilities.map((cap) => {
                  const active = isCapabilityActive(cap.id, capabilities);
                  const isCurrent = cap.id === activeCapabilityId;
                  return (
                    <tr
                      key={cap.id}
                      className={isCurrent ? 'bg-[var(--bg-subtle)]' : undefined}
                    >
                      <td className="py-2.5 pr-2">
                        <div className="font-semibold text-[var(--text-primary)]">
                          {cap.label}
                        </div>
                        <div className="font-mono text-[11px] text-[var(--text-muted)]">
                          {cap.id} · holder: {cap.holder}
                          {cap.parentId ? ` · parent: ${cap.parentId}` : ' · root'}
                        </div>
                      </td>
                      <td className="py-2.5 pr-2 font-mono text-[var(--text-primary)]">
                        {cap.scope}
                      </td>
                      <td className="py-2.5 pr-2 font-mono text-[var(--text-secondary)]">
                        {cap.rights.join(', ')}
                      </td>
                      <td
                        className={`py-2.5 pr-2 font-medium ${
                          active
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {active ? (
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          <span>{active ? translateUi(uiLocale, 'statusActive') : translateUi(uiLocale, 'tokenRevokedLabel')}</span>
                        </span>
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateCapabilities(capabilities, cap.id);
                            onAnnounce(
                              'info',
                              `Switched active capability to ${cap.label} (scope: ${cap.scope}).`
                            );
                          }}
                          disabled={isCurrent}
                          className="min-h-[32px] rounded border border-[var(--border-hairline)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isCurrent ? translateUi(uiLocale, 'activeTokenBtn') : translateUi(uiLocale, 'activateBtn')}
                        </button>
                        {active && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCapId(cap.id);
                              setEditCapLabel(cap.label);
                              setEditCapHolder(cap.holder);
                              onAnnounce(
                                'info',
                                `Editing metadata for capability ${cap.label} (${cap.id}).`
                              );
                              setTimeout(() => editCapLabelRef.current?.focus(), 0);
                            }}
                            aria-label={`Edit capability ${cap.label}`}
                            className="inline-flex min-h-[32px] items-center gap-1 rounded border border-[var(--border-hairline)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
                          >
                            <Edit3 className="h-3 w-3" aria-hidden="true" />
                            <span>{translateUi(uiLocale, 'editBtn')}</span>
                          </button>
                        )}
                        {cap.id !== 'cap-root' && active && (
                          <button
                            type="button"
                            onClick={() => handleRevokeCap(cap.id)}
                            aria-label={`Revoke capability ${cap.label}`}
                            className="min-h-[32px] rounded border border-red-500/50 px-2.5 py-1 text-[11px] font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                          >
                            {translateUi(uiLocale, 'revokeBtn')}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

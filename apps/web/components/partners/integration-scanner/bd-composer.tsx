// BD-only panel: personalize prospect link (name, note, tier, timeline, customize bullets/steps), copy prospect/BD links.

'use client';

import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Eye, Settings2 } from 'lucide-react';
import { INTEGRATION_SCANNER_BD_ROUTE, INTEGRATION_SCANNER_ROUTE } from '@/constants/routes';
import type { BdConfig, CategoryId, PartnershipTier } from './types';
import { DEFAULT_FROM_SUFFIX } from './constants';
import { slugifyProtocol } from './utils';

export interface BdComposerProps {
  bdConfig: BdConfig;
  onChange: (cfg: BdConfig) => void;
  currentProtocol: string;
  selectedCategoryId: CategoryId | null;
  defaultWhyBullets: string[];
  defaultSteps: string[];
}

export function BdComposer({
  bdConfig,
  onChange,
  currentProtocol,
  selectedCategoryId,
  defaultWhyBullets,
  defaultSteps,
}: BdComposerProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(true);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [copiedProspect, setCopiedProspect] = useState(false);
  const [copiedBd, setCopiedBd] = useState(false);

  const buildUrl = (includeBd: boolean): string => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sodax.com';
    const slugSource = currentProtocol.trim();
    const path = includeBd
      ? slugSource
        ? `${INTEGRATION_SCANNER_BD_ROUTE}/${slugifyProtocol(slugSource)}`
        : INTEGRATION_SCANNER_BD_ROUTE
      : slugSource
        ? `${INTEGRATION_SCANNER_ROUTE}/${slugifyProtocol(slugSource)}`
        : INTEGRATION_SCANNER_ROUTE;
    const params = new URLSearchParams();
    if (selectedCategoryId) params.set('cat', selectedCategoryId);
    if (bdConfig.fromName) params.set('from', bdConfig.fromName);
    if (bdConfig.fromSuffix.trim()) params.set('suffix', bdConfig.fromSuffix.trim());
    if (bdConfig.note) params.set('note', bdConfig.note);
    if (bdConfig.tier) params.set('tier', bdConfig.tier);
    if (bdConfig.timeline) params.set('tl', bdConfig.timeline);
    if (bdConfig.customWhy) params.set('why', bdConfig.customWhy);
    if (bdConfig.chains) params.set('chains', bdConfig.chains);
    if (bdConfig.whyOverrides.length > 0) params.set('whys', bdConfig.whyOverrides.join('\n'));
    if (bdConfig.stepsOverrides.length > 0) params.set('steps', bdConfig.stepsOverrides.join('\n'));
    const qs = params.toString();
    return `${origin}${path}${qs ? `?${qs}` : ''}`;
  };

  const handleCopyProspect = async (): Promise<void> => {
    await navigator.clipboard.writeText(buildUrl(false));
    setCopiedProspect(true);
    setTimeout(() => setCopiedProspect(false), 2000);
  };

  const handleCopyBd = async (): Promise<void> => {
    await navigator.clipboard.writeText(buildUrl(true));
    setCopiedBd(true);
    setTimeout(() => setCopiedBd(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl border-2 border-yellow-soda bg-yellow-soda/10 overflow-hidden print:hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(e => !e)}
        className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left hover:bg-yellow-soda/10 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-cherry-dark shrink-0" />
          <span className="font-bold text-[14px] text-cherry-dark">BD Composer</span>
          <span className="hidden sm:inline text-[12px] text-cherry-dark/60 font-normal">
            · Prospect won&apos;t see this panel
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-cherry-dark shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-cherry-dark shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 flex flex-col gap-4 border-t border-yellow-soda/30">
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {(
              [
                ['1', 'Type partner name', 'Use the field above (e.g. Kraken).'],
                ['2', 'Optional: personalise', 'Add your name, note, tier, timeline, and chains for your BD link.'],
                ['3', 'Copy links', 'Send the prospect link to the client. Keep the BD link for yourself.'],
              ] as [string, string, string][]
            ).map(([n, title, desc]) => (
              <div key={n} className="flex gap-3 flex-1 bg-white/60 rounded-2xl px-4 py-3">
                <span className="font-['Shrikhand'] text-[20px] leading-none text-yellow-soda shrink-0 mt-0.5">
                  {n}
                </span>
                <div className="flex flex-col gap-0.5">
                  <p className="font-semibold text-[13px] text-cherry-dark">{title}</p>
                  <p className="font-normal text-[12px] text-cherry-dark/70 leading-[1.4]">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-cherry-dark/5 border border-cherry-dark/10 px-4 py-3">
            <p className="font-normal text-[12px] leading-[1.45] text-cherry-dark/90">
              <strong className="font-semibold text-cherry-dark">Tip:</strong> If you ran the BD Scope Assessment skill
              on the partner&apos;s Notion card, paste the timeline and set the tier here so the prospect link matches
              your internal assessment. Then send this page — partners see their technical requirements instead of a
              generic docs link.
            </p>
          </div>

          <p className="font-normal text-[11px] text-cherry-dark/60 -mt-1">
            Prospects never see this panel; they only see the roadmap. Use the BD link to reopen your personalised view.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 sm:col-span-2 sm:flex-row sm:items-end sm:gap-3">
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <span className="font-medium text-[12px] text-cherry-dark">Your name</span>
                <input
                  type="text"
                  placeholder="e.g. Gosia"
                  value={bdConfig.fromName}
                  onChange={e => onChange({ ...bdConfig, fromName: e.target.value })}
                  className="h-9 px-3 rounded-xl border border-yellow-soda/60 bg-white text-[13px] text-espresso placeholder:text-clay focus:outline-none focus:ring-2 focus:ring-yellow-soda/50"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <span className="font-medium text-[12px] text-cherry-dark">Team / company</span>
                <input
                  type="text"
                  placeholder={DEFAULT_FROM_SUFFIX}
                  value={bdConfig.fromSuffix}
                  onChange={e => onChange({ ...bdConfig, fromSuffix: e.target.value })}
                  className="h-9 px-3 rounded-xl border border-yellow-soda/60 bg-white text-[13px] text-espresso placeholder:text-clay focus:outline-none focus:ring-2 focus:ring-yellow-soda/50"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-medium text-[12px] text-cherry-dark">Partnership tier</span>
              <select
                value={bdConfig.tier}
                onChange={e => onChange({ ...bdConfig, tier: e.target.value as PartnershipTier })}
                className="h-9 px-3 rounded-xl border border-yellow-soda/60 bg-white text-[13px] text-espresso focus:outline-none focus:ring-2 focus:ring-yellow-soda/50"
              >
                <option value="">Not specified</option>
                <option value="basic">Basic Integration</option>
                <option value="standard">Standard Partnership</option>
                <option value="strategic">Strategic Partnership</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-medium text-[12px] text-cherry-dark">Timeline override</span>
              <input
                type="text"
                placeholder="e.g. 1–2 weeks (agreed in call)"
                value={bdConfig.timeline}
                onChange={e => onChange({ ...bdConfig, timeline: e.target.value })}
                className="h-9 px-3 rounded-xl border border-yellow-soda/60 bg-white text-[13px] text-espresso placeholder:text-clay focus:outline-none focus:ring-2 focus:ring-yellow-soda/50"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-medium text-[12px] text-cherry-dark">Prospect&apos;s chains</span>
              <input
                type="text"
                placeholder="e.g. Ethereum, Solana, Base"
                value={bdConfig.chains}
                onChange={e => onChange({ ...bdConfig, chains: e.target.value })}
                className="h-9 px-3 rounded-xl border border-yellow-soda/60 bg-white text-[13px] text-espresso placeholder:text-clay focus:outline-none focus:ring-2 focus:ring-yellow-soda/50"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-yellow-soda/60 bg-white/40 overflow-hidden">
            <button
              type="button"
              onClick={() => setCustomizeOpen(c => !c)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-yellow-soda/5 transition-colors"
              aria-expanded={customizeOpen}
            >
              <span className="font-medium text-[12px] text-cherry-dark flex items-center gap-1.5">
                Customize roadmap content
                {(bdConfig.whyOverrides.length > 0 || bdConfig.stepsOverrides.length > 0) && (
                  <span className="text-cherry-soda">· edited</span>
                )}
              </span>
              {customizeOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-cherry-dark/60 shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-cherry-dark/60 shrink-0" />
              )}
            </button>

            {customizeOpen && (
              <div className="px-4 pb-4 flex flex-col gap-5 border-t border-yellow-soda/30">
                <div className="flex flex-col gap-2 pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[11px] text-cherry-dark uppercase tracking-wide">
                      &ldquo;Why SODAX&rdquo; bullets
                    </span>
                    {bdConfig.whyOverrides.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => onChange({ ...bdConfig, whyOverrides: [] })}
                        className="text-[11px] text-cherry-dark/60 hover:text-cherry-dark underline cursor-pointer"
                      >
                        Reset to defaults
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onChange({ ...bdConfig, whyOverrides: [...defaultWhyBullets] })}
                        className="text-[11px] font-medium text-cherry-soda hover:underline cursor-pointer"
                      >
                        Edit bullets
                      </button>
                    )}
                  </div>
                  {bdConfig.whyOverrides.length === 0 ? (
                    <ul className="flex flex-col gap-1 list-disc list-inside text-[12px] text-cherry-dark/60 pl-1">
                      {defaultWhyBullets.map((b, i) => (
                        <li key={i} className="leading-[1.4]">
                          {b}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {bdConfig.whyOverrides.map((bullet, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={bullet}
                            onChange={e => {
                              const next = [...bdConfig.whyOverrides];
                              next[i] = e.target.value;
                              onChange({ ...bdConfig, whyOverrides: next });
                            }}
                            className="flex-1 h-8 px-2.5 rounded-lg border border-yellow-soda/60 bg-white text-[12px] text-espresso placeholder:text-clay focus:outline-none focus:ring-1 focus:ring-yellow-soda/50"
                            placeholder="Enter bullet…"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              onChange({ ...bdConfig, whyOverrides: bdConfig.whyOverrides.filter((_, j) => j !== i) })
                            }
                            className="w-6 h-6 flex items-center justify-center rounded-md text-cherry-dark/40 hover:text-cherry-dark hover:bg-cherry-dark/5 transition-colors cursor-pointer shrink-0"
                            aria-label="Remove bullet"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => onChange({ ...bdConfig, whyOverrides: [...bdConfig.whyOverrides, ''] })}
                        className="self-start text-[11px] font-medium text-cherry-soda hover:underline cursor-pointer mt-0.5"
                      >
                        + Add bullet
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-3 border-t border-yellow-soda/20">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[11px] text-cherry-dark uppercase tracking-wide">
                      Integration steps
                    </span>
                    {bdConfig.stepsOverrides.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => onChange({ ...bdConfig, stepsOverrides: [] })}
                        className="text-[11px] text-cherry-dark/60 hover:text-cherry-dark underline cursor-pointer"
                      >
                        Reset to defaults
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onChange({ ...bdConfig, stepsOverrides: [...defaultSteps] })}
                        className="text-[11px] font-medium text-cherry-soda hover:underline cursor-pointer"
                      >
                        Edit steps
                      </button>
                    )}
                  </div>
                  {bdConfig.stepsOverrides.length === 0 ? (
                    <ol className="flex flex-col gap-1 list-decimal list-inside text-[12px] text-cherry-dark/60 pl-1">
                      {defaultSteps.map((s, i) => (
                        <li key={i} className="leading-[1.4]">
                          {s}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {bdConfig.stepsOverrides.map((step, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <span className="font-normal text-[11px] text-cherry-dark/40 shrink-0 w-4 text-right">
                            {i + 1}.
                          </span>
                          <input
                            type="text"
                            value={step}
                            onChange={e => {
                              const next = [...bdConfig.stepsOverrides];
                              next[i] = e.target.value;
                              onChange({ ...bdConfig, stepsOverrides: next });
                            }}
                            className="flex-1 h-8 px-2.5 rounded-lg border border-yellow-soda/60 bg-white text-[12px] text-espresso placeholder:text-clay focus:outline-none focus:ring-1 focus:ring-yellow-soda/50"
                            placeholder="Enter step…"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              onChange({
                                ...bdConfig,
                                stepsOverrides: bdConfig.stepsOverrides.filter((_, j) => j !== i),
                              })
                            }
                            className="w-6 h-6 flex items-center justify-center rounded-md text-cherry-dark/40 hover:text-cherry-dark hover:bg-cherry-dark/5 transition-colors cursor-pointer shrink-0"
                            aria-label="Remove step"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => onChange({ ...bdConfig, stepsOverrides: [...bdConfig.stepsOverrides, ''] })}
                        className="self-start text-[11px] font-medium text-cherry-soda hover:underline cursor-pointer mt-0.5"
                      >
                        + Add step
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <label className="flex flex-col gap-1">
            <span className="font-medium text-[12px] text-cherry-dark">Personal note to prospect</span>
            <textarea
              placeholder="e.g. Hi team, following our call I put together this tailored integration roadmap for you..."
              value={bdConfig.note}
              onChange={e => onChange({ ...bdConfig, note: e.target.value })}
              rows={3}
              className="px-3 py-2 rounded-xl border border-yellow-soda/60 bg-white text-[13px] text-espresso placeholder:text-clay focus:outline-none focus:ring-2 focus:ring-yellow-soda/50 resize-none"
            />
          </label>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyProspect}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-full bg-cherry-dark text-white font-medium text-[13px] hover:opacity-90 transition-opacity shrink-0"
            >
              {copiedProspect ? <Check className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {copiedProspect ? 'Copied!' : 'Copy link for prospect'}
            </button>
            <button
              type="button"
              onClick={handleCopyBd}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-full border-2 border-cherry-dark text-cherry-dark font-medium text-[13px] hover:bg-cherry-dark/5 transition-colors shrink-0"
            >
              {copiedBd ? <Check className="w-3.5 h-3.5" /> : <Settings2 className="w-3.5 h-3.5" />}
              {copiedBd ? 'Copied!' : 'Copy BD link (editable)'}
            </button>
            <p className="font-normal text-[11px] text-cherry-dark/60 self-center">
              Prospect link opens without this panel.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

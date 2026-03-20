// BD-only panel: personalize prospect link (name, note, timeline, customize bullets/steps), copy prospect/BD links.

'use client';

import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Eye, Pencil, Save, Settings2 } from 'lucide-react';
import { INTEGRATION_ROADMAP_BD_ROUTE, INTEGRATION_ROADMAP_ROUTE } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { BdConfig, CategoryId, WhyBullet } from '../types';
import { COPY_FEEDBACK_DURATION_MS, DEFAULT_FROM_SUFFIX } from '../data/constants';
import { loadDraftFromStorage, saveDraftToStorage } from '../lib/draft-storage';
import { slugifyProtocol } from '../lib/slug';

export interface BdComposerProps {
  bdConfig: BdConfig;
  onChange: (cfg: BdConfig) => void;
  currentProtocol: string;
  selectedCategoryId: CategoryId | null;
  defaultWhyBullets: WhyBullet[];
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
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [copiedProspect, setCopiedProspect] = useState(false);
  const [copiedBd, setCopiedBd] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const buildUrl = (includeBd: boolean): string => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sodax.com';
    const slugSource = currentProtocol.trim();
    const path = includeBd
      ? slugSource
        ? `${INTEGRATION_ROADMAP_BD_ROUTE}/${slugifyProtocol(slugSource)}`
        : INTEGRATION_ROADMAP_BD_ROUTE
      : slugSource
        ? `${INTEGRATION_ROADMAP_ROUTE}/${slugifyProtocol(slugSource)}`
        : INTEGRATION_ROADMAP_ROUTE;
    const params = new URLSearchParams();
    if (selectedCategoryId) params.set('cat', selectedCategoryId);
    if (bdConfig.fromName) params.set('from', bdConfig.fromName);
    if (bdConfig.fromSuffix.trim()) params.set('suffix', bdConfig.fromSuffix.trim());
    if (bdConfig.note) params.set('note', bdConfig.note);
    if (bdConfig.timeline) params.set('tl', bdConfig.timeline);
    if (bdConfig.customWhy) params.set('why', bdConfig.customWhy);
    if (bdConfig.chains) params.set('chains', bdConfig.chains);
    if (bdConfig.whyOverrides.length > 0) params.set('whys', bdConfig.whyOverrides.join('\n'));
    if (bdConfig.stepsOverrides.length > 0) params.set('steps', bdConfig.stepsOverrides.join('\n'));
    if (bdConfig.nextStep) params.set('ns', bdConfig.nextStep);
    if (bdConfig.blockerNote) params.set('blocker', bdConfig.blockerNote);
    const qs = params.toString();
    return `${origin}${path}${qs ? `?${qs}` : ''}`;
  };

  const handleCopyProspect = async (): Promise<void> => {
    await navigator.clipboard.writeText(buildUrl(false));
    setCopiedProspect(true);
    setTimeout(() => setCopiedProspect(false), COPY_FEEDBACK_DURATION_MS);
  };

  const handleCopyBd = async (): Promise<void> => {
    await navigator.clipboard.writeText(buildUrl(true));
    saveDraftToStorage(bdConfig);
    setCopiedBd(true);
    setTimeout(() => setCopiedBd(false), COPY_FEEDBACK_DURATION_MS);
  };

  const handleSaveDraft = (): void => {
    saveDraftToStorage(bdConfig);
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), COPY_FEEDBACK_DURATION_MS);
  };

  const handleLoadDraft = (): void => {
    const draft = loadDraftFromStorage();
    if (draft) onChange(draft);
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl border-2 border-yellow-soda bg-yellow-soda/10 overflow-visible print:hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-yellow-soda/30">
        <Settings2 className="w-4 h-4 text-cherry-dark shrink-0" />
        <span className="font-bold text-[14px] text-cherry-dark">BD Composer</span>
        <span className="hidden sm:inline text-[12px] text-cherry-dark/60 font-normal">
          · Prospect won&apos;t see this panel
        </span>
      </div>

      <div className="px-6 pb-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {(
              [
                ['1', 'Type partner name', 'Use the field above (e.g. Kraken).'],
                ['2', 'Optional: personalise', 'Add your name, note, timeline, and chains for your BD link.'],
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 min-w-0" htmlFor="bd-from-name">
              <span className="font-medium text-[12px] text-cherry-dark">Your name</span>
              <Input
                id="bd-from-name"
                type="text"
                placeholder="e.g. Gosia"
                value={bdConfig.fromName}
                onChange={e => onChange({ ...bdConfig, fromName: e.target.value })}
                className="h-9 rounded-xl border-yellow-soda/60 bg-white text-[13px] text-espresso placeholder:text-clay focus-visible:ring-yellow-soda/50 focus-visible:border-yellow-soda"
              />
            </label>

            <label className="flex flex-col gap-1 min-w-0" htmlFor="bd-from-suffix">
              <span className="font-medium text-[12px] text-cherry-dark">Team / company</span>
              <Input
                id="bd-from-suffix"
                type="text"
                placeholder={DEFAULT_FROM_SUFFIX}
                value={bdConfig.fromSuffix}
                onChange={e => onChange({ ...bdConfig, fromSuffix: e.target.value })}
                className="h-9 rounded-xl border-yellow-soda/60 bg-white text-[13px] text-espresso placeholder:text-clay focus-visible:ring-yellow-soda/50 focus-visible:border-yellow-soda"
              />
            </label>

            <label className="flex flex-col gap-1" htmlFor="bd-timeline">
              <span className="font-medium text-[12px] text-cherry-dark">Timeline override</span>
              <Input
                id="bd-timeline"
                type="text"
                placeholder="e.g. 1–2 weeks (agreed in call)"
                value={bdConfig.timeline}
                onChange={e => onChange({ ...bdConfig, timeline: e.target.value })}
                className="h-9 rounded-xl border-yellow-soda/60 bg-white text-[13px] text-espresso placeholder:text-clay focus-visible:ring-yellow-soda/50 focus-visible:border-yellow-soda"
              />
            </label>

            <label className="flex flex-col gap-1" htmlFor="bd-chains">
              <span className="font-medium text-[12px] text-cherry-dark">Prospect&apos;s chains</span>
              <Input
                id="bd-chains"
                type="text"
                placeholder="e.g. Ethereum, Solana, Base"
                value={bdConfig.chains}
                onChange={e => onChange({ ...bdConfig, chains: e.target.value })}
                className="h-9 rounded-xl border-yellow-soda/60 bg-white text-[13px] text-espresso placeholder:text-clay focus-visible:ring-yellow-soda/50 focus-visible:border-yellow-soda"
              />
            </label>

            <label className="flex flex-col gap-1 sm:col-span-2" htmlFor="bd-next-step">
              <span className="font-medium text-[12px] text-cherry-dark">
                Next action <span className="font-normal text-cherry-dark/50">(shown to prospect as the single CTA)</span>
              </span>
              <Input
                id="bd-next-step"
                type="text"
                placeholder="e.g. Schedule a 30-min technical call to walk through the deposit flow"
                value={bdConfig.nextStep}
                onChange={e => onChange({ ...bdConfig, nextStep: e.target.value })}
                className="h-9 rounded-xl border-yellow-soda/60 bg-white text-[13px] text-espresso placeholder:text-clay focus-visible:ring-yellow-soda/50 focus-visible:border-yellow-soda"
              />
            </label>

            <label className="flex flex-col gap-1 sm:col-span-2" htmlFor="bd-blocker-note">
              <span className="font-medium text-[12px] text-cherry-dark">
                Blocker / dependency note <span className="font-normal text-cherry-dark/50">(optional — shown above integration steps)</span>
              </span>
              <Input
                id="bd-blocker-note"
                type="text"
                placeholder="e.g. Integration timeline starts once Hedera goes live on SODAX"
                value={bdConfig.blockerNote}
                onChange={e => onChange({ ...bdConfig, blockerNote: e.target.value })}
                className="h-9 rounded-xl border-yellow-soda/60 bg-white text-[13px] text-espresso placeholder:text-clay focus-visible:ring-yellow-soda/50 focus-visible:border-yellow-soda"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-yellow-soda/60 bg-white/40 overflow-visible">
            <button
              type="button"
              onClick={() => setCustomizeOpen(c => !c)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-yellow-soda/5 transition-colors cursor-pointer"
              aria-expanded={customizeOpen}
            >
              <span className="font-medium text-[12px] text-cherry-dark">
                Edit roadmap content
              </span>
              <span className="flex items-center gap-2 shrink-0">
                {(bdConfig.whyOverrides.length > 0 || bdConfig.stepsOverrides.length > 0) && (
                  <span className="text-[11px] font-normal text-cherry-soda">edited</span>
                )}
                {customizeOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-cherry-dark/60" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-cherry-dark/60" />
                )}
              </span>
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
                        onClick={() =>
                          onChange({
                            ...bdConfig,
                            whyOverrides: defaultWhyBullets.map(b =>
                              b.headline ? `${b.headline} — ${b.copy}` : b.copy,
                            ),
                          })
                        }
                        className="flex items-center gap-1 text-[11px] font-medium text-cherry-soda hover:underline cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        Customise
                      </button>
                    )}
                  </div>
                  {bdConfig.whyOverrides.length === 0 ? (
                    <ul className="flex flex-col gap-1.5 pl-1">
                      {defaultWhyBullets.map((b, i) => (
                        <li key={i} className="flex flex-col leading-[1.4]">
                          {b.headline && (
                            <span className="font-medium text-[12px] text-cherry-dark/80">{b.headline}</span>
                          )}
                          <span className="text-[11px] text-cherry-dark/50">{b.copy}</span>
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
                        className="flex items-center gap-1 text-[11px] font-medium text-cherry-soda hover:underline cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        Customise
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

          <label className="flex flex-col gap-1" htmlFor="bd-note">
            <span className="font-medium text-[12px] text-cherry-dark">Personal note to prospect</span>
            <Textarea
              id="bd-note"
              placeholder="e.g. Hi team, following our call I put together this tailored integration roadmap for you..."
              value={bdConfig.note}
              onChange={e => onChange({ ...bdConfig, note: e.target.value })}
              rows={3}
              className="rounded-xl border-yellow-soda/60 bg-white text-[13px] text-espresso placeholder:text-clay focus-visible:ring-yellow-soda/50 focus-visible:border-yellow-soda resize-none min-h-0"
            />
          </label>

          <div className="flex flex-col gap-2 pt-1">
            <p className="font-medium text-[12px] text-cherry-dark">Everything looks good? Share the link.</p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:items-center">
              <Button
                type="button"
                variant="cherry"
                onClick={handleCopyProspect}
                size="default"
                className="h-9 px-4 rounded-full font-medium text-[13px] shrink-0"
              >
                {copiedProspect ? <Check className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {copiedProspect ? 'Copied!' : 'Copy link for prospect'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyBd}
                size="default"
                className="h-9 px-4 rounded-full border border-cherry-grey bg-white text-espresso font-medium text-[13px] hover:bg-cream-white transition-colors shrink-0"
              >
                {copiedBd ? <Check className="w-3.5 h-3.5" /> : <Settings2 className="w-3.5 h-3.5" />}
                {copiedBd ? 'Copied!' : 'Copy BD link (editable)'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                size="default"
                className="h-9 px-4 rounded-full border border-cherry-grey bg-white text-espresso font-medium text-[13px] hover:bg-cream-white transition-colors shrink-0"
              >
                {draftSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {draftSaved ? 'Saved' : 'Save draft'}
              </Button>
              <button
                type="button"
                onClick={handleLoadDraft}
                className="text-[12px] font-medium text-cherry-soda hover:underline cursor-pointer shrink-0 self-center sm:self-center"
              >
                Load saved draft
              </button>
            </div>
            <p className="font-normal text-[11px] text-cherry-dark/60">
              Prospect link opens without this panel. Save draft to restore your options next time.
            </p>
          </div>
        </div>
    </div>
  );
}

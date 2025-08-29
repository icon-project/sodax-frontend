'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SpokeChainId } from '@sodax/types';
import { Label } from '@/components/ui/label';
import { chainIdToChainName } from '@/constants';

export function SelectChain({
  chainList,
  value,
  setChain,
  placeholder,
  id,
  label,
}: {
  chainList: SpokeChainId[];
  value: SpokeChainId;
  setChain: (value: SpokeChainId) => void;
  placeholder?: string;
  id?: string;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <Select value={value.toString()} onValueChange={v => setChain(v as SpokeChainId)}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {chainList.map(chain => (
            <SelectItem key={chain} value={chain.toString()}>
              {chainIdToChainName(chain)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

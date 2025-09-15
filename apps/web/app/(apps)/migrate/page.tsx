'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useMigrationStore } from './_stores/migration-store-provider';
import { IcxsodaMigration, BnusdMigration } from './_components';
import { MIGRATION_MODE_BNUSD, MIGRATION_MODE_ICX_SODA } from './_stores/migration-store';

export default function MigratePage() {
  const migrationMode = useMigrationStore(state => state.migrationMode);
  const setMigrationMode = useMigrationStore(state => state.setMigrationMode);

  return (
    <div className="flex flex-col w-full gap-(--layout-space-comfortable)">
      <div className="inline-flex flex-col justify-start items-start gap-(--layout-space-comfortable)">
        <div className="mix-blend-multiply justify-end">
          <span className="text-yellow-dark font-bold leading-9 font-['InterRegular'] !text-(size:--app-title)">
            SODAX{' '}
          </span>
          <span className="text-yellow-dark font-normal font-['Shrikhand'] leading-9 !text-(size:--app-title)">
            migration
          </span>
        </div>
        <ToggleGroup
          type="single"
          value={migrationMode}
          onValueChange={value => {
            if (value && (value === MIGRATION_MODE_ICX_SODA || value === MIGRATION_MODE_BNUSD)) {
              setMigrationMode(value);
            }
          }}
          className="h-12 w-64 px-1 border border-4 border-cream-white rounded-full mix-blend-multiply"
        >
          <ToggleGroupItem value={MIGRATION_MODE_ICX_SODA} className="cursor-pointer">
            ICX & SODA
          </ToggleGroupItem>
          <ToggleGroupItem value={MIGRATION_MODE_BNUSD} className="cursor-pointer">
            bnUSD
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {migrationMode === MIGRATION_MODE_ICX_SODA ? <IcxsodaMigration /> : <BnusdMigration />}
    </div>
  );
}

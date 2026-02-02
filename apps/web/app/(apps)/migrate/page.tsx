'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useMigrationStore } from './_stores/migration-store-provider';
import { IcxsodaMigration, BnusdMigration } from './_components';
import { MIGRATION_MODE_BNUSD, MIGRATION_MODE_ICX_SODA } from './_stores/migration-store';
import { itemVariants, listVariants } from '@/constants/animation';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function MigratePage() {
  const migrationMode = useMigrationStore(state => state.migrationMode);
  const setMigrationMode = useMigrationStore(state => state.setMigrationMode);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsOpen(true);
    }, 500);
  }, []);
  return (
    <motion.div
      className="flex flex-col w-full gap-(--layout-space-comfortable)"
      variants={listVariants}
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
    >
      <div className="inline-flex flex-col justify-start items-start gap-(--layout-space-comfortable)">
        <motion.div className="mix-blend-multiply justify-end" variants={itemVariants}>
          <span className="text-yellow-dark font-bold leading-9 font-['InterRegular'] !text-(size:--app-title)">
            SODAX{' '}
          </span>
          <span className="text-yellow-dark font-normal font-['Shrikhand'] leading-9 !text-(size:--app-title)">
            migration
          </span>
        </motion.div>
        <motion.div variants={itemVariants}>
          <ToggleGroup
            type="single"
            value={migrationMode}
            onValueChange={value => {
              if (value && (value === MIGRATION_MODE_ICX_SODA || value === MIGRATION_MODE_BNUSD)) {
                setMigrationMode(value);
              }
            }}
            className="h-12 w-64 px-1 border-4 border-cream-white rounded-full mix-blend-multiply"
          >
            <ToggleGroupItem value={MIGRATION_MODE_ICX_SODA} className="cursor-pointer">
              ICX & SODA
            </ToggleGroupItem>
            <ToggleGroupItem value={MIGRATION_MODE_BNUSD} className="cursor-pointer">
              bnUSD
            </ToggleGroupItem>
          </ToggleGroup>
        </motion.div>
      </div>

      {migrationMode === MIGRATION_MODE_ICX_SODA ? <IcxsodaMigration /> : <BnusdMigration />}
    </motion.div>
  );
}

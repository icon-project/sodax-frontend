import {MigrationStoreProvider } from './_stores/migration-store-provider'

export default function MigratePageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MigrationStoreProvider>{children}</MigrationStoreProvider>
}

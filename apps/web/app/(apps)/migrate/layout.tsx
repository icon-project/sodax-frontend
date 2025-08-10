import { CounterStoreProvider } from './_stores/counter-store-provider'

export default function MigratePageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CounterStoreProvider>{children}</CounterStoreProvider>
}

import { redirect } from 'next/navigation';
import { DISCORD_ROUTE } from '@/constants/routes';

export default function PressPage() {
  redirect(DISCORD_ROUTE);
}

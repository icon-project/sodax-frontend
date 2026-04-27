import { redirect } from 'next/navigation';
import { DISCORD_INVITE_ROUTE } from '@/constants/routes';

export default function PressPage() {
  redirect(DISCORD_INVITE_ROUTE);
}

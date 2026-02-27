import { redirect } from 'next/navigation';
import { DISCORD_ROUTE } from '@/constants/routes';

export default function DiscordRedirectPage() {
  redirect(DISCORD_ROUTE);
}

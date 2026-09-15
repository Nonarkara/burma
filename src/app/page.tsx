import { redirect } from 'next/navigation';

export default function RootPage() {
  // Default to Burmese — the primary locale.
  redirect('/my');
}
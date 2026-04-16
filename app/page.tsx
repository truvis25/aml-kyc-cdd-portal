import { redirect } from 'next/navigation';

export default function HomePage() {
  // Root path redirects to sign-in
  // Middleware will redirect authenticated users to /dashboard
  redirect('/sign-in');
}

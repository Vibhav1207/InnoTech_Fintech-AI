import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
  const router = useRouter();
  
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <nav className="bg-gray-800 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
                <Link href="/" className="text-xl font-bold hover:text-gray-200">AI Portfolio Manager</Link>
                <div className="flex gap-4 text-sm">
                    <Link href="/dashboard" className={`hover:text-blue-300 ${router.pathname === '/dashboard' ? 'text-blue-400 font-bold' : ''}`}>Dashboard</Link>
                    <Link href="/trade" className={`hover:text-blue-300 ${router.pathname === '/trade' ? 'text-blue-400 font-bold' : ''}`}>Trade</Link>
                </div>
            </div>
        </div>
      </nav>
      <main className="flex-grow bg-gray-50">
        {children}
      </main>
      <footer className="bg-gray-800 text-gray-400 p-4 text-center text-xs">
        &copy; 2026 InnoTech Fintech AI
      </footer>
    </div>
  );
}

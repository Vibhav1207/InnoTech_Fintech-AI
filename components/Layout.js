import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
  const router = useRouter();
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    )},
    { name: 'Trade Station', path: '/trade', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
    )}
  ];

  return (
    <div className="min-h-screen flex bg-slate-900 font-sans text-slate-100">
      {/* Sidebar Navigation - Professional Dark Theme */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 fixed h-full z-20 hidden md:block">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2 text-blue-500">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xl font-bold tracking-tight text-white">InnoTech<span className="text-blue-500">.AI</span></span>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = router.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 group
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <span className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'}`}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              IT
            </div>
            <div>
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-slate-500">Premium Access</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed w-full top-0 z-20 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between shadow-sm">
         <span className="text-lg font-bold text-white">InnoTech<span className="text-blue-500">.AI</span></span>
         <div className="flex gap-4">
            {navItems.map(item => (
                <Link key={item.path} href={item.path} className={`text-sm font-medium ${router.pathname === item.path ? 'text-blue-500' : 'text-slate-400'}`}>
                    {item.name}
                </Link>
            ))}
         </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow md:ml-64 p-6 md:p-8 mt-16 md:mt-0 overflow-x-hidden bg-[#0f172a]">
        <div className="max-w-7xl mx-auto animate-fadeIn">
          {children}
        </div>
      </main>
    </div>
  );
}

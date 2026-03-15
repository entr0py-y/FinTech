import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="px-6 py-4 flex justify-between items-center bg-white border-b border-slate-200">
        <div className="text-2xl font-bold text-slate-900">Shark<span className="text-blue-900">List</span></div>
        <nav className="flex gap-4">
          <Link href="/auth/investor" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Investors</Link>
          <Link href="/auth/founder" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Founders</Link>
        </nav>
      </header>

      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-3xl text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
            SharkList: Connecting Founders with <span className="text-blue-900">Serious Investors</span>.
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            SharkList is the premier platform where visionary startups meet experienced capital. Join our exclusive network today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/auth/investor"
              className="px-8 py-4 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20"
            >
              Join as Investor
            </Link>
            <Link
              href="/auth/founder"
              className="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 transition-colors shadow-sm"
            >
              Pitch your Startup
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

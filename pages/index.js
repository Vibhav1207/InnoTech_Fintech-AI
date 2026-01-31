import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to AI Portfolio Manager</h1>
      <p>Your intelligent assistant for trading and portfolio management.</p>
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px' }}>
        <Link href="/dashboard"><button>Go to Dashboard</button></Link>
        <Link href="/trade"><button>Start Trading</button></Link>
      </div>
    </div>
  )
}

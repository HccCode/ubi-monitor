export default function Navbar() {
  return (
    <nav className="glass-nav">
      <div className="nav-title">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
        </svg>
        UBNT Analytics
      </div>
      <div className="live-badge">
        <span className="live-dot"></span> Live
      </div>
    </nav>
  );
}
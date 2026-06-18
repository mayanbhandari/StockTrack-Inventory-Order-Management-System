import { NavLink, Outlet } from 'react-router-dom';
import Footer from './Footer';
import './Layout.css';

const navItems = [
  // Top navigation links for the main workflow.
  { to: '/', label: 'Dashboard', icon: '▦', end: true },
  { to: '/products', label: 'Products', icon: '◫' },
  { to: '/customers', label: 'Customers', icon: '◉' },
  { to: '/orders', label: 'Orders', icon: '◎' },
];

export default function Layout() {
  // Shared shell keeps header, page content, and footer consistent.
  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar-accent" />
        <div className="container top-bar-inner">
          <NavLink to="/" className="brand">
            <span className="brand-mark">ST</span>
            <div>
              <strong>StockTrack</strong>
              <small>Inventory & Order Management</small>
            </div>
          </NavLink>
          <nav className="main-nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="main-content container">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

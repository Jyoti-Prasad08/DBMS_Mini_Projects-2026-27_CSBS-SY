/**
 * Navbar.jsx — User-facing cinema navigation
 * Shows: Browse Shows | My Reservations | My Tickets | Snack Bar | Deals & Offers
 * Plus a single profile button linking directly to My Profile (no profile switcher)
 */
import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Film, Ticket, Tag, Coffee, BookmarkCheck,
  Menu, X, Clapperboard, User
} from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser } = useUser();

  const closeMobile = () => setMobileOpen(false);

  const navItems = [
    { to: '/shows',    label: 'Browse Shows',    icon: Film },
    { to: '/bookings', label: 'My Reservations', icon: BookmarkCheck },
    { to: '/tickets',  label: 'My Tickets',      icon: Ticket },
    { to: '/snacks',   label: 'Snack Bar',        icon: Coffee },
    { to: '/coupons',  label: 'Deals & Offers',  icon: Tag },
  ];

  const initials = currentUser
    ? `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand */}
        <Link to="/" className="navbar-brand" onClick={closeMobile}>
          <div className="navbar-brand-icon">
            <Clapperboard size={20} />
          </div>
          <span>CineVerse</span>
        </Link>

        {/* Mobile toggle */}
        <button
          className="nav-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Nav links */}
        <ul className={`navbar-nav ${mobileOpen ? 'open' : ''}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={closeMobile}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* Single Profile Button (Direct link to My Profile — no dropdown) */}
        <div className="navbar-profile">
          <Link
            to="/profile"
            className="profile-btn profile-btn--active"
            onClick={closeMobile}
            title="My Profile"
          >
            <div className="profile-avatar-sm">
              {currentUser ? initials : <User size={15} />}
            </div>
            <span className="profile-name">
              {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'My Profile'}
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

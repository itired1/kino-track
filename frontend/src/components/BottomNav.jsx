import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Sparkles, Users, Clock, User } from 'lucide-react';

function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  const navItems = [
    { id: 'search', label: 'Поиск', icon: Search, path: '/search' },
    { id: 'recommendations', label: 'Новинки', icon: Sparkles, path: '/recommendations' },
    { id: 'friends', label: 'Друзья', icon: Users, path: '/friends' },
    { id: 'history', label: 'История', icon: Clock, path: '/history' },
    { id: 'profile', label: 'Профиль', icon: User, path: '/profile' }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = path === item.path;
        return (
          <Link
            key={item.id}
            to={item.path}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default BottomNav;

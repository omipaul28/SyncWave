import { NavLink } from 'react-router-dom';
import { Home, Search, Library } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',        label: 'Home',    icon: Home },
  { to: '/search',  label: 'Search',  icon: Search },
  { to: '/library', label: 'Library', icon: Library },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden flex items-center justify-around bg-surface-raised border-t border-surface-border pb-safe pt-2 px-2 z-40 relative">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
              }`
            }
          >
            <Icon className="w-6 h-6" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

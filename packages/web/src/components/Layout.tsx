import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Image, Settings as SettingsIcon } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const titles: Record<string, string> = {
    '/': '今天发什么',
    '/assets': '基准图',
    '/settings': '设置'
  };
  const subtitles: Record<string, string> = {
    '/': '芒狗 mango 的小红书日更助手',
    '/assets': '锁住芒狗 IP 形象',
    '/settings': '后端连接 & 模型状态'
  };

  return (
    <div className="min-h-screen flex flex-col max-w-[480px] mx-auto">
      <header className="px-5 pt-6 pb-4 relative">
        <div className="absolute inset-x-0 top-0 h-20 dot-pattern opacity-50 pointer-events-none"></div>
        <h1 className="font-display text-3xl text-mango-text relative">
          {titles[location.pathname] || '今天发什么'}
        </h1>
        <p className="text-sm text-mango-muted mt-1 font-hand relative">
          {subtitles[location.pathname] || ''}
        </p>
      </header>

      <main className="flex-1 px-5 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 max-w-[480px] mx-auto bg-mango-card border-t border-mango-primary/30 shadow-soft">
        <div
          className="flex items-center justify-around py-2"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          <TabLink to="/" icon={<Home size={22} />} label="首页" />
          <TabLink to="/assets" icon={<Image size={22} />} label="基准图" />
          <TabLink to="/settings" icon={<SettingsIcon size={22} />} label="设置" />
        </div>
      </nav>
    </div>
  );
}

function TabLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-button btn-press ${
          isActive ? 'text-mango-primary-dark' : 'text-mango-muted'
        }`
      }
    >
      {icon}
      <span className="text-xs">{label}</span>
    </NavLink>
  );
}

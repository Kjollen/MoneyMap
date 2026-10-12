import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, PieChart, PiggyBank, CreditCard,
  Target, LogOut, Menu, Sun, Moon, Plus, ChevronRight, X
} from 'lucide-react';
import { getCurrentUser, onAuthStateChange, signOut, getTheme, saveTheme } from './store';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Analytics from './components/Analytics';
import Budget from './components/Budget';
import CreditCards from './components/CreditCards';
import Loans from './components/Loans';
import Planning from './components/Planning';

function Layout({ children, theme, toggleTheme }: { children: React.ReactNode; theme: string; toggleTheme: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    getCurrentUser().then(setUser);
    const unsubscribe = onAuthStateChange(setUser);
    return () => unsubscribe();
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance < -50;
    const isRightSwipe = distance > 50;
    
    if (isLeftSwipe && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Дашборд', icon: LayoutDashboard, short: '🏠' },
    { path: '/transactions', label: 'Транзакции', icon: ArrowLeftRight, short: '💸' },
    { path: '/analytics', label: 'Аналитика', icon: PieChart, short: '📊' },
    { path: '/budget', label: 'Бюджет', icon: PiggyBank, short: '🐷' },
    { path: '/credit-cards', label: 'Карты', icon: CreditCard, short: '💳' },
    { path: '/loans', label: 'Кредиты', icon: Target, short: '🏦' },
    { path: '/planning', label: 'Планирование', icon: Target, short: '🎯' },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const currentPath = location.pathname;
  const addAction = currentPath + '?action=add';

  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Вертикальная полоса для свайпа */}
      <div 
        className="fixed left-0 top-0 bottom-0 w-6 z-[60] lg:hidden"
        onTouchStart={(e) => {
          setTouchStart(e.touches[0].clientX);
          setTouchEnd(null);
        }}
        onTouchMove={(e) => {
          setTouchEnd(e.touches[0].clientX);
        }}
        onTouchEnd={() => {
          if (touchStart !== null && touchEnd !== null) {
            const distance = touchEnd - touchStart;
            if (distance > 50) {
              setSidebarOpen(true);
            }
          }
          setTouchStart(null);
          setTouchEnd(null);
        }}
      />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ' + (sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">💰 MoneyMap</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Учёт финансов</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                  className={'flex items-center gap-3 px-4 py-3 rounded-lg transition-all ' + (active ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700')}>
                  <Icon size={20} />
                  <span>{item.label}</span>
                  {active && <ChevronRight size={16} className="ml-auto" />}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 px-4 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.email || 'Гость'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={toggleTheme} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                {theme === 'dark' ? 'Светлая' : 'Тёмная'}
              </button>
              <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 pb-16 lg:pb-0">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 lg:px-8 py-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <Menu size={24} className="text-gray-600 dark:text-gray-300" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {navItems.find(i => i.path === location.pathname)?.label || 'Дашборд'}
          </h2>
          <Link to={addAction} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition shadow-sm">
            <Plus size={16} />
            <span className="hidden sm:inline">Добавить</span>
          </Link>
        </header>
        <div className="p-4 lg:p-8">{children}</div>
      </main>

      {/* Нижняя навигация для мобильных */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 lg:hidden">
        <div className="flex justify-around items-center h-16">
          {navItems.slice(0, 5).map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={'flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all ' + (active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400')}>
                <Icon size={20} />
                <span className="text-xs mt-1">{item.short}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then(u => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Загрузка...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const [theme, setTheme] = useState(getTheme());

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    saveTheme(theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><Layout theme={theme} toggleTheme={toggleTheme}><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><Layout theme={theme} toggleTheme={toggleTheme}><Transactions /></Layout></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Layout theme={theme} toggleTheme={toggleTheme}><Analytics /></Layout></ProtectedRoute>} />
        <Route path="/budget" element={<ProtectedRoute><Layout theme={theme} toggleTheme={toggleTheme}><Budget /></Layout></ProtectedRoute>} />
        <Route path="/credit-cards" element={<ProtectedRoute><Layout theme={theme} toggleTheme={toggleTheme}><CreditCards /></Layout></ProtectedRoute>} />
        <Route path="/loans" element={<ProtectedRoute><Layout theme={theme} toggleTheme={toggleTheme}><Loans /></Layout></ProtectedRoute>} />
        <Route path="/planning" element={<ProtectedRoute><Layout theme={theme} toggleTheme={toggleTheme}><Planning /></Layout></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

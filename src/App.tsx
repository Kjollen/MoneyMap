import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, PieChart, PiggyBank, CreditCard,
  Target, LogOut, Menu, Sun, Moon, Plus, ChevronRight, Landmark
} from 'lucide-react';
import { getCurrentUser, onAuthStateChange, signOut, getTheme, saveTheme } from './store';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Analytics from './components/Analytics';
import Budget from './components/Budget';
import CreditCards from './components/CreditCards';
import Planning from './components/Planning';
import Loans from './components/Loans';

function Layout({ children, theme, toggleTheme }: { children: React.ReactNode; theme: string; toggleTheme: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser().then(setUser);
    const { data: { subscription } } = onAuthStateChange(setUser);
    return () => subscription.unsubscribe();
  }, []);

    const navItems = [
    { path: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
    { path: '/transactions', label: 'Транзакции', icon: ArrowLeftRight },
    { path: '/analytics', label: 'Аналитика', icon: PieChart },
    { path: '/budget', label: 'Бюджет', icon: PiggyBank },
    { path: '/credit-cards', label: 'Карты', icon: CreditCard },
    { path: '/loans', label: 'Кредиты', icon: Landmark },
    { path: '/planning', label: 'Планирование', icon: Target },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              💰 <span>MoneyMap</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Учёт финансов</p>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    active
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                  {active && <ChevronRight size={16} className="ml-auto" />}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.email || 'Гость'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                {theme === 'dark' ? 'Светлая' : 'Тёмная'}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 lg:px-8 py-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <Menu size={24} className="text-gray-600 dark:text-gray-300" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {navItems.find(i => i.path === location.pathname)?.label || 'Дашборд'}
          </h2>
          <Link
            to="/transactions?action=add"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Добавить</span>
          </Link>
        </header>
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-4xl mb-4">💰</div>
          <p className="text-gray-500 dark:text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }

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
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout theme={theme} toggleTheme={toggleTheme}>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/transactions" element={
          <ProtectedRoute>
            <Layout theme={theme} toggleTheme={toggleTheme}>
              <Transactions />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <Layout theme={theme} toggleTheme={toggleTheme}>
              <Analytics />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/budget" element={
          <ProtectedRoute>
            <Layout theme={theme} toggleTheme={toggleTheme}>
              <Budget />
            </Layout>
          </ProtectedRoute>
        } />
               <Route path="/loans" element={
          <ProtectedRoute>
            <Layout theme={theme} toggleTheme={toggleTheme}>
              <Loans />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/planning" element={
          <ProtectedRoute>
            <Layout theme={theme} toggleTheme={toggleTheme}>
              <Planning />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authApi } from '../services/api';
import { AuthUser } from '../types';
import Loader from './Loader';
import {
  LayoutDashboard,
  FileText,
  HelpCircle,
  Users,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await authApi.getMe();
      setUser(data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      window.location.href = authApi.getAuthUrl();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/applications', label: 'Jelentkezések', icon: FileText },
    { path: '/admin/questions', label: 'Kérdések', icon: HelpCircle },
    ...(user?.role === 'owner'
      ? [{ path: '/admin/users', label: 'Adminok', icon: Users }]
      : []),
  ];

  if (loading) {
    return <Loader text="Hitelesítés..." />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-dark-800 border-r border-dark-700">
        <div className="p-6">
          <h1 className="text-2xl font-bold">TGF Admin</h1>
          <p className="text-sm text-gray-400 mt-1">Los Santos PD</p>
        </div>

        <nav className="flex-1 px-4">
          {navItems.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-400 hover:bg-dark-700 hover:text-white'
                  }`}
                  whileHover={{ x: 4 }}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-dark-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-dark-700 hover:text-white transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>Kijelentkezés</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 bg-black/80 z-50"
          onClick={() => setSidebarOpen(false)}
        >
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="w-64 h-full bg-dark-800 border-r border-dark-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">TGF Admin</h1>
                <p className="text-sm text-gray-400 mt-1">Los Santos PD</p>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="px-4">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

                return (
                  <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}>
                    <div
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 ${
                        isActive
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-400 hover:bg-dark-700 hover:text-white'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-700">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-dark-700 hover:text-white transition-colors w-full"
              >
                <LogOut className="w-5 h-5" />
                <span>Kijelentkezés</span>
              </button>
            </div>
          </motion.aside>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-dark-700">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">TGF Admin</h1>
          <div className="w-6" />
        </div>

        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

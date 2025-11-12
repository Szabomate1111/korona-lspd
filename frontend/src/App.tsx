import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Apply from './pages/Apply';
import Success from './pages/Success';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Applications from './pages/admin/Applications';
import ApplicationDetail from './pages/admin/ApplicationDetail';
import Questions from './pages/admin/Questions';
import Categories from './pages/admin/Categories';
import Users from './pages/admin/Users';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/success" element={<Success />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="applications" element={<Applications />} />
          <Route path="applications/:id" element={<ApplicationDetail />} />
          <Route path="questions" element={<Questions />} />
          <Route path="categories" element={<Categories />} />
          <Route path="users" element={<Users />} />
        </Route>

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold mb-4">404</h1>
                <p className="text-xl text-gray-400">Az oldal nem található</p>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

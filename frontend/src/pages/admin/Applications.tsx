import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { applicationsApi } from '../../services/api';
import { Application } from '../../types';
import Loader from '../../components/Loader';
import { Search, Filter, AlertTriangle } from 'lucide-react';

export default function Applications() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    pasted: false,
    q: '',
    sort: 'created_at_desc',
  });

  useEffect(() => {
    loadApplications();
  }, [page, filters]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const { data } = await applicationsApi.getAll({
        ...filters,
        page,
        pageSize: 20,
      });
      setApplications(data.applications);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'review':
        return 'bg-blue-500/20 text-blue-500';
      case 'accepted':
        return 'bg-green-500/20 text-green-500';
      case 'rejected':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new':
        return 'Új';
      case 'review':
        return 'Áttekintés';
      case 'accepted':
        return 'Elfogadva';
      case 'rejected':
        return 'Elutasítva';
      default:
        return status;
    }
  };

  const hasPasteData = (app: Application) => {
    return app.paste_meta && Object.keys(app.paste_meta).length > 0;
  };

  const totalPages = Math.ceil(total / 20);

  if (loading && applications.length === 0) {
    return <Loader text="Jelentkezések betöltése..." />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Jelentkezések</h1>
        <p className="text-gray-400">Összesen: {total}</p>
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Keresés</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                className="input pl-10"
                placeholder="Keresés válaszokban..."
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Státusz</label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Összes</option>
              <option value="new">Új</option>
              <option value="review">Áttekintés</option>
              <option value="accepted">Elfogadva</option>
              <option value="rejected">Elutasítva</option>
            </select>
          </div>

          <div>
            <label className="label">Rendezés</label>
            <select
              className="input"
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            >
              <option value="created_at_desc">Legújabb először</option>
              <option value="created_at_asc">Legrégebbi először</option>
              <option value="suspicion_desc">Gyanúsítás (magas → alacsony)</option>
              <option value="suspicion_asc">Gyanúsítás (alacsony → magas)</option>
            </select>
          </div>

          <div>
            <label className="label">Szűrők</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={filters.pasted}
                onChange={(e) => setFilters({ ...filters, pasted: e.target.checked })}
              />
              <span className="text-sm">Csak beillesztettek</span>
            </label>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="space-y-3">
          {applications.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Nincs találat</p>
          ) : (
            applications.map((app) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors cursor-pointer"
                onClick={() => navigate(`/admin/applications/${app.id}`)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      #{app.id} -{' '}
                      {app.answers.ic_name || app.answers.discord_name || 'Ismeretlen'}
                    </p>
                    {hasPasteData(app) && (
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    {new Date(app.created_at).toLocaleString('hu-HU')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {app.suspicion_score >= 50 && (
                    <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-500">
                      {app.suspicion_score}%
                    </span>
                  )}
                  <span className={`text-xs px-3 py-1 rounded ${getStatusColor(app.status)}`}>
                    {getStatusText(app.status)}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50"
            >
              Előző
            </button>
            <span className="text-gray-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary disabled:opacity-50"
            >
              Következő
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

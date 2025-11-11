import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { applicationsApi } from '../../services/api';
import { ApplicationStats, Application } from '../../types';
import Loader from '../../components/Loader';
import {
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, recentRes] = await Promise.all([
        applicationsApi.getStats(),
        applicationsApi.getRecent(10),
      ]);
      setStats(statsRes.data.stats);
      setRecentApplications(recentRes.data.applications);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return <Loader text="Dashboard betöltése..." />;
  }

  const statCards = [
    {
      title: 'Összes jelentkezés',
      value: stats.total,
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Új jelentkezések',
      value: stats.new,
      icon: AlertCircle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Elfogadva',
      value: stats.accepted,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Elutasítva',
      value: stats.rejected,
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Átlagos gyanúsítás',
      value: `${stats.avgSuspicionScore}%`,
      icon: TrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Beillesztés észlelve',
      value: stats.pastedCount,
      icon: AlertTriangle,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">{card.title}</p>
                <p className="text-3xl font-bold">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">Legutóbbi jelentkezések</h2>
        <div className="space-y-3">
          {recentApplications.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Még nincs jelentkezés</p>
          ) : (
            recentApplications.map((app) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors cursor-pointer"
                onClick={() => (window.location.href = `/admin/applications/${app.id}`)}
              >
                <div className="flex-1">
                  <p className="font-medium">
                    #{app.id} -{' '}
                    {app.answers.ic_name || app.answers.discord_name || 'Ismeretlen'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {new Date(app.created_at).toLocaleString('hu-HU')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {app.suspicion_score >= 50 && (
                    <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-500">
                      Gyanús: {app.suspicion_score}%
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
      </div>
    </div>
  );
}

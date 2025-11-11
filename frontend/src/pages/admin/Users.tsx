import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usersApi } from '../../services/api';
import { User } from '../../types';
import Loader from '../../components/Loader';
import { Plus, Trash2, Shield } from 'lucide-react';

export default function Users() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await usersApi.getAll();
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: number, username: string) => {
    if (!confirm(`Biztosan törölni szeretnéd ${username} felhasználót?`)) return;

    try {
      await usersApi.delete(userId);
      loadUsers();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.error || 'Nem sikerült törölni a felhasználót');
    }
  };

  const handleRoleChange = async (userId: number, newRole: 'owner' | 'admin') => {
    try {
      await usersApi.updateRole(userId, newRole);
      loadUsers();
    } catch (error: any) {
      console.error('Failed to update role:', error);
      alert(error.response?.data?.error || 'Nem sikerült módosítani a szerepkört');
    }
  };

  if (loading) {
    return <Loader text="Felhasználók betöltése..." />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Adminisztrátorok</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Admin hozzáadása
        </button>
      </div>

      <div className="card">
        <div className="space-y-3">
          {users.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Még nincs felhasználó</p>
          ) : (
            users.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-4 bg-dark-700 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  {user.avatar ? (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar}.png`}
                      alt={user.username}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center">
                      <Shield className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-gray-400">Discord ID: {user.discord_id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    className="input py-1 text-sm"
                    value={user.role}
                    onChange={(e) =>
                      handleRoleChange(user.id, e.target.value as 'owner' | 'admin')
                    }
                  >
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                  </select>

                  <button
                    onClick={() => handleDelete(user.id, user.username)}
                    className="btn-danger p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <AddUserModal
          onClose={() => setShowModal(false)}
          onSave={() => {
            loadUsers();
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

interface AddUserModalProps {
  onClose: () => void;
  onSave: () => void;
}

function AddUserModal({ onClose, onSave }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    discord_id: '',
    username: '',
    role: 'admin' as 'owner' | 'admin',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await usersApi.create(formData);
      onSave();
    } catch (error: any) {
      console.error('Failed to create user:', error);
      alert(error.response?.data?.error || 'Nem sikerült létrehozni a felhasználót');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-dark-800 rounded-lg p-6 max-w-md w-full"
      >
        <h2 className="text-2xl font-bold mb-6">Admin hozzáadása</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Discord ID *</label>
            <input
              type="text"
              className="input"
              required
              value={formData.discord_id}
              onChange={(e) =>
                setFormData({ ...formData, discord_id: e.target.value })
              }
              placeholder="123456789012345678"
            />
            <p className="text-xs text-gray-500 mt-1">
              A felhasználó Discord azonosítója (18 számjegy)
            </p>
          </div>

          <div>
            <label className="label">Felhasználónév *</label>
            <input
              type="text"
              className="input"
              required
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              placeholder="JohnDoe"
            />
          </div>

          <div>
            <label className="label">Szerepkör</label>
            <select
              className="input"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value as 'owner' | 'admin' })
              }
            >
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={saving}
            >
              Mégse
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Hozzáadás...' : 'Hozzáadás'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

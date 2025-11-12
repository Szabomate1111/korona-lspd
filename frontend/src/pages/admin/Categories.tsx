import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { categoriesApi } from '../../services/api';
import { Category } from '../../types';
import Loader from '../../components/Loader';
import { Plus, Edit, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';

export default function Categories() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data } = await categoriesApi.getAll();
      setCategories(data.categories.sort((a, b) => a.order_index - b.order_index));
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      await categoriesApi.update(category.id, { active: !category.active });
      loadCategories();
    } catch (error) {
      console.error('Failed to toggle active:', error);
      alert('Nem sikerült módosítani a kategóriát');
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Biztosan törölni szeretnéd a "${category.name}" kategóriát?`)) {
      return;
    }

    try {
      await categoriesApi.delete(category.id);
      loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Nem sikerült törölni a kategóriát');
    }
  };

  if (loading) {
    return <Loader text="Kategóriák betöltése..." />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Kategóriák kezelése</h1>
          <p className="text-gray-400 mt-2">
            Kérdések csoportosítása kategóriákba
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            setShowModal(true);
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Új kategória
        </button>
      </div>

      <div className="card">
        <div className="space-y-3">
          {categories.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              Még nincs kategória. Hozz létre egyet!
            </p>
          ) : (
            categories.map((category) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-4 p-4 bg-dark-700 rounded-lg"
              >
                <GripVertical className="w-5 h-5 text-gray-500 cursor-move" />

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{category.name}</p>
                    <span className="text-xs px-2 py-0.5 bg-primary-500/20 text-primary-500 rounded">
                      #{category.order_index}
                    </span>
                  </div>
                  {category.description && (
                    <p className="text-sm text-gray-400">{category.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(category)}
                    className={`p-2 rounded ${
                      category.active
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-gray-500/20 text-gray-500'
                    }`}
                    title={category.active ? 'Aktív' : 'Inaktív'}
                  >
                    {category.active ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setEditingCategory(category);
                      setShowModal(true);
                    }}
                    className="btn-secondary p-2"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(category)}
                    className="p-2 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 transition-colors"
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
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setShowModal(false);
            setEditingCategory(null);
          }}
          onSave={() => {
            loadCategories();
            setShowModal(false);
            setEditingCategory(null);
          }}
        />
      )}
    </div>
  );
}

interface CategoryModalProps {
  category: Category | null;
  onClose: () => void;
  onSave: () => void;
}

function CategoryModal({ category, onClose, onSave }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    order_index: category?.order_index || 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (category) {
        await categoriesApi.update(category.id, formData);
      } else {
        await categoriesApi.create(formData);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('Nem sikerült menteni a kategóriát');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-dark-800 rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6">
          {category ? 'Kategória szerkesztése' : 'Új kategória'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Név *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Leírás</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input w-full"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sorrend *</label>
            <input
              type="number"
              value={formData.order_index}
              onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
              className="input w-full"
              required
              min={1}
            />
            <p className="text-sm text-gray-400 mt-1">
              999 = "Áttekintés" kategória (mindig utolsó)
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Mentés...' : 'Mentés'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Mégse
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

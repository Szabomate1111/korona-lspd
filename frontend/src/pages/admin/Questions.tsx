import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { questionsApi, categoriesApi } from '../../services/api';
import { Question, Category } from '../../types';
import Loader from '../../components/Loader';
import { Plus, Edit, Eye, EyeOff, GripVertical } from 'lucide-react';

export default function Questions() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [questionsRes, categoriesRes] = await Promise.all([
        questionsApi.getAll(),
        categoriesApi.getAll(),
      ]);

      // Get only latest active version of each question
      const activeQuestions = questionsRes.data.questions.filter((q) => q.active);
      setQuestions(activeQuestions.sort((a, b) => a.order_index - b.order_index));
      setCategories(categoriesRes.data.categories.sort((a, b) => a.order_index - b.order_index));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (question: Question) => {
    try {
      await questionsApi.setActive(question.id, !question.active);
      loadData();
    } catch (error) {
      console.error('Failed to toggle active:', error);
      alert('Nem sikerült módosítani a kérdést');
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'text':
        return 'Szöveg';
      case 'textarea':
        return 'Hosszú szöveg';
      case 'select':
        return 'Legördülő';
      case 'radio':
        return 'Rádiógomb';
      case 'checkbox':
        return 'Jelölőnégyzet';
      default:
        return type;
    }
  };

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return 'Nincs kategória';
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || 'Nincs kategória';
  };

  if (loading) {
    return <Loader text="Kérdések betöltése..." />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Kérdések kezelése</h1>
        <button
          onClick={() => {
            setEditingQuestion(null);
            setShowModal(true);
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Új kérdés
        </button>
      </div>

      <div className="card">
        <div className="space-y-3">
          {questions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              Még nincs kérdés. Hozz létre egyet!
            </p>
          ) : (
            questions.map((question) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-4 p-4 bg-dark-700 rounded-lg"
              >
                <GripVertical className="w-5 h-5 text-gray-500 cursor-move" />

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{question.question_text}</p>
                    {question.is_required && (
                      <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-500 rounded">
                        Kötelező
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    {getTypeLabel(question.type)} • {getCategoryName(question.category_id)} • v{question.version}
                    {question.min_length && ` • min: ${question.min_length}`}
                    {question.max_length && ` • max: ${question.max_length}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(question)}
                    className={`p-2 rounded ${
                      question.active
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-gray-500/20 text-gray-500'
                    }`}
                    title={question.active ? 'Aktív' : 'Inaktív'}
                  >
                    {question.active ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setEditingQuestion(question);
                      setShowModal(true);
                    }}
                    className="btn-secondary p-2"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <QuestionModal
          question={editingQuestion}
          categories={categories}
          onClose={() => {
            setShowModal(false);
            setEditingQuestion(null);
          }}
          onSave={() => {
            loadData();
            setShowModal(false);
            setEditingQuestion(null);
          }}
        />
      )}
    </div>
  );
}

interface QuestionModalProps {
  question: Question | null;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}

function QuestionModal({ question, categories, onClose, onSave }: QuestionModalProps) {
  const [formData, setFormData] = useState({
    question_text: question?.question_text || '',
    field_key: question?.field_key || '',
    type: question?.type || 'text',
    is_required: question?.is_required ?? true,
    min_length: question?.min_length || '',
    max_length: question?.max_length || '',
    order_index: question?.order_index || 1,
    category_id: question?.category_id || '',
  });
  const [autoGenerateKey, setAutoGenerateKey] = useState(!question);
  const [saving, setSaving] = useState(false);

  // Auto-generate field_key from question_text
  const generateFieldKey = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .trim()
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Max 50 chars
  };

  useEffect(() => {
    if (autoGenerateKey && formData.question_text && !question) {
      setFormData((prev) => ({
        ...prev,
        field_key: generateFieldKey(prev.question_text),
      }));
    }
  }, [formData.question_text, autoGenerateKey, question]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        min_length: formData.min_length ? Number(formData.min_length) : undefined,
        max_length: formData.max_length ? Number(formData.max_length) : undefined,
        category_id: formData.category_id ? Number(formData.category_id) : undefined,
      };

      if (question) {
        await questionsApi.update(question.id, payload);
      } else {
        await questionsApi.create(payload);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save question:', error);
      alert('Nem sikerült menteni a kérdést');
    } finally {
      setSaving(false);
    }
  };

  const showLengthFields = formData.type === 'text' || formData.type === 'textarea';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-dark-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold mb-6">
          {question ? 'Kérdés szerkesztése' : 'Új kérdés'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Kérdés szövege *</label>
            <textarea
              className="textarea"
              rows={3}
              required
              value={formData.question_text}
              onChange={(e) =>
                setFormData({ ...formData, question_text: e.target.value })
              }
            />
          </div>

          {!question && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={autoGenerateKey}
                  onChange={(e) => setAutoGenerateKey(e.target.checked)}
                />
                <span className="text-sm">Automatikus mező kulcs generálás</span>
              </label>
            </div>
          )}

          <div>
            <label className="label">Mező kulcs * (egyedi azonosító)</label>
            <input
              type="text"
              className="input"
              required
              disabled={!!question || autoGenerateKey}
              value={formData.field_key}
              onChange={(e) =>
                setFormData({ ...formData, field_key: e.target.value })
              }
              placeholder="pl. motivation, character_bio"
            />
            {question && (
              <p className="text-xs text-gray-500 mt-1">
                A mező kulcs nem módosítható meglévő kérdésnél
              </p>
            )}
            {autoGenerateKey && !question && (
              <p className="text-xs text-gray-500 mt-1">
                A mező kulcs automatikusan generálódik a kérdés szövegéből
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Típus</label>
              <select
                className="input"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as any })
                }
              >
                <option value="text">Szöveg</option>
                <option value="textarea">Hosszú szöveg</option>
              </select>
            </div>

            <div>
              <label className="label">Kategória</label>
              <select
                className="input"
                value={formData.category_id}
                onChange={(e) =>
                  setFormData({ ...formData, category_id: e.target.value })
                }
              >
                <option value="">Nincs kategória</option>
                {categories
                  .filter((c) => c.name !== 'Áttekintés')
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {showLengthFields && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Minimum karakterszám</label>
                <input
                  type="number"
                  className="input"
                  min="0"
                  value={formData.min_length}
                  onChange={(e) =>
                    setFormData({ ...formData, min_length: e.target.value })
                  }
                  placeholder="Pl. 50"
                />
              </div>

              <div>
                <label className="label">Maximum karakterszám</label>
                <input
                  type="number"
                  className="input"
                  min="1"
                  value={formData.max_length}
                  onChange={(e) =>
                    setFormData({ ...formData, max_length: e.target.value })
                  }
                  placeholder="Pl. 500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="label">Sorrend</label>
            <input
              type="number"
              className="input"
              min="1"
              value={formData.order_index}
              onChange={(e) =>
                setFormData({ ...formData, order_index: parseInt(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={formData.is_required}
                onChange={(e) =>
                  setFormData({ ...formData, is_required: e.target.checked })
                }
              />
              <span className="text-sm">Kötelező mező</span>
            </label>
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
              {saving ? 'Mentés...' : 'Mentés'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

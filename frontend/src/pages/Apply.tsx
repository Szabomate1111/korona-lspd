import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { questionsApi, applicationsApi, categoriesApi } from '../services/api';
import { Question, Category } from '../types';
import { PasteTracker } from '../utils/paste-tracker';
import { localStorageUtils } from '../utils/local-storage';
import ProgressBar from '../components/ProgressBar';
import Loader from '../components/Loader';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';

export default function Apply() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pasteTracker] = useState(() => new PasteTracker());

  useEffect(() => {
    loadData();
    loadDraft();
  }, []);

  useEffect(() => {
    // Auto-save to localStorage
    if (Object.keys(answers).length > 0) {
      localStorageUtils.saveDraft(answers);
    }
  }, [answers]);

  const loadData = async () => {
    try {
      const [questionsRes, categoriesRes] = await Promise.all([
        questionsApi.getActive(),
        categoriesApi.getActive(),
      ]);

      setQuestions(questionsRes.data.questions);
      // Filter out "Áttekintés" category and sort by order_index
      const activeCategories = categoriesRes.data.categories
        .filter(c => c.name !== 'Áttekintés')
        .sort((a, b) => a.order_index - b.order_index);
      setCategories(activeCategories);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Nem sikerült betölteni az adatokat. Kérlek frissítsd az oldalt.');
    } finally {
      setLoading(false);
    }
  };

  const loadDraft = () => {
    const draft = localStorageUtils.loadDraft();
    if (draft) {
      setAnswers(draft);
    }
  };

  const handleInputChange = (fieldKey: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [fieldKey]: value }));
    if (errors[fieldKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  const handlePaste = (fieldKey: string, currentValue: string) => {
    pasteTracker.trackPaste(fieldKey, currentValue);
  };

  const validateStep = (): boolean => {
    const stepQuestions = getQuestionsForStep(currentStep);
    const newErrors: Record<string, string> = {};

    stepQuestions.forEach((question) => {
      const answer = answers[question.field_key]?.trim() || '';

      // Check required
      if (question.is_required && !answer) {
        newErrors[question.field_key] = 'Ez a mező kötelező';
        return;
      }

      // Check min length
      if (answer && question.min_length && answer.length < question.min_length) {
        newErrors[question.field_key] = `Minimum ${question.min_length} karakter szükséges`;
        return;
      }

      // Check max length
      if (answer && question.max_length && answer.length > question.max_length) {
        newErrors[question.field_key] = `Maximum ${question.max_length} karakter engedélyezett`;
        return;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getQuestionsForStep = (step: number): Question[] => {
    // Review step shows all questions
    if (step === categories.length) return questions;

    // Get questions for the current category
    const category = categories[step];
    if (!category) return [];

    return questions.filter(q => q.category_id === category.id);
  };

  const getStepLabels = (): string[] => {
    return [...categories.map(c => c.name), 'Ellenőrzés'];
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, categories.length));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setSubmitting(true);
    try {
      const { data } = await applicationsApi.apply({
        answers,
        pastes: pasteTracker.getEvents(),
        clientMeta: {
          ua: navigator.userAgent,
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
        },
      });

      localStorageUtils.clearDraft();
      navigate('/success', { state: { applicationId: data.id } });
    } catch (error: any) {
      console.error('Submit error:', error);
      alert(
        error.response?.data?.error ||
          'Nem sikerült beküldeni a jelentkezést. Kérlek próbáld újra.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader text="Kérdések betöltése..." />;
  }

  const stepQuestions = getQuestionsForStep(currentStep);
  const isReviewStep = currentStep === categories.length;
  const stepLabels = getStepLabels();

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-center mb-12"
        >
          Jelentkezés - LSPD
        </motion.h1>

        <ProgressBar steps={stepLabels} currentStep={currentStep} />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="card"
          >
            {isReviewStep ? (
              <div>
                <h2 className="text-2xl font-bold mb-6">Ellenőrzés és beküldés</h2>
                <p className="text-gray-400 mb-6">
                  Kérlek ellenőrizd válaszaid, majd küldd be a jelentkezést.
                </p>
                <div className="space-y-6">
                  {categories.map((category) => {
                    const categoryQuestions = questions.filter(q => q.category_id === category.id);
                    if (categoryQuestions.length === 0) return null;

                    return (
                      <div key={category.id} className="border border-dark-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-4 text-primary-500">
                          {category.name}
                        </h3>
                        <div className="space-y-4">
                          {categoryQuestions.map((question) => (
                            <div key={question.id} className="border-b border-dark-700 pb-3 last:border-0">
                              <p className="text-sm text-gray-400 mb-2">{question.question_text}</p>
                              <p className="text-white whitespace-pre-wrap">
                                {answers[question.field_key] || '-'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-6">
                  {categories[currentStep]?.name}
                </h2>
                {categories[currentStep]?.description && (
                  <p className="text-gray-400 mb-6">
                    {categories[currentStep].description}
                  </p>
                )}
                <div className="space-y-6">
                  {stepQuestions.map((question) => (
                    <div key={question.id}>
                      <label className="label">
                        {question.question_text}
                        {question.is_required && <span className="text-danger-500 ml-1">*</span>}
                      </label>
                      {question.type === 'textarea' ? (
                        <textarea
                          className={`textarea ${errors[question.field_key] ? 'border-danger-500' : ''}`}
                          rows={6}
                          value={answers[question.field_key] || ''}
                          onChange={(e) => handleInputChange(question.field_key, e.target.value)}
                          onPaste={() =>
                            handlePaste(question.field_key, answers[question.field_key] || '')
                          }
                          placeholder="Válaszod..."
                          maxLength={question.max_length}
                        />
                      ) : (
                        <input
                          type="text"
                          className={`input ${errors[question.field_key] ? 'border-danger-500' : ''}`}
                          value={answers[question.field_key] || ''}
                          onChange={(e) => handleInputChange(question.field_key, e.target.value)}
                          onPaste={() =>
                            handlePaste(question.field_key, answers[question.field_key] || '')
                          }
                          placeholder="Válaszod..."
                          maxLength={question.max_length}
                        />
                      )}
                      {errors[question.field_key] && (
                        <p className="text-danger-500 text-sm mt-1">{errors[question.field_key]}</p>
                      )}
                      {(question.type === 'textarea' || question.type === 'text') && answers[question.field_key] && (
                        <p className="text-xs text-gray-500 mt-1">
                          {answers[question.field_key].length}
                          {question.max_length && ` / ${question.max_length}`} karakter
                          {question.min_length && ` (min: ${question.min_length})`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Vissza
          </button>

          {isReviewStep ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Küldés...' : 'Beküldés'}
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="btn-primary inline-flex items-center gap-2"
            >
              Tovább
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

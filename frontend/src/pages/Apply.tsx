import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { questionsApi, applicationsApi } from '../services/api';
import { Question } from '../types';
import { PasteTracker } from '../utils/paste-tracker';
import { localStorageUtils } from '../utils/local-storage';
import ProgressBar from '../components/ProgressBar';
import Loader from '../components/Loader';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';

const STEPS = ['Alapadatok', 'Karakter', 'Motiváció', 'Tapasztalat', 'Ellenőrzés'];

export default function Apply() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pasteTracker] = useState(() => new PasteTracker());

  useEffect(() => {
    loadQuestions();
    loadDraft();
  }, []);

  useEffect(() => {
    // Auto-save to localStorage
    if (Object.keys(answers).length > 0) {
      localStorageUtils.saveDraft(answers);
    }
  }, [answers]);

  const loadQuestions = async () => {
    try {
      const { data } = await questionsApi.getActive();
      setQuestions(data.questions);
    } catch (error) {
      console.error('Failed to load questions:', error);
      alert('Nem sikerült betölteni a kérdéseket. Kérlek frissítsd az oldalt.');
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
      if (question.is_required && !answers[question.field_key]?.trim()) {
        newErrors[question.field_key] = 'Ez a mező kötelező';
      } else if (
        answers[question.field_key] &&
        question.type === 'textarea' &&
        answers[question.field_key].length < 120
      ) {
        newErrors[question.field_key] = 'Minimum 120 karakter szükséges';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getQuestionsForStep = (step: number): Question[] => {
    const questionsPerStep = Math.ceil(questions.length / (STEPS.length - 1));
    if (step === STEPS.length - 1) return questions; // Review step
    return questions.slice(step * questionsPerStep, (step + 1) * questionsPerStep);
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
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
  const isReviewStep = currentStep === STEPS.length - 1;

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

        <ProgressBar steps={STEPS} currentStep={currentStep} />

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
                  {questions.map((question) => (
                    <div key={question.id} className="border-b border-dark-700 pb-4">
                      <p className="text-sm text-gray-400 mb-2">{question.question_text}</p>
                      <p className="text-white whitespace-pre-wrap">
                        {answers[question.field_key] || '-'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
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
                      />
                    )}
                    {errors[question.field_key] && (
                      <p className="text-danger-500 text-sm mt-1">{errors[question.field_key]}</p>
                    )}
                    {question.type === 'textarea' && answers[question.field_key] && (
                      <p className="text-xs text-gray-500 mt-1">
                        {answers[question.field_key].length} karakter
                      </p>
                    )}
                  </div>
                ))}
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

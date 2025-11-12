import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { applicationsApi } from '../../services/api';
import { Application } from '../../types';
import Loader from '../../components/Loader';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Hash,
} from 'lucide-react';

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<Application | null>(null);
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      loadApplication(parseInt(id));
    }
  }, [id]);

  const loadApplication = async (appId: number) => {
    try {
      const { data } = await applicationsApi.getById(appId);
      setApplication(data.application);
      setNote(data.application.admin_note || '');
    } catch (error) {
      console.error('Failed to load application:', error);
      alert('Nem sikerült betölteni a jelentkezést');
      navigate('/admin/applications');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!application) return;

    setUpdating(true);
    try {
      await applicationsApi.updateStatus(application.id, status, note);
      alert('Státusz frissítve!');
      loadApplication(application.id);
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Nem sikerült frissíteni a státuszt');
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !application) {
    return <Loader text="Jelentkezés betöltése..." />;
  }

  const questions = application.questions_snapshot.questions;

  const hasPasteData = (fieldKey: string) => {
    return application.paste_meta && application.paste_meta[fieldKey]?.pasted;
  };

  const getPasteMeta = (fieldKey: string) => {
    return application.paste_meta?.[fieldKey];
  };

  return (
    <div>
      <button
        onClick={() => navigate('/admin/applications')}
        className="btn-secondary inline-flex items-center gap-2 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Vissza
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h1 className="text-2xl font-bold mb-4">
              Jelentkezés #{application.id}
            </h1>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p className="text-gray-400">Beküldve</p>
                <p className="font-medium">
                  {new Date(application.created_at).toLocaleString('hu-HU')}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Státusz</p>
                <p className="font-medium capitalize">{application.status}</p>
              </div>
              <div>
                <p className="text-gray-400">Gyanúsítás</p>
                <p className={`font-medium ${application.suspicion_score >= 50 ? 'text-red-500' : 'text-green-500'}`}>
                  {application.suspicion_score}%
                </p>
              </div>
              <div>
                <p className="text-gray-400">Kérdésverzió</p>
                <p className="font-medium">v{application.questions_snapshot.version}</p>
              </div>
            </div>

            {application.suspicion_score >= 50 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-red-500 mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  <p className="font-semibold">Magas gyanúsítási pontszám</p>
                </div>
                <p className="text-sm text-gray-300">
                  Ez a jelentkezés gyanús beillesztési mintázatokat tartalmaz. Ellenőrizd
                  figyelmesen a válaszokat.
                </p>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-xl font-bold mb-4">Válaszok</h2>
            <div className="space-y-6">
              {questions.map((question) => {
                const pasteMeta = getPasteMeta(question.field_key);
                const isPasted = hasPasteData(question.field_key);

                return (
                  <div
                    key={question.id}
                    className={`border-l-4 pl-4 ${
                      isPasted ? 'border-red-500 bg-red-500/5' : 'border-dark-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm text-gray-400">{question.question_text}</p>
                      {isPasted && (
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 ml-2" />
                      )}
                    </div>

                    <p className="text-white whitespace-pre-wrap mb-2">
                      {application.answers[question.field_key] || '-'}
                    </p>

                    {isPasted && pasteMeta && (
                      <div className="text-xs text-gray-500 space-y-1 mt-3">
                        <p className="flex items-center gap-2">
                          <Hash className="w-3 h-3" />
                          Beillesztések száma: {pasteMeta.pasteCount}
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          Szerkesztési idő: {Math.round(pasteMeta.timeToEdit)}s
                        </p>
                        <p>Hasonlóság: {Math.round(pasteMeta.similarity * 100)}%</p>
                        <p>
                          Hossz változás:{' '}
                          {Math.round(pasteMeta.lengthChangeRatio * 100)}%
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Műveletek</h2>

            <div className="space-y-3">
              <button
                onClick={() => handleUpdateStatus('accepted')}
                disabled={updating || application.status === 'accepted'}
                className="btn-success w-full inline-flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Elfogadás
              </button>

              <button
                onClick={() => handleUpdateStatus('rejected')}
                disabled={updating || application.status === 'rejected'}
                className="btn-danger w-full inline-flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Elutasítás
              </button>

              <button
                onClick={() => handleUpdateStatus('review')}
                disabled={updating || application.status === 'review'}
                className="btn-secondary w-full"
              >
                Áttekintésre jelölés
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold mb-4">Megjegyzés</h2>
            <textarea
              className="textarea"
              rows={5}
              placeholder="Admin megjegyzés..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              onClick={() => handleUpdateStatus(application.status)}
              disabled={updating}
              className="btn-primary w-full mt-3"
            >
              Mentés
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Home } from 'lucide-react';

export default function Success() {
  const navigate = useNavigate();
  const location = useLocation();
  const applicationId = location.state?.applicationId;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
        >
          <CheckCircle className="w-24 h-24 mx-auto text-success-600 mb-6" />
        </motion.div>

        <h1 className="text-4xl font-bold mb-4">Sikeres jelentkezés!</h1>

        <p className="text-xl text-gray-400 mb-2">
          Köszönjük, hogy jelentkeztél a Los Santos Police Department-hez!
        </p>

        {applicationId && (
          <p className="text-gray-500 mb-8">Jelentkezés azonosító: #{applicationId}</p>
        )}

        <div className="card text-left mb-8">
          <h2 className="text-xl font-semibold mb-4">Mi történik most?</h2>
          <ul className="space-y-3 text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-primary-600 mt-1">•</span>
              <span>Az adminjaink átnézik a jelentkezésed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 mt-1">•</span>
              <span>
                Hamarosan felvesszük veled a kapcsolatot Discord-on az eredményről
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 mt-1">•</span>
              <span>Kérjük légy türelemmel, ez akár 1-3 napot is igénybe vehet</span>
            </li>
          </ul>
        </div>

        <motion.button
          onClick={() => navigate('/')}
          className="btn-primary inline-flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Home className="w-5 h-5" />
          Vissza a főoldalra
        </motion.button>
      </motion.div>
    </div>
  );
}

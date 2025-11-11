import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Star, ArrowRight } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <Shield className="w-24 h-24 mx-auto text-primary-600" />
        </motion.div>

        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Los Santos Police Department
        </h1>

        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
          Csatlakozz a város legprofibb rendőrségéhez! Védd a lakosokat, tartsd fenn a
          rendet, és legyél részese egy igazi közösségnek.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: Users,
              title: 'Közösség',
              description: 'Legyél része egy összeszokott, baráti csapatnak',
            },
            {
              icon: Star,
              title: 'Fejlődés',
              description: 'Halaj előre a ranglétrán, szerezz tapasztalatot',
            },
            {
              icon: Shield,
              title: 'Professzionalizmus',
              description: 'Valós rendőrségi munkát igénylő roleplay',
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="card"
            >
              <feature.icon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.button
          onClick={() => navigate('/apply')}
          className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Jelentkezem most
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </div>
  );
}

import { motion } from 'framer-motion';

interface ProgressBarProps {
  steps: string[];
  currentStep: number;
}

export default function ProgressBar({ steps, currentStep }: ProgressBarProps) {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8 px-4">
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isActive = index <= currentStep;
          const isCurrent = index === currentStep;

          return (
            <div
              key={index}
              className="flex items-center"
              style={{
                flex: index === steps.length - 1 ? '0 0 auto' : '1 1 0',
              }}
            >
              <div className="flex flex-col items-center relative z-10">
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    isActive
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-dark-800 border-dark-600 text-gray-500'
                  }`}
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {index + 1}
                </motion.div>
                <span
                  className={`text-xs mt-2 text-center max-w-[80px] ${
                    isActive ? 'text-white font-medium' : 'text-gray-500'
                  }`}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-dark-700 mx-4 relative min-w-[40px]">
                  <motion.div
                    className="h-full bg-primary-600"
                    initial={{ width: '0%' }}
                    animate={{
                      width: index < currentStep ? '100%' : '0%',
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

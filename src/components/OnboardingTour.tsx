import { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface TourStep {
  title: string;
  description: string;
  icon: string;
}

const tourSteps: TourStep[] = [
  {
    title: 'Welcome to RoomSplit!',
    description: 'The easiest way to split rent and track expenses with your roommates.',
    icon: '🏠'
  },
  {
    title: 'Calculate Fair Rent',
    description: 'Use our calculator to split rent by square footage, amenities, or custom amounts. Perfect for rooms of different sizes!',
    icon: '🧮'
  },
  {
    title: 'Track Expenses',
    description: 'Add shared expenses like utilities, groceries, and supplies. Split them equally or customize each person\'s share.',
    icon: '💰'
  },
  {
    title: 'Settle Up Easily',
    description: 'See who owes who at a glance. Send payment requests directly through Venmo, Cash App, or Zelle.',
    icon: '✅'
  },
  {
    title: 'Stay Organized',
    description: 'Create house agreements, track payment streaks, and view spending analytics. Everything in one place!',
    icon: '📊'
  }
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setHasSeenTour] = useLocalStorage('roomsplit-tour-completed', false);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setHasSeenTour(true);
      onComplete();
    }
  };

  const handleSkip = () => {
    setHasSeenTour(true);
    onComplete();
  };

  const step = tourSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-primary-500 to-primary-700 flex flex-col items-center justify-center p-6 z-50">
      <div className="flex-1 flex flex-col items-center justify-center max-w-sm text-center">
        <div className="text-6xl mb-6">{step.icon}</div>
        <h2 className="text-2xl font-bold text-white mb-3">{step.title}</h2>
        <p className="text-primary-100 text-lg">{step.description}</p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-6">
        {tourSteps.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentStep ? 'bg-white' : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={handleNext}
          className="w-full py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
        >
          {currentStep < tourSteps.length - 1 ? 'Next' : 'Get Started'}
        </button>
        {currentStep < tourSteps.length - 1 && (
          <button
            onClick={handleSkip}
            className="w-full py-3 text-white/80 font-medium hover:text-white transition-colors"
          >
            Skip Tour
          </button>
        )}
      </div>
    </div>
  );
}

export function useTourStatus() {
  const [hasSeenTour, setHasSeenTour] = useLocalStorage('roomsplit-tour-completed', false);
  return { hasSeenTour, setHasSeenTour };
}

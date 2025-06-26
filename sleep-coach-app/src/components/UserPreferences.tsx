'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Check, X, Settings, User, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface UserPreferencesData {
  sleep_start_time_days_off: string;
  sleep_end_time_days_off: string;
  ready_time_minutes: number | null;
  chronotype: 'morning' | 'evening' | 'neither' | '';
  sex: 'male' | 'female' | 'other' | '';
  age: number | null;
  use_melatonin: boolean;
}

interface UserPreferencesProps {
  onClose?: () => void;
  onSave?: () => void;
  showAsModal?: boolean;
  title?: string;
}

export default function UserPreferences({ 
  onClose, 
  onSave, 
  showAsModal = false, 
  title = "Sleep Preferences" 
}: UserPreferencesProps) {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState<UserPreferencesData>({
    sleep_start_time_days_off: '23:00',
    sleep_end_time_days_off: '07:00',
    ready_time_minutes: null,
    chronotype: '',
    sex: '',
    age: null,
    use_melatonin: false,
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Define the steps/questions
  const steps = [
    {
      id: 'sleep_schedule',
      title: 'Sleep Schedule',
      emoji: '🛏️',
      question: 'On your days off, when do you sleep and wake up?',
      description: 'This helps us understand your natural sleep rhythm'
    },
    {
      id: 'ready_time',
      title: 'Getting Ready',
      emoji: '⏰',
      question: 'After sleep, how long do you need to get ready for work/leave for work?',
      description: 'We\'ll factor this into your sleep schedule recommendations'
    },
    {
      id: 'chronotype',
      title: 'Chronotype',
      emoji: '🌅',
      question: 'What\'s your chronotype?',
      description: 'When do you feel most alert and energetic?'
    },
    {
      id: 'sex',
      title: 'Demographics',
      emoji: '👤',
      question: 'What\'s your sex?',
      description: 'This affects caffeine metabolism and sleep recommendations'
    },
    {
      id: 'age',
      title: 'Age',
      emoji: '📅',
      question: 'How old are you?',
      description: 'Age affects sleep needs and recommendations'
    },
    {
      id: 'melatonin',
      title: 'Melatonin',
      emoji: '💊',
      question: 'Would you like to use melatonin to timeshift faster and sleep better?',
      description: 'Melatonin can help adjust your sleep schedule more quickly'
    }
  ];

  const totalSteps = steps.length;

  // Time options for the picker
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  useEffect(() => {
    const fetchExistingPreferences = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (data) {
        setFormData({
          sleep_start_time_days_off: data.sleep_start_time_days_off,
          sleep_end_time_days_off: data.sleep_end_time_days_off || '07:00',
          ready_time_minutes: data.ready_time_minutes,
          chronotype: data.chronotype,
          sex: data.sex,
          age: data.age,
          use_melatonin: data.use_melatonin,
        });
      }
      
      setIsLoading(false);
    };

    fetchExistingPreferences();
  }, [supabase]);

  const validateCurrentStep = () => {
    const currentStepData = steps[currentStep];
    const errors: {[key: string]: string} = {};

    switch (currentStepData.id) {
      case 'sleep_schedule':
        if (!formData.sleep_start_time_days_off) {
          errors.sleep_start_time_days_off = 'Sleep time is required';
        }
        if (!formData.sleep_end_time_days_off) {
          errors.sleep_end_time_days_off = 'Wake up time is required';
        }
        break;
      case 'ready_time':
        if (!formData.ready_time_minutes || formData.ready_time_minutes < 5) {
          errors.ready_time_minutes = 'Ready time must be at least 5 minutes';
        }
        if (formData.ready_time_minutes && formData.ready_time_minutes > 300) {
          errors.ready_time_minutes = 'Ready time cannot exceed 5 hours';
        }
        break;
      case 'chronotype':
        if (!formData.chronotype) {
          errors.chronotype = 'Please select your chronotype';
        }
        break;
      case 'sex':
        if (!formData.sex) {
          errors.sex = 'Please select your sex';
        }
        break;
      case 'age':
        if (!formData.age || formData.age < 13 || formData.age > 120) {
          errors.age = 'Please enter your age (13-120 years)';
        }
        break;
      case 'melatonin':
        // No validation needed for boolean toggle
        break;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
        setFormErrors({});
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setFormErrors({});
    }
  };

  const validateForm = () => {
    // Validate all steps for final submission
    const errors: {[key: string]: string} = {};

    if (!formData.sleep_start_time_days_off) {
      errors.sleep_start_time_days_off = 'Sleep time is required';
    }
    if (!formData.sleep_end_time_days_off) {
      errors.sleep_end_time_days_off = 'Wake up time is required';
    }
    if (!formData.ready_time_minutes || formData.ready_time_minutes < 5) {
      errors.ready_time_minutes = 'Ready time must be at least 5 minutes';
    }
    if (formData.ready_time_minutes && formData.ready_time_minutes > 300) {
      errors.ready_time_minutes = 'Ready time cannot exceed 5 hours';
    }
    if (!formData.chronotype) {
      errors.chronotype = 'Please select your chronotype';
    }
    if (!formData.sex) {
      errors.sex = 'Please select your sex';
    }
    if (!formData.age || formData.age < 13 || formData.age > 120) {
      errors.age = 'Please enter your age (13-120 years)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTimeChange = (timeType: 'start' | 'end', field: 'hour' | 'minute', value: number) => {
    const currentTimeField = timeType === 'start' ? 'sleep_start_time_days_off' : 'sleep_end_time_days_off';
    const currentTime = formData[currentTimeField].split(':');
    const currentHour = parseInt(currentTime[0]);
    const currentMinute = parseInt(currentTime[1]);

    const newHour = field === 'hour' ? value : currentHour;
    const newMinute = field === 'minute' ? value : currentMinute;

    const timeString = `${newHour.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
    setFormData(prev => ({
      ...prev,
      [currentTimeField]: timeString
    }));
  };

  const handleSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw new Error(`Failed to get session: ${sessionError.message}`);
      }
      
      if (!session) {
        throw new Error('No active session');
      }

      const data = {
        user_id: session.user.id,
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: upsertError } = await supabase
        .from('user_preferences')
        .upsert([data], { 
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (upsertError) {
        throw new Error(`Failed to save preferences: ${upsertError.message}`);
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        if (onSave) onSave();
        if (onClose) onClose();
      }, 2000);

    } catch (err) {
      console.error('Form submission error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while saving your preferences');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const TimeRoller = ({ 
    label, 
    value, 
    options, 
    onChange 
  }: { 
    label: string; 
    value: number; 
    options: number[]; 
    onChange: (value: number) => void;
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full p-3 border-2 border-gray-300 rounded-lg appearance-none bg-white text-center font-medium text-gray-800 focus:border-purple-500 focus:outline-none transition-colors"
        >
          {options.map(option => (
            <option key={option} value={option}>
              {label === 'Hour' ? option.toString().padStart(2, '0') : option.toString().padStart(2, '0')}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );

  const RadioGroup = ({ 
    label, 
    name, 
    value, 
    options, 
    onChange, 
    error 
  }: { 
    label: string; 
    name: string; 
    value: string; 
    options: { value: string; label: string }[]; 
    onChange: (value: string) => void;
    error?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">{label}</label>
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
            />
            <span className="ml-3 text-gray-700">{option.label}</span>
          </label>
        ))}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );

  const ToggleSwitch = ({ 
    label, 
    description, 
    checked, 
    onChange 
  }: { 
    label: string; 
    description?: string; 
    checked: boolean; 
    onChange: (checked: boolean) => void;
  }) => (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-purple-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  const currentStartTime = formData.sleep_start_time_days_off.split(':');
  const currentStartHour = parseInt(currentStartTime[0]);
  const currentStartMinute = parseInt(currentStartTime[1]);
  
  const currentEndTime = formData.sleep_end_time_days_off.split(':');
  const currentEndHour = parseInt(currentEndTime[0]);
  const currentEndMinute = parseInt(currentEndTime[1]);

  const renderCurrentStep = () => {
    const currentStepData = steps[currentStep];

    switch (currentStepData.id) {
      case 'sleep_schedule':
        return (
          <div className="space-y-6">
            {/* Sleep Start Time */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Sleep Time</h4>
              <div className="grid grid-cols-2 gap-3">
                <TimeRoller
                  label="Hour"
                  value={currentStartHour}
                  options={hours}
                  onChange={(value) => handleTimeChange('start', 'hour', value)}
                />
                <TimeRoller
                  label="Minute"
                  value={currentStartMinute}
                  options={minutes}
                  onChange={(value) => handleTimeChange('start', 'minute', value)}
                />
              </div>
            </div>

            {/* Sleep End Time */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Wake Up Time</h4>
              <div className="grid grid-cols-2 gap-3">
                <TimeRoller
                  label="Hour"
                  value={currentEndHour}
                  options={hours}
                  onChange={(value) => handleTimeChange('end', 'hour', value)}
                />
                <TimeRoller
                  label="Minute"
                  value={currentEndMinute}
                  options={minutes}
                  onChange={(value) => handleTimeChange('end', 'minute', value)}
                />
              </div>
            </div>

            {(formErrors.sleep_start_time_days_off || formErrors.sleep_end_time_days_off) && (
              <p className="text-red-500 text-xs mt-1">
                {formErrors.sleep_start_time_days_off || formErrors.sleep_end_time_days_off}
              </p>
            )}
          </div>
        );

      case 'ready_time':
        return (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="number"
                min="5"
                max="300"
                value={formData.ready_time_minutes || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  ready_time_minutes: e.target.value ? parseInt(e.target.value) : null
                }))}
                className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition-colors text-center"
                placeholder="Enter minutes (e.g., 60)"
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                minutes
              </span>
            </div>
            {formErrors.ready_time_minutes && (
              <p className="text-red-500 text-sm text-center">{formErrors.ready_time_minutes}</p>
            )}
          </div>
        );

      case 'chronotype':
        return (
          <div className="space-y-4">
            {[
              { value: 'morning', label: 'Morning person', description: 'I feel most alert in the morning' },
              { value: 'evening', label: 'Evening person', description: 'I feel most alert in the evening' },
              { value: 'neither', label: 'Neither', description: 'I adapt to different schedules easily' }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  chronotype: option.value as 'morning' | 'evening' | 'neither'
                }))}
                className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                  formData.chronotype === option.value
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-300 hover:border-purple-300 hover:bg-purple-25'
                }`}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-gray-600 mt-1">{option.description}</div>
              </button>
            ))}
            {formErrors.chronotype && (
              <p className="text-red-500 text-sm text-center">{formErrors.chronotype}</p>
            )}
          </div>
        );

      case 'sex':
        return (
          <div className="space-y-4">
            {[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other/Prefer not to say' }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  sex: option.value as 'male' | 'female' | 'other'
                }))}
                className={`w-full p-4 rounded-lg border-2 transition-colors ${
                  formData.sex === option.value
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-300 hover:border-purple-300 hover:bg-purple-25'
                }`}
              >
                {option.label}
              </button>
            ))}
            {formErrors.sex && (
              <p className="text-red-500 text-sm text-center">{formErrors.sex}</p>
            )}
          </div>
        );

      case 'age':
        return (
          <div className="space-y-4">
            <input
              type="number"
              min="13"
              max="120"
              value={formData.age || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                age: e.target.value ? parseInt(e.target.value) : null
              }))}
              className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none transition-colors text-center"
              placeholder="Enter your age"
            />
            {formErrors.age && (
              <p className="text-red-500 text-sm text-center">{formErrors.age}</p>
            )}
          </div>
        );

      case 'melatonin':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-center space-x-8">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, use_melatonin: false }))}
                className={`px-8 py-4 rounded-lg border-2 transition-colors ${
                  !formData.use_melatonin
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-300 hover:border-purple-300'
                }`}
              >
                No, thanks
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, use_melatonin: true }))}
                className={`px-8 py-4 rounded-lg border-2 transition-colors ${
                  formData.use_melatonin
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-300 hover:border-purple-300'
                }`}
              >
                Yes, include it
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const formContent = (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            background: 'linear-gradient(90deg, #5d905c, #8cc455)',
            width: `${((currentStep + 1) / totalSteps) * 100}%`
          }}
        />
      </div>

      {/* Step Info */}
      <div className="text-center">
        <div className="text-4xl mb-3">{steps[currentStep].emoji}</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {steps[currentStep].question}
        </h2>
        <p className="text-gray-600 text-sm mb-1">
          {steps[currentStep].description}
        </p>
        <p className="text-gray-500 text-xs">
          Step {currentStep + 1} of {totalSteps}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-lg flex items-center gap-2">
          <X size={16} />
          {error}
        </div>
      )}

      {/* Success Display */}
      {showSuccess && (
        <div className="bg-green-50 text-green-500 p-3 rounded-lg flex items-center gap-2">
          <Check size={16} />
          Preferences saved successfully!
        </div>
      )}

      {/* Current Step Content */}
      <div className="py-6">
        {renderCurrentStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6">
        <button
          onClick={currentStep === 0 ? onClose : handleBack}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <ChevronLeft size={18} />
          {currentStep === 0 ? 'Cancel' : 'Back'}
        </button>
        
        <button
          onClick={handleNext}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 rounded-full text-white font-medium transition-colors disabled:opacity-50"
          style={{
            background: 'linear-gradient(90deg, #5d905c, #8cc455)'
          }}
        >
          {isLoading ? 'Saving...' : currentStep === totalSteps - 1 ? 'Complete' : 'Next'}
          {!isLoading && currentStep < totalSteps - 1 && <ChevronRight size={18} />}
        </button>
      </div>
    </div>
  );

  if (showAsModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.3)] max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <div className="mb-4">
              <Settings size={48} className="mx-auto text-purple-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
            <p className="text-gray-600 text-sm">
              Help us personalize your sleep recommendations
            </p>
          </div>
          {formContent}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {formContent}
    </div>
  );
} 
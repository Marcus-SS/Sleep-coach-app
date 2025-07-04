"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from '@supabase/ssr';

// All 19 questions from the Morningness-Eveningness Questionnaire
const questions = [
  {
    text: "1. Considering only your own 'feeling best' rhythm, at what time would you get up if you were entirely free to plan your day?",
    options: [
      "5:00-6:30 AM", "6:30-7:45 AM", "7:45-9:45 AM", "9:45-11:00 AM", "11:00 AM-12:00 PM or later"
    ],
    scores: [5, 4, 3, 2, 1],
  },
  {
    text: "2. Considering only your own 'feeling best' rhythm, at what time would you go to bed if you were entirely free to plan your evening?",
    options: [
      "8:00-9:00 PM", "9:00-10:15 PM", "10:15-12:30 AM", "12:30-1:45 AM", "1:45-3:00 AM or later"
    ],
    scores: [5, 4, 3, 2, 1],
  },
  {
    text: "3. If there is a specific time at which you have to get up in the morning, to what extent are you dependent on being woken up by an alarm clock?",
    options: [
      "Not at all dependent", "Slightly dependent", "Fairly dependent", "Very dependent"
    ],
    scores: [4, 3, 2, 1],
  },
  {
    text: "4. Assuming adequate environmental conditions, how easy do you find getting up in the mornings?",
    options: [
      "Not at all easy", "Not very easy", "Fairly easy", "Very easy"
    ],
    scores: [1, 2, 3, 4],
  },
  {
    text: "5. How alert do you feel during the first half hour after having woken in the mornings?",
    options: [
      "Not at all alert", "Slightly alert", "Fairly alert", "Very alert"
    ],
    scores: [1, 2, 3, 4],
  },
  {
    text: "6. How is your appetite during the first half-hour after having woken in the mornings?",
    options: [
      "Very poor", "Fairly poor", "Fairly good", "Very good"
    ],
    scores: [1, 2, 3, 4],
  },
  {
    text: "7. During the first half-hour after having woken in the morning, how tired do you feel?",
    options: [
      "Very tired", "Fairly tired", "Fairly refreshed", "Very refreshed"
    ],
    scores: [1, 2, 3, 4],
  },
  {
    text: "8. When you have no commitments the next day, at what time do you go to bed compared to your usual bedtime?",
    options: [
      "Seldom or never later", "Less than one hour later", "1-2 hours later", "More than two hours later"
    ],
    scores: [4, 3, 2, 1],
  },
  {
    text: "9. You have decided to engage in some physical exercise. A friend suggests that you do this one hour twice a week and the best time for him is between 7:00-8:00 a.m. Bearing in mind nothing else but your own 'feeling best' rhythm, how do you think you would perform?",
    options: [
      "Would be on good form", "Would be on reasonable form", "Would find it difficult", "Would find it very difficult"
    ],
    scores: [4, 3, 2, 1],
  },
  {
    text: "10. At what time in the evening do you feel tired and as a result in need of sleep?",
    options: [
      "8:00-9:00 PM", "9:00-10:15 PM", "10:15-12:30 AM", "12:30-1:45 AM", "1:45-3:00 AM or later"
    ],
    scores: [5, 4, 3, 2, 1],
  },
  {
    text: "11. You wish to be at your peak performance for a test which you know is going to be mentally exhausting and lasting for two hours. You are entirely free to plan your day and considering only your own 'feeling best' rhythm which ONE of the four testing times would you choose?",
    options: [
      "8:00-10:00 a.m.", "11:00 a.m.-1:00 p.m.", "3:00-5:00 p.m.", "7:00-9:00 p.m."
    ],
    scores: [6, 4, 2, 1],
  },
  {
    text: "12. If you went to bed at 11 p.m. at what level of tiredness would you be?",
    options: [
      "Not at all tired", "A little tired", "Fairly tired", "Very tired"
    ],
    scores: [1, 2, 3, 5],
  },
  {
    text: "13. For some reason you have gone to bed several hours later than usual, but there is no need to get up at any particular time the next morning. Which ONE of the following events are you most likely to experience?",
    options: [
      "Will wake up at usual time and will NOT fall asleep", "Will wake up at usual time and will doze thereafter", "Will wake up at usual time but will fall asleep again", "Will NOT wake up until later than usual"
    ],
    scores: [4, 3, 2, 1],
  },
  {
    text: "14. One night you have to remain awake between 4-6 a.m. in order to carry out a night watch. You have no commitments the next day. Which ONE of the following alternatives will suit you best?",
    options: [
      "Would NOT go to bed until watch was over", "Would take a nap before and sleep after", "Would take a good sleep before and nap after", "Would take ALL sleep before watch"
    ],
    scores: [1, 2, 3, 4],
  },
  {
    text: "15. You have to do two hours of hard physical work. You are entirely free to plan your day and considering only your own 'feeling best' rhythm which ONE of the following times would you choose?",
    options: [
      "8:00-10:00 a.m.", "11:00 a.m.-1:00 p.m.", "3:00-5:00 p.m.", "7:00-9:00 p.m."
    ],
    scores: [4, 3, 2, 1],
  },
  {
    text: "16. You have decided to engage in hard physical exercise. A friend suggests that you do this for one hour twice a week and the best time for him is between 10-11 p.m. Bearing in mind nothing else but your own 'feeling best' rhythm how well do you think you would perform?",
    options: [
      "Would be on good form", "Would be on reasonable form", "Would find it difficult", "Would find it very difficult"
    ],
    scores: [1, 2, 3, 4],
  },
  {
    text: "17. Suppose that you can choose your own work hours. Assume that you worked a FIVE hour day (including breaks) and that your job was interesting and paid by results. Which FIVE CONSECUTIVE HOURS would you select?",
    options: [
      "12-5 a.m.", "5-10 a.m.", "10 a.m.-3 p.m.", "3-8 p.m.", "8 p.m.-1 a.m."
    ],
    scores: [1, 5, 4, 3, 2],
  },
  {
    text: "18. At what time of the day do you think that you reach your 'feeling best' peak?",
    options: [
      "12-3 a.m.", "3-6 a.m.", "6-9 a.m.", "9 a.m.-12 p.m.", "12-3 p.m.", "3-6 p.m.", "6-9 p.m.", "9 p.m.-12 a.m."
    ],
    scores: [1, 1, 2, 3, 4, 5, 4, 3],
  },
  {
    text: "19. One hears about 'morning' and 'evening' types of people. Which ONE of these types do you consider yourself to be?",
    options: [
      "Definitely a 'morning' type", "Rather more a 'morning' than an evening type", "Rather more an 'evening' than a 'morning' type", "Definitely an 'evening' type"
    ],
    scores: [6, 4, 2, 1],
  },
];

function interpretScore(score: number) {
  if (score >= 70) return "Definitely morning type";
  if (score >= 59) return "Moderately morning type";
  if (score >= 42) return "Neither type";
  if (score >= 31) return "Moderately evening type";
  return "Definitely evening type";
}

export default function ChronotypeQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{score: number, chronotype: string} | null>(null);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSelect = (idx: number) => {
    const updated = [...answers];
    updated[step] = idx;
    setAnswers(updated);
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleFinish = () => {
    // Calculate total score
    let total = 0;
    answers.forEach((ans, i) => {
      if (ans !== null) total += questions[i].scores[ans];
    });
    const chronotype = interpretScore(total);
    setResult({ score: total, chronotype });
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");
      const { error } = await supabase
        .from('user_profiles')
        .update({ chronotype: result?.chronotype })
        .eq('user_id', session.user.id);
      if (error) throw error;
      router.push('/onboarding');
    } catch (err) {
      alert('Error saving result: ' + (err as any).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5"
           style={{
             background: 'linear-gradient(135deg, #843484 0%, #47154f 100%)',
             fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
           }}>
        <div className="bg-white rounded-[20px] max-w-xl w-full p-10 text-center"
             style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          <div className="chronotype-result bg-gradient-to-br from-[#843484] to-[#47154f] text-white p-8 rounded-[15px] mb-6">
            <h2 className="text-3xl font-bold mb-2">Your Chronotype</h2>
            <p className="text-xl font-semibold">{result.chronotype}</p>
            <p className="mt-4 text-base opacity-90">Score: <b>{result.score}</b></p>
          </div>
    
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="btn btn-primary w-full py-3 mt-4 rounded-full"
          >
            {isSubmitting ? 'Saving...' : 'Save and return to onboarding'}
          </button>
        </div>
      </div>
    );
  }

  const q = questions[step];

  return (
    <div className="min-h-screen flex items-center justify-center p-5"
         style={{
           background: 'linear-gradient(135deg, #843484 0%, #47154f 100%)',
           fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
         }}>
      <div className="bg-white rounded-[20px] max-w-2xl w-full p-10"
           style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
  
        {/* Progress Bar */}
        <div className="w-full h-2 bg-[#f0f0f0] rounded-full mb-8 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              background: 'linear-gradient(90deg, #5d905c, #8cc455)',
              width: `${((step + 1) / questions.length) * 100}%`
            }}
          ></div>
        </div>
  
        {/* Question Section */}
        <h1 className="text-3xl font-bold text-gray-800 mb-3">🌙 Chronotype Quiz</h1>
        <p className="text-gray-600 text-base mb-8">Answer the 19-question MEQ to discover your natural rhythm.</p>
  
        <div className="mb-6">
          <div className="font-medium text-lg text-gray-800 mb-4 leading-relaxed">{q.text}</div>
          <div className="flex flex-col gap-3">
            {q.options.map((opt, idx) => (
              <div
                key={idx}
                onClick={() => handleSelect(idx)}
                className={`option p-4 rounded-lg border-2 text-left cursor-pointer transition-all
                  ${answers[step] === idx
                    ? 'bg-[#843484] text-white border-[#843484]'
                    : 'bg-white text-gray-800 border-[#e0e0e0] hover:bg-[#faf7fa] hover:border-[#843484]'}`}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>
  
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="btn btn-secondary px-6 py-3 rounded-full"
          >
            Back
          </button>
          {step < questions.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={answers[step] === null}
              className="btn btn-primary px-6 py-3 rounded-full"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={answers[step] === null}
              className="btn btn-primary px-6 py-3 rounded-full"
            >
              See Result
            </button>
          )}
        </div>
  
        <div className="mt-6 text-sm text-gray-500 text-center">Question {step + 1} of {questions.length}</div>
      </div>
    </div>
  );
  
} 
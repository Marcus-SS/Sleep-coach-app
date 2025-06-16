"use client";

import { useState } from "react";

// All 19 questions from the Morningness-Eveningness Questionnaire
const questions = [
    {
      text: "1. If you were entirely free to plan your day, at what time would you get up?",
      options: [
        "5:00-6:30 AM", "6:30-7:45 AM", "7:45-9:45 AM", "9:45-11:00 AM", "11:00 AM-12:00 PM or later"
      ],
      scores: [5, 4, 3, 2, 1],
    },
    {
      text: "2. If you were entirely free to plan your evening, at what time would you go to bed?",
      options: [
        "8:00-9:00 PM", "9:00-10:15 PM", "10:15-12:30 AM", "12:30-1:45 AM", "1:45-3:00 AM or later"
      ],
      scores: [5, 4, 3, 2, 1],
    },
    {
      text: "3. At what time of day do you feel at your peak performance?",
      options: [
        "6-9 AM", "9 AM-12 PM", "12-3 PM", "3-6 PM", "6-9 PM", "9 PM-12 AM"
      ],
      scores: [5, 4, 3, 2, 1, 1],
    },
    {
      text: "4. How easy do you find getting up in the mornings?",
      options: [
        "Very easy", "Fairly easy", "Not very easy", "Not at all easy"
      ],
      scores: [4, 3, 2, 1],
    },
    {
      text: "5. At what time in the evening do you feel tired and need sleep?",
      options: [
        "8:00-9:00 PM", "9:00-10:15 PM", "10:15-12:30 AM", "12:30-1:45 AM", "1:45-3:00 AM or later"
      ],
      scores: [5, 4, 3, 2, 1],
    },
    {
      text: "6. Which type of person do you consider yourself to be?",
      options: [
        "Definitely a 'morning' type", "More a 'morning' than evening type", "More an 'evening' than morning type", "Definitely an 'evening' type"
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

export default function ChronotypeQuizStandalone() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [result, setResult] = useState<{score: number, chronotype: string} | null>(null);
  const [email, setEmail] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[step] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleBack = () => {
    if (showEmailForm) {
      setShowEmailForm(false);
      return;
    }
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    }
  };

  const handleFinish = () => {
    setShowEmailForm(true);
  };

  const handleSubmitEmail = () => {
    // Calculate score with explicit typing
    const totalScore: number = answers.reduce<number>((sum, answer, index) => {
      if (answer === null) return sum;
      return sum + questions[index].scores[answer];
    }, 0);

    // Determine chronotype
    const chronotype = 
      totalScore >= 70 ? "Definitely morning type" :
      totalScore >= 59 ? "Moderately morning type" :
      totalScore >= 42 ? "Neither type" :
      totalScore >= 31 ? "Moderately evening type" :
                        "Definitely evening type";

    setResult({ score: totalScore, chronotype });
  };

  if (result) {
    return (
      <div className="min-h-screen bg-[#47154f] p-4 sm:p-6 lg:p-8">
        <div className="max-w-xl mx-auto">
          <div className="bg-[#843484] rounded-3xl p-6 shadow-xl mb-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-semibold text-white">Sleep Coach</h1>
              <span className="text-white/80">Results 🌟</span>
            </div>
          </div>

          <div className="bg-[#843484] rounded-3xl p-6 shadow-xl mb-4">
            <h2 className="text-xl font-semibold text-white mb-4">Your Chronotype Result 🌙</h2>
            <div className="flex items-center justify-between mb-6">
              <div className="text-4xl font-bold text-white">{result.score}</div>
              <div className="text-xl text-white/90">{result.chronotype}</div>
            </div>
            <button
              onClick={() => window.print()}
              className="w-full py-3 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              View Details 📋
            </button>
          </div>

          <div className="bg-[#843484] rounded-3xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">What This Means 💡</h2>
            <p className="text-white/90 mb-6 leading-relaxed">
              Your chronotype determines your natural sleep-wake cycle. Understanding this can help you optimize your daily routine for better sleep and energy levels.
            </p>
            
            <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-3">Score Guide 📊</h3>
              <ul className="space-y-3 text-white/90">
                <li className="flex items-center">
                  <span className="text-lg mr-2">🌅</span>
                  70-86: Definitely morning type
                </li>
                <li className="flex items-center">
                  <span className="text-lg mr-2">🌄</span>
                  59-69: Moderately morning type
                </li>
                <li className="flex items-center">
                  <span className="text-lg mr-2">⚖️</span>
                  42-58: Neither type
                </li>
                <li className="flex items-center">
                  <span className="text-lg mr-2">🌆</span>
                  31-41: Moderately evening type
                </li>
                <li className="flex items-center">
                  <span className="text-lg mr-2">🌃</span>
                  16-30: Definitely evening type
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showEmailForm) {
    return (
      <div className="min-h-screen bg-[#47154f] p-4 sm:p-6 lg:p-8">
        <div className="max-w-xl mx-auto">
          <div className="bg-[#843484] rounded-3xl p-6 shadow-xl mb-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-semibold text-white">Sleep Coach</h1>
              <span className="text-white/80">Almost Done! 🎯</span>
            </div>
          </div>

          <div className="bg-[#843484] rounded-3xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Get Your Results 📧</h2>
            <p className="text-white/90 mb-6 leading-relaxed">
              Enter your email to receive your chronotype results and personalized sleep recommendations.
            </p>
            
            <div className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/50 backdrop-blur-sm border border-white/20 focus:border-white/40 focus:outline-none transition-colors"
              />
              
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                  ⬅️ Back
                </button>
                
                <button
                  onClick={handleSubmitEmail}
                  disabled={!email.includes('@')}
                  className="px-6 py-3 bg-white/10 text-white rounded-2xl hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors backdrop-blur-sm"
                >
                  See Results ✨
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[step];

  return (
    <div className="min-h-screen bg-[#47154f] p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl mx-auto">
        <div className="bg-[#843484] rounded-3xl p-6 shadow-xl mb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold text-white">Sleep Coach</h1>
            <span className="text-white/80">Chronotype Quiz 🌙</span>
          </div>
        </div>

        <div className="bg-[#843484] rounded-3xl p-6 shadow-xl">
          <div className="mb-6">
            <div className="text-lg font-medium mb-4 text-white">{q.text}</div>
            <div className="space-y-3">
              {q.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`w-full p-4 rounded-2xl transition-all duration-200 text-left
                    ${answers[step] === idx 
                      ? 'bg-white/20 backdrop-blur-sm' 
                      : 'bg-white/10 hover:bg-white/15'}`}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3
                      ${answers[step] === idx 
                        ? 'border-white bg-white' 
                        : 'border-white/50'}`}
                    >
                      {answers[step] === idx && (
                        <div className="w-2 h-2 bg-[#47154f] rounded-full"></div>
                      )}
                    </div>
                    <span className="flex-grow text-white">{opt}</span>
                    <span className="text-sm text-white/80">
                      {questions[step].scores[idx]} pts
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between text-sm text-white/80 mb-2">
              <div>Question {step + 1} of {questions.length}</div>
              <div>{Math.round((step / (questions.length - 1)) * 100)}%</div>
            </div>
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${Math.round((step / (questions.length - 1)) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-6">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className="px-6 py-3 bg-white/10 text-white rounded-2xl hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors backdrop-blur-sm"
            >
              ⬅️ Back
            </button>
            
            {step === questions.length - 1 ? (
              <button
                onClick={handleFinish}
                disabled={answers[step] === null}
                className="px-6 py-3 bg-white/10 text-white rounded-2xl hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors backdrop-blur-sm"
              >
                See Results ✨
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={answers[step] === null}
                className="px-6 py-3 bg-white/10 text-white rounded-2xl hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors backdrop-blur-sm"
              >
                Next ➡️
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
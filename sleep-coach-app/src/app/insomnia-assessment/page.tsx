"use client";

import { useState } from "react";
import type { FC } from 'react';

// Questions for the Insomnia Assessment
const questions = [
  {
    text: "1. 📋 Rate your difficulty falling asleep in the past week.",
    options: [
      "None",
      "Mild",
      "Moderate",
      "Severe",
      "Very Severe"
    ],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "2. 📋 Rate your difficulty staying asleep in the past week.",
    options: [
      "None",
      "Mild",
      "Moderate",
      "Severe",
      "Very Severe"
    ],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "3. 📋 Rate your problems with waking up too early in the past week.",
    options: [
      "None",
      "Mild",
      "Moderate",
      "Severe",
      "Very Severe"
    ],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "4. 📋 How satisfied or dissatisfied are you with your sleep pattern in the last 2 weeks?",
    options: [
      "Very Satisfied",
      "Satisfied",
      "Moderately Satisfied",
      "Dissatisfied",
      "Very Dissatisfied"
    ],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "5. 📋 How noticeable to others do you think your sleep problem is in terms of impairing the quality of your life?",
    options: [
      "Not at all Noticeable",
      "A Little",
      "Somewhat",
      "Much",
      "Very Much Noticeable"
    ],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "6. 📋 How worried or distressed are you about your current sleep problem?",
    options: [
      "Not at all Worried",
      "A Little",
      "Somewhat",
      "Much",
      "Very Much Worried"
    ],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "7. 📋 To what extent do you consider your sleep problem to interfere with your daily functioning in the last 2 weeks?",
    options: [
      "Not at all Interfering",
      "A Little",
      "Somewhat",
      "Much",
      "Very Much Interfering"
    ],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "8. 🏆 What is your main sleep goal?",
    options: [
      "Falling asleep faster",
      "Staying asleep longer",
      "Both"
    ],
    scores: [0, 0, 0], // This question doesn't contribute to the severity score
  },
];

function interpretScore(score: number) {
  if (score <= 7) return "None";
  if (score <= 14) return "Mild";
  if (score <= 21) return "Moderate";
  return "Severe";
}

const InsomniaAssessment: FC = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [result, setResult] = useState<{score: number, severity: string, goal: string} | null>(null);
  const [email, setEmail] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailError, setEmailError] = useState("");

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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) {
      validateEmail(e.target.value);
    }
  };

  const handleSubmitEmail = () => {
    if (!validateEmail(email)) {
      return;
    }
    // Calculate score excluding the last question (sleep goal)
    const totalScore = answers.slice(0, -1).reduce<number>((sum, answer, index) => {
      if (answer === null) return sum;
      return sum + (questions[index].scores[answer] || 0);
    }, 0);

    // Get the sleep goal from the last question
    const lastAnswer = answers[answers.length - 1];
    const goalIndex = lastAnswer !== null ? lastAnswer : 0;
    const sleepGoal = questions[questions.length - 1].options[goalIndex];

    setResult({
      score: totalScore,
      severity: interpretScore(totalScore),
      goal: sleepGoal
    });
  };

  if (result) {
    return (
      <div className="min-h-screen bg-[#47154f] p-4 sm:p-6 lg:p-8">
        <div className="max-w-xl mx-auto">
          <div className="flex justify-center mb-6 mt-2">
            <img src="/sleep-juicy-logo.png" alt="Sleep Juicy Logo" style={{ height: 70 }} />
          </div>
          <div className="bg-[#843484] rounded-3xl p-6 shadow-xl mb-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-semibold text-white">Sleep Coach</h1>
              <span className="text-white/80">Results 🌟</span>
            </div>
          </div>

          <div className="bg-[#843484] rounded-3xl p-6 shadow-xl mb-4">
            <h2 className="text-xl font-semibold text-white mb-4">Your Insomnia Assessment Result 💫</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <div className="text-4xl font-bold text-white">{result.score}</div>
                <div className="text-xl text-white/90">{result.severity} Insomnia</div>
              </div>
              <div className="bg-white/10 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-2">Your Sleep Goal</h3>
                <p className="text-white/90">{result.goal}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#843484] rounded-3xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">What This Means 💡</h2>
            <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-3">Score Guide 📊</h3>
              <ul className="space-y-3 text-white/90">
                <li className="flex items-center">
                  <span className="text-lg mr-2">😴</span>
                  0-7: No clinically significant insomnia
                </li>
                <li className="flex items-center">
                  <span className="text-lg mr-2">🌙</span>
                  8-14: Mild insomnia
                </li>
                <li className="flex items-center">
                  <span className="text-lg mr-2">🌓</span>
                  15-21: Moderate insomnia
                </li>
                <li className="flex items-center">
                  <span className="text-lg mr-2">🌑</span>
                  22-28: Severe insomnia
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
          <div className="flex justify-center mb-6 mt-2">
            <img src="/sleep-juicy-logo.png" alt="Sleep Juicy Logo" style={{ height: 70 }} />
          </div>
          <div className="bg-[#843484] rounded-3xl p-6 shadow-xl mb-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-semibold text-white">Sleep Coach</h1>
              <span className="text-white/80">Almost Done! 🎯</span>
            </div>
          </div>

          <div className="bg-[#843484] rounded-3xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Get Your Results 📧</h2>
            <p className="text-white/90 mb-6 leading-relaxed">
              Enter your email to receive your insomnia assessment results and personalized sleep recommendations.
            </p>
            
            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => validateEmail(email)}
                  placeholder="Enter your email"
                  className={`w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/50 backdrop-blur-sm border ${
                    emailError ? 'border-red-400' : 'border-white/20'
                  } focus:border-white/40 focus:outline-none transition-colors`}
                />
                {emailError && (
                  <p className="mt-2 text-red-400 text-sm">{emailError}</p>
                )}
              </div>
              
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                  ⬅️ Back
                </button>
                
                <button
                  onClick={handleSubmitEmail}
                  disabled={!email || !!emailError}
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
        <div className="flex justify-center mb-6 mt-2">
          <img src="/sleep-juicy-logo.png" alt="Sleep Juicy Logo" style={{ height: 70 }} />
        </div>
        <div className="bg-[#843484] rounded-3xl p-6 shadow-xl mb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold text-white">Sleep Coach</h1>
            <span className="text-white/80">Insomnia Assessment 💫</span>
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
};

export default InsomniaAssessment;
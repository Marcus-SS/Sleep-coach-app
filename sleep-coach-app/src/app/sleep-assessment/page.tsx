"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Question {
  text: string;
  options: string[];
  scores: number[];
  subQuestions?: string[];
}

interface Results {
  score: number;
  interpretation: string;
  sleepGoal: string;
}

// ISI Questions
const questions = [
  {
    text: "Please rate the current (i.e., last 2 weeks) SEVERITY of your insomnia problem(s):",
    subQuestions: [
      "Difficulty falling asleep",
      "Difficulty staying asleep",
      "Problem waking up too early"
    ],
    options: ["None", "Mild", "Moderate", "Severe", "Very Severe"],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "How SATISFIED/dissatisfied are you with your current sleep pattern?",
    options: ["Very Satisfied", "Satisfied", "Moderately Satisfied", "Dissatisfied", "Very Dissatisfied"],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "To what extent do you consider your sleep problem to INTERFERE with your daily functioning (e.g., daytime fatigue, ability to function at work/daily chores, concentration, memory, mood, etc.)?",
    options: ["Not at all Interfering", "A Little", "Somewhat", "Much", "Very Much Interfering"],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "How NOTICEABLE to others do you think your sleeping problem is in terms of impairing the quality of your life?",
    options: ["Not at all Noticeable", "Barely", "Somewhat", "Much", "Very Much Noticeable"],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "How WORRIED/distressed are you about your current sleep problem?",
    options: ["Not at all", "A Little", "Somewhat", "Much", "Very Much"],
    scores: [0, 1, 2, 3, 4],
  },
  {
    text: "What is your main sleep goal?",
    options: ["Falling asleep faster", "Staying asleep longer", "Both"],
    scores: [0, 0, 0], // This question doesn't contribute to the ISI score
  }
];

function interpretScore(score: number): string {
  if (score <= 7) return "No clinically significant insomnia";
  if (score <= 14) return "Subthreshold insomnia";
  if (score <= 21) return "Clinical insomnia (moderate severity)";
  return "Clinical insomnia (severe)";
}

export default function SleepAssessment() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[][]>(
    Array(questions.length).fill([]).map(() => Array(3).fill(-1))
  );
  const [result, setResult] = useState<Results | null>(null);
  const router = useRouter();

  const handleSelect = (questionIdx: number, subQuestionIdx: number, value: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIdx][subQuestionIdx] = value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Calculate total score
      let total = 0;
      answers.forEach((questionAnswers, qIdx) => {
        if (qIdx === 0) {
          // For the first question with subquestions, take the sum
          total += questionAnswers.slice(0, 3).reduce((sum, val) => sum + (val >= 0 ? val : 0), 0);
        } else if (qIdx < questions.length - 1) { // Exclude the sleep goal question from scoring
          total += questionAnswers[0] >= 0 ? questionAnswers[0] : 0;
        }
      });

      setResult({
        score: total,
        interpretation: interpretScore(total),
        sleepGoal: questions[questions.length - 1].options[answers[questions.length - 1][0]]
      });
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  if (result) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Your Sleep Assessment Results</h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Insomnia Severity Index (ISI)</h2>
          <p className="mb-2">Your Score: <span className="font-bold">{result.score}</span> out of 28</p>
          <p className="mb-4">Interpretation: <span className="font-semibold">{result.interpretation}</span></p>
          <p className="mb-4">Your Sleep Goal: <span className="font-semibold">{result.sleepGoal}</span></p>
        </div>

        <div className="mt-8 text-sm text-gray-600">
          <p className="mb-2">Score Interpretation Guide:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>0-7: No clinically significant insomnia</li>
            <li>8-14: Subthreshold insomnia</li>
            <li>15-21: Clinical insomnia (moderate severity)</li>
            <li>22-28: Clinical insomnia (severe)</li>
          </ul>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="mt-8 w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const q = questions[step];

  return (
    <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Sleep Assessment</h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">{q.text}</h2>
        
        {step === 0 ? (
          // First question with subquestions
          q.subQuestions?.map((subQ, subIdx) => (
            <div key={subIdx} className="mb-6">
              <p className="mb-2">{subQ}</p>
              <div className="grid grid-cols-5 gap-2">
                {q.options.map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    onClick={() => handleSelect(step, subIdx, optIdx)}
                    className={`p-2 text-sm border rounded-lg transition-colors
                      ${answers[step][subIdx] === optIdx 
                        ? 'bg-blue-100 border-blue-500' 
                        : 'border-gray-300 hover:border-blue-300'}`}
                  >
                    {opt}
                    <div className="text-xs text-gray-500">({optIdx})</div>
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          // Other questions
          <div className="grid grid-cols-1 gap-2">
            {q.options.map((opt, optIdx) => (
              <button
                key={optIdx}
                onClick={() => handleSelect(step, 0, optIdx)}
                className={`p-3 text-left border rounded-lg transition-colors
                  ${answers[step][0] === optIdx 
                    ? 'bg-blue-100 border-blue-500' 
                    : 'border-gray-300 hover:border-blue-300'}`}
              >
                {opt}
                {step < questions.length - 1 && (
                  <span className="text-sm text-gray-500 ml-2">({optIdx})</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={step === 0}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
        
        <button
          onClick={handleNext}
          disabled={
            step === 0 
              ? !answers[step].slice(0, 3).every(a => a >= 0)
              : answers[step][0] < 0
          }
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {step === questions.length - 1 ? 'See Results' : 'Next'}
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Question {step + 1} of {questions.length}
      </div>
    </div>
  );
} 
"use client";

import { useState } from "react";
import type { FC } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import BottomNav from '@/components/BottomNav';

// Questions for the Insomnia Assessment
const questions = [
  {
    text: "Rate your difficulty falling asleep in the past week.",
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
    text: "Rate your difficulty staying asleep in the past week.",
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
    text: "Rate your problems with waking up too early in the past week.",
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
    text: "How satisfied or dissatisfied are you with your sleep pattern in the last 2 weeks?",
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
    text: "How noticeable to others do you think your sleep problem is in terms of impairing the quality of your life?",
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
    text: "How worried or distressed are you about your current sleep problem?",
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
    text: "To what extent do you consider your sleep problem to interfere with your daily functioning in the last 2 weeks?",
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
    text: "What is your main sleep goal?",
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

  const handleSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[step] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    }
  };

  const handleFinish = async () => {
    // Calculate score excluding the last question (sleep goal)
    const totalScore = answers.slice(0, -1).reduce<number>((sum, answer, index) => {
      if (answer === null) return sum;
      return sum + (questions[index].scores[answer] || 0);
    }, 0);

    // Get the sleep goal from the last question
    const lastAnswer = answers[answers.length - 1];
    const goalIndex = lastAnswer !== null ? lastAnswer : 0;
    const sleepGoal = questions[questions.length - 1].options[goalIndex];

    const severity = interpretScore(totalScore);

    // Save the severity to the user's profile
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        throw new Error(`Failed to get session: ${sessionError.message}`);
      }
      
      if (!session) {
        throw new Error('No active session found');
      }

      console.log('Attempting to save insomnia severity:', {
        user_id: session.user.id,
        severity: severity.toLowerCase()
      });

      const { error: upsertError } = await supabase
        .from('user_profiles')
        .upsert([
          {
            user_id: session.user.id,
            insomnia_severity: severity.toLowerCase()
          }
        ], { 
          onConflict: 'user_id',
          ignoreDuplicates: false
        });
      
      if (upsertError) {
        console.error('Supabase upsert error details:', {
          message: upsertError.message,
          details: upsertError.details,
          hint: upsertError.hint,
          code: upsertError.code
        });
        throw new Error(`Failed to save insomnia severity: ${upsertError.message}`);
      }

      console.log('Successfully saved insomnia severity');
    } catch (err) {
      console.error('Error saving insomnia severity:', err);
      if (err instanceof Error) {
        alert(`Error saving your results: ${err.message}`);
      } else {
        alert('An unexpected error occurred while saving your results');
      }
      return;
    }

    setResult({
      score: totalScore,
      severity,
      goal: sleepGoal
    });
  };

  // Shared styles
  const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #843484 0%, #47154f 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  };

  const containerStyle = {
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    maxWidth: '600px',
    width: '100%',
    padding: '40px',
    textAlign: 'center' as const
  };

  const progressBarStyle = {
    width: '100%',
    height: '8px',
    background: '#f0f0f0',
    borderRadius: '4px',
    marginBottom: '30px',
    overflow: 'hidden'
  };

  const progressFillStyle = {
    height: '100%',
    background: 'linear-gradient(90deg, #5d905c, #8cc455)',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
    width: `${Math.round((step / questions.length) * 100)}%`
  };

  const optionStyle = (isSelected: boolean) => ({
    padding: '15px 20px',
    border: `2px solid ${isSelected ? '#843484' : '#e0e0e0'}`,
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: isSelected ? '#843484' : 'white',
    color: isSelected ? 'white' : '#333',
    textAlign: 'left' as const,
    marginBottom: '12px',
    width: '100%'
  });

  const buttonStyle = (variant: 'primary' | 'secondary', disabled: boolean = false) => ({
    padding: '12px 30px',
    border: 'none',
    borderRadius: '25px',
    fontSize: '16px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.5 : 1,
    background: variant === 'primary' 
      ? 'linear-gradient(90deg, #5d905c, #8cc455)' 
      : '#f0f0f0',
    color: variant === 'primary' ? 'white' : '#666'
  });

  if (result) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div style={progressBarStyle}>
            <div style={{...progressFillStyle, width: '100%'}}></div>
          </div>

          <h1 style={{color: '#333', marginBottom: '10px', fontSize: '2rem'}}>
            🌙 Your Sleep Assessment Results
          </h1>
          
          <div style={{
            background: 'linear-gradient(135deg, #843484 0%, #47154f 100%)',
            color: 'white',
            padding: '30px',
            borderRadius: '15px',
            margin: '30px 0',
            textAlign: 'left'
          }}>
            <h2 style={{fontSize: '1.5rem', marginBottom: '20px', textAlign: 'center'}}>
              Insomnia Severity Assessment
            </h2>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              padding: '20px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '12px'
            }}>
              <div style={{fontSize: '3rem', fontWeight: 'bold'}}>{result.score}</div>
              <div style={{fontSize: '1.2rem', textAlign: 'right'}}>
                <div>{result.severity}</div>
                <div style={{fontSize: '0.9rem', opacity: 0.8}}>Insomnia Level</div>
            </div>
          </div>

            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <h3 style={{marginBottom: '10px'}}>Your Sleep Goal</h3>
              <p style={{margin: 0, fontSize: '1.1rem'}}>{result.goal}</p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '20px',
              borderRadius: '12px'
            }}>
              <h3 style={{marginBottom: '15px'}}>Understanding Your Score</h3>
              <div style={{fontSize: '0.9rem', lineHeight: '1.6'}}>
                <div style={{marginBottom: '8px'}}>• 0-7: No clinically significant insomnia</div>
                <div style={{marginBottom: '8px'}}>• 8-14: Mild insomnia</div>
                <div style={{marginBottom: '8px'}}>• 15-21: Moderate insomnia</div>
                <div>• 22-28: Severe insomnia</div>
          </div>
            </div>
          </div>

          <p style={{color: '#666', marginBottom: '30px', lineHeight: '1.6'}}>
            <strong>Ready for better sleep?</strong> Our personalized sleep coaching program can help you achieve your goals with evidence-based techniques.
          </p>

                <button
            style={buttonStyle('primary')}
            onClick={() => window.location.reload()}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 5px 15px rgba(93, 144, 92, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Take Assessment Again
                </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const currentQuestion = questions[step];

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={progressBarStyle}>
          <div style={progressFillStyle}></div>
        </div>

        <h1 style={{color: '#333', marginBottom: '10px', fontSize: '2rem'}}>
          🌙 Sleep Assessment
        </h1>
        <p style={{color: '#666', marginBottom: '30px', fontSize: '1.1rem'}}>
          Question {step + 1} of {questions.length}
        </p>

        <div style={{textAlign: 'left', marginBottom: '30px'}}>
          <h3 style={{
            color: '#333',
            marginBottom: '20px',
            fontSize: '1.2rem',
            lineHeight: '1.4'
          }}>
            {currentQuestion.text}
          </h3>
          
          <div>
            {currentQuestion.options.map((option, index) => (
                <button
                key={index}
                onClick={() => handleSelect(index)}
                style={optionStyle(answers[step] === index)}
                onMouseOver={(e) => {
                  if (answers[step] !== index) {
                    e.currentTarget.style.borderColor = '#843484';
                    e.currentTarget.style.background = '#faf7fa';
                  }
                }}
                onMouseOut={(e) => {
                  if (answers[step] !== index) {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                {option}
                </button>
              ))}
            </div>
          </div>

        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '40px'}}>
            <button
            style={buttonStyle('secondary', step === 0)}
              onClick={handleBack}
              disabled={step === 0}
            onMouseOver={(e) => {
              if (!e.currentTarget.disabled) e.currentTarget.style.background = '#e0e0e0';
            }}
            onMouseOut={(e) => {
              if (!e.currentTarget.disabled) e.currentTarget.style.background = '#f0f0f0';
            }}
          >
            Previous
            </button>
            
            {step === questions.length - 1 ? (
              <button
              style={buttonStyle('primary', answers[step] === null)}
                onClick={handleFinish}
                disabled={answers[step] === null}
              onMouseOver={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(93, 144, 92, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Finish Assessment
              </button>
            ) : (
              <button
              style={buttonStyle('primary', answers[step] === null)}
                onClick={handleNext}
                disabled={answers[step] === null}
              onMouseOver={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(93, 144, 92, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
              >
              Next
              </button>
            )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default InsomniaAssessment;
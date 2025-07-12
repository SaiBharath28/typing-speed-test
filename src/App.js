import React, { useEffect, useState, useRef } from "react";

const DIFFICULTY_LEVELS = [
  { label: "Easy", time: 60, minLen: 30, maxLen: 50 },
  { label: "Medium", time: 60, minLen: 60, maxLen: 90 },
  { label: "Hard", time: 60, minLen: 100, maxLen: 140 }
];

const getRandomColor = () => {
  const colors = ["#6C63FF", "#FF6584", "#43E97B", "#FFD86E", "#43C6AC"];
  return colors[Math.floor(Math.random() * colors.length)];
};

const fetchQuoteWithLength = async (minLen, maxLen) => {
  const localQuotes = [
    "Practice makes perfect. Stay focused and keep typing.",
    "Fast fingers, sharp mind. One keystroke at a time.",
    "The quick brown fox jumps over the lazy dog.",
    "Typing is a skill that improves with practice every day.",
    "Accuracy is just as important as speed in typing tests.",
    "Challenge yourself to type longer sentences without mistakes.",
    "Consistent practice leads to remarkable improvement in typing speed and accuracy.",
    "The art of typing is a blend of rhythm, focus, and precision that develops over time.",
    "With every session, you become a faster and more accurate typist through dedicated practice.",
    "Professional typists understand that muscle memory is built through consistent daily practice sessions.",
    "The keyboard becomes an extension of your thoughts when you master the art of touch typing with precision and speed."
  ];
  
  try {
    // Try to fetch from API first
    for (let i = 0; i < 3; i++) {
      const res = await fetch("https://api.quotable.io/random");
      if (res.ok) {
        const data = await res.json();
        if (data.content.length >= minLen && data.content.length <= maxLen) {
          return data.content;
        }
      }
    }
  } catch (error) {
    console.log("API fetch failed, using local quotes");
  }
  
  // Fallback to local quotes
  const targetLength = (minLen + maxLen) / 2;
  let best = localQuotes[0];
  let bestDiff = Math.abs(localQuotes[0].length - targetLength);
  
  for (let q of localQuotes) {
    let diff = Math.abs(q.length - targetLength);
    if (diff < bestDiff && q.length >= minLen && q.length <= maxLen) {
      best = q;
      bestDiff = diff;
    }
  }
  
  return best;
};

const App = () => {
  const [quote, setQuote] = useState("Loading your typing challenge...");
  const [userInput, setUserInput] = useState("");
  const [timer, setTimer] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errors, setErrors] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [difficulty, setDifficulty] = useState(DIFFICULTY_LEVELS[0]);
  const [history, setHistory] = useState([]);
  const [quoteColor, setQuoteColor] = useState(getRandomColor());
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch quote for selected difficulty
  const loadQuote = async (level = difficulty) => {
    setIsLoading(true);
    try {
      const newQuote = await fetchQuoteWithLength(level.minLen, level.maxLen);
      setQuote(newQuote);
      setUserInput("");
      setQuoteColor(getRandomColor());
      setErrors(0);
      setAccuracy(100);
      setWpm(0);
      setTimer(level.time);
      setIsRunning(false);
      setIsStarted(false);
      setShowScore(false);
    } catch (error) {
      console.error("Failed to load quote:", error);
      setQuote("The quick brown fox jumps over the lazy dog. This is a fallback quote for typing practice.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuote();
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && timer > 0) {
      timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
    } else if (timer === 0 && isRunning) {
      setIsRunning(false);
      finalizeTest();
      setShowScore(true);
    }
    return () => clearTimeout(timerRef.current);
  }, [isRunning, timer]);

  // Live stats calculation
  useEffect(() => {
    if (!isRunning) return;
    const wordsTyped = userInput.trim().split(/\s+/).filter(Boolean).length;
    const timeSpent = difficulty.time - timer;
    const grossWpm = timeSpent > 0 ? Math.round((wordsTyped / timeSpent) * 60) : 0;
    setWpm(grossWpm);

    // Accuracy calculation
    let correct = 0;
    const compareLen = Math.min(userInput.length, quote.length);
    for (let i = 0; i < compareLen; i++) {
      if (userInput[i] === quote[i]) correct++;
    }
    const acc = userInput.length === 0 ? 100 : Math.round((correct / userInput.length) * 100);
    setAccuracy(acc);

    // Error count
    setErrors(userInput.length - correct);
  }, [userInput, timer, isRunning, quote, difficulty.time]);

  // Input change handler
  const handleInputChange = (e) => {
    if (!isStarted) return;
    const val = e.target.value;
    if (!isRunning && timer === difficulty.time && val.length === 1) {
      setIsRunning(true);
    }
    // Auto-stop if user completes the quote
    if (val === quote) {
      setUserInput(val);
      setIsRunning(false);
      finalizeTest(val);
      setShowScore(true);
      return;
    }
    // Prevent typing beyond quote length + buffer
    if (val.length > quote.length + 10) return;
    setUserInput(val);
  };

  // Start test
  const handleStart = () => {
    setIsStarted(true);
    setUserInput("");
    setTimer(difficulty.time);
    setIsRunning(false);
    setShowScore(false);
    setErrors(0);
    setAccuracy(100);
    setWpm(0);
    setTimeout(() => {
      inputRef.current && inputRef.current.focus();
    }, 100);
  };

  // Restart level
  const handleRestart = () => {
    loadQuote();
    setTimeout(() => {
      inputRef.current && inputRef.current.focus();
    }, 100);
  };

  // Next level or repeat
  const handleNext = () => {
    loadQuote();
    setTimeout(() => {
      inputRef.current && inputRef.current.focus();
    }, 100);
  };

  // Change difficulty and reload quote
  const handleDifficultyChange = (level) => {
    setDifficulty(level);
    loadQuote(level);
  };

  // Finalize test and update high score/history
  const finalizeTest = (finalInput) => {
    const input = finalInput !== undefined ? finalInput : userInput;
    const wordsTyped = input.trim().split(/\s+/).filter(Boolean).length;
    const timeSpent = difficulty.time - timer || 1;
    const finalWpm = Math.round((wordsTyped / timeSpent) * 60);
    let correct = 0;
    const compareLen = Math.min(input.length, quote.length);
    for (let i = 0; i < compareLen; i++) {
      if (input[i] === quote[i]) correct++;
    }
    const acc = input.length === 0 ? 100 : Math.round((correct / input.length) * 100);
    const errs = input.length - correct;

    if (finalWpm > highScore) {
      setHighScore(finalWpm);
    }
    const newHistory = [
      ...history,
      {
        date: new Date().toLocaleString(),
        wpm: finalWpm,
        accuracy: acc,
        errors: errs,
        difficulty: difficulty.label
      }
    ].slice(-5);
    setHistory(newHistory);
    setWpm(finalWpm);
    setAccuracy(acc);
    setErrors(errs);
  };

  // Highlight quote
  const highlightText = () => {
    if (!quote || isLoading) return null;
    
    const chars = quote.split("");
    return chars.map((char, idx) => {
      let className = "";
      if (userInput[idx] !== undefined) {
        className = userInput[idx] === char ? "correct" : "incorrect";
      } else if (idx === userInput.length && isStarted) {
        className = "current";
      }
      return (
        <span key={idx} className={className}>
          {char}
        </span>
      );
    });
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#333', fontSize: '2.5rem', margin: '0' }}>
          <span style={{ fontSize: '2rem' }}>⌨️</span> Typing Speed Test
        </h1>
      </header>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}>
        {DIFFICULTY_LEVELS.map((level) => (
          <button
            key={level.label}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: level.label === difficulty.label ? quoteColor : '#ddd',
              color: level.label === difficulty.label ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onClick={() => handleDifficultyChange(level)}
            disabled={isRunning || isStarted}
          >
            {level.label}
          </button>
        ))}
      </div>

      {/* Quote Box - Always Visible */}
      <div style={{
        border: `3px solid ${quoteColor}`,
        borderRadius: '12px',
        padding: '25px',
        backgroundColor: 'white',
        minHeight: '80px',
        fontSize: '18px',
        lineHeight: '1.6',
        marginBottom: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {isLoading ? (
          <span style={{ color: '#888', fontStyle: 'italic' }}>Loading new quote...</span>
        ) : (
          <div style={{ textAlign: 'center' }}>
            {highlightText() || quote}
          </div>
        )}
      </div>

      {/* Start Button */}
      {!isStarted && !showScore && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button
            onClick={handleStart}
            style={{
              padding: '15px 30px',
              fontSize: '18px',
              backgroundColor: quoteColor,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            disabled={isLoading}
          >
            ▶️ Start Test
          </button>
        </div>
      )}

      {/* Input Area */}
      {isStarted && (
        <textarea
          ref={inputRef}
          value={userInput}
          onChange={handleInputChange}
          disabled={!isRunning && (timer === 0 || userInput === quote)}
          placeholder="Start typing here..."
          style={{
            width: '100%',
            height: '120px',
            padding: '15px',
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'monospace',
            marginBottom: '20px',
            backgroundColor: isRunning ? 'white' : '#f9f9f9'
          }}
          autoFocus
          spellCheck={false}
          maxLength={quote.length + 10}
        />
      )}

      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: '#ddd',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <div style={{
          width: `${(timer / difficulty.time) * 100}%`,
          height: '100%',
          backgroundColor: quoteColor,
          transition: 'width 1s linear'
        }} />
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: quoteColor }}>{timer}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>⏳ Time Left</div>
        </div>
        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: quoteColor }}>{wpm}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>🏆 WPM</div>
        </div>
        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: quoteColor }}>{accuracy}%</div>
          <div style={{ fontSize: '12px', color: '#666' }}>🎯 Accuracy</div>
        </div>
        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: quoteColor }}>{errors}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>❌ Errors</div>
        </div>
        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: quoteColor }}>{highScore}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>🥇 High Score</div>
        </div>
      </div>

      {/* Control Buttons */}
      {isStarted && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button
            onClick={handleRestart}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🔁 Restart
          </button>
        </div>
      )}

      {/* Score Display */}
      {showScore && (
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          textAlign: 'center',
          marginBottom: '20px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: quoteColor, marginBottom: '20px' }}>🎉 Test Complete!</h2>
          <div style={{ fontSize: '18px', marginBottom: '20px' }}>
            <p><strong>WPM:</strong> {wpm}</p>
            <p><strong>Accuracy:</strong> {accuracy}%</p>
            <p><strong>Errors:</strong> {errors}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={handleNext}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: quoteColor,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ▶️ Next Test
            </button>
            <button
              onClick={handleRestart}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔁 Restart
            </button>
          </div>
        </div>
      )}

      {/* History */}
      <section style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '12px',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>Recent Results</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>WPM</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Accuracy</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Errors</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Difficulty</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                    No history yet. Complete a test to see your results!
                  </td>
                </tr>
              ) : (
                history.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{item.date}</td>
                    <td style={{ padding: '12px' }}>{item.wpm}</td>
                    <td style={{ padding: '12px' }}>{item.accuracy}%</td>
                    <td style={{ padding: '12px' }}>{item.errors}</td>
                    <td style={{ padding: '12px' }}>{item.difficulty}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
        <p>
          Made with <span style={{ color: '#FF6584' }}>♥</span> | Upgrade your typing skills!
        </p>
      </footer>

      <style jsx>{`
        .correct {
          background-color: #43E97B;
          color: white;
        }
        .incorrect {
          background-color: #FF6584;
          color: white;
        }
        .current {
          background-color: #FFD86E;
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default App;

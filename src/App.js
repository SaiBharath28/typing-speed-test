import React, { useEffect, useState, useRef } from "react";
import "./App.css";

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
  // Try up to 5 times to get a quote in the right range
  for (let i = 0; i < 5; i++) {
    const res = await fetch("https://api.quotable.io/random");
    if (!res.ok) continue;
    const data = await res.json();
    if (data.content.length >= minLen && data.content.length <= maxLen) {
      return data.content;
    }
  }
  // Fallback: use a local quote of approximate length
  const localQuotes = [
    "Practice makes perfect. Stay focused and keep typing.",
    "Fast fingers, sharp mind. One keystroke at a time.",
    "The quick brown fox jumps over the lazy dog.",
    "Typing is a skill that improves with practice every day.",
    "Accuracy is just as important as speed in typing tests.",
    "Challenge yourself to type longer sentences without mistakes.",
    "Consistent practice leads to remarkable improvement in typing speed and accuracy.",
    "The art of typing is a blend of rhythm, focus, and precision.",
    "With every session, you become a faster and more accurate typist."
  ];
  // Pick quote closest to desired length
  let best = localQuotes[0];
  let bestDiff = Math.abs(localQuotes[0].length - ((minLen + maxLen) / 2));
  for (let q of localQuotes) {
    let diff = Math.abs(q.length - ((minLen + maxLen) / 2));
    if (diff < bestDiff) {
      best = q;
      bestDiff = diff;
    }
  }
  return best;
};

const App = () => {
  const [quote, setQuote] = useState("");
  const [userInput, setUserInput] = useState("");
  const [timer, setTimer] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errors, setErrors] = useState(0);
  const [highScore, setHighScore] = useState(() => localStorage.getItem("highScore") || 0);
  const [difficulty, setDifficulty] = useState(DIFFICULTY_LEVELS[0]);
  const [history, setHistory] = useState(() => {
    const data = localStorage.getItem("history");
    return data ? JSON.parse(data) : [];
  });
  const [quoteColor, setQuoteColor] = useState(getRandomColor());
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch a quote of the right length for the selected difficulty
  const loadQuote = async (level = difficulty) => {
    const newQuote = await fetchQuoteWithLength(level.minLen, level.maxLen);
    setQuote(newQuote);
    setUserInput("");
    setQuoteColor(getRandomColor());
    setErrors(0);
    setAccuracy(100);
    setWpm(0);
    setTimer(level.time);
    setIsRunning(false);
  };

  useEffect(() => {
    loadQuote();
    // eslint-disable-next-line
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && timer > 0) {
      timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
    } else if (timer === 0 && isRunning) {
      setIsRunning(false);
      finalizeTest();
    }
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line
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
    // eslint-disable-next-line
  }, [userInput, timer, isRunning]);

  // Input change handler
  const handleInputChange = (e) => {
    const val = e.target.value;
    // Start timer on first character
    if (!isRunning && timer === difficulty.time && val.length === 1) {
      setIsRunning(true);
    }
    // Auto-stop if user completes the quote
    if (val === quote) {
      setUserInput(val);
      setIsRunning(false);
      finalizeTest(val);
      return;
    }
    // Prevent typing beyond quote length + small buffer
    if (val.length > quote.length + 10) return;
    setUserInput(val);
  };

  // Restart everything
  const handleRestart = () => {
    loadQuote();
    inputRef.current && inputRef.current.focus();
  };

  // Change difficulty and reload quote
  const handleDifficultyChange = (level) => {
    setDifficulty(level);
    loadQuote(level);
    inputRef.current && inputRef.current.focus();
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
      localStorage.setItem("highScore", finalWpm);
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
    localStorage.setItem("history", JSON.stringify(newHistory));
    setWpm(finalWpm);
    setAccuracy(acc);
    setErrors(errs);
  };

  // Highlight quote
  const highlightText = () => {
    const chars = quote.split("");
    return chars.map((char, idx) => {
      let className = "";
      if (userInput[idx]) {
        className = userInput[idx] === char ? "correct" : "incorrect";
      } else if (idx === userInput.length) {
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
    <div className="app">
      <header>
        <h1>
          <span className="logo">⌨️</span> Typing Speed Test
        </h1>
      </header>
      <div className="difficulty-selector">
        {DIFFICULTY_LEVELS.map((level) => (
          <button
            key={level.label}
            className={`difficulty-btn${level.label === difficulty.label ? " active" : ""}`}
            onClick={() => handleDifficultyChange(level)}
            disabled={isRunning}
          >
            {level.label}
          </button>
        ))}
      </div>
      <div className="quote-box" style={{ borderColor: quoteColor }}>
        {highlightText()}
      </div>
      <textarea
        ref={inputRef}
        value={userInput}
        onChange={handleInputChange}
        disabled={!isRunning && (timer === 0 || userInput === quote)}
        placeholder="Start typing here..."
        className="input-box"
        autoFocus
        spellCheck={false}
        maxLength={quote.length + 10}
      />
      <div className="progress-bar-container">
        <div
          className="progress-bar"
          style={{
            width: `${(timer / difficulty.time) * 100}%`,
            background: quoteColor
          }}
        />
      </div>
      <div className="stats">
        <p>⏳ <b>Time Left:</b> {timer}s</p>
        <p>🏆 <b>WPM:</b> {wpm}</p>
        <p>🎯 <b>Accuracy:</b> {accuracy}%</p>
        <p>❌ <b>Errors:</b> {errors}</p>
        <p>🥇 <b>High Score:</b> {highScore} WPM</p>
      </div>
      <button onClick={handleRestart} className="restart-btn">
        🔁 Restart
      </button>
      <section className="history-section">
        <h2>Recent Results</h2>
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>WPM</th>
              <th>Accuracy</th>
              <th>Errors</th>
              <th>Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr>
                <td colSpan="5">No history yet.</td>
              </tr>
            )}
            {history.map((item, idx) => (
              <tr key={idx}>
                <td>{item.date}</td>
                <td>{item.wpm}</td>
                <td>{item.accuracy}%</td>
                <td>{item.errors}</td>
                <td>{item.difficulty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <footer>
        <p>
          Made with <span style={{ color: "#FF6584" }}>♥</span> | Upgrade your typing skills!
        </p>
      </footer>
    </div>
  );
};

export default App;

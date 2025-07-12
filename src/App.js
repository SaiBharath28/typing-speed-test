import React, { useEffect, useState, useRef } from "react";
import "./App.css";

const DIFFICULTY_LEVELS = [
  { label: "Easy", time: 60 },
  { label: "Medium", time: 45 },
  { label: "Hard", time: 30 }
];

const getRandomColor = () => {
  const colors = ["#6C63FF", "#FF6584", "#43E97B", "#FFD86E", "#43C6AC"];
  return colors[Math.floor(Math.random() * colors.length)];
};

const getWords = (text) => text.trim().split(/\s+/);

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

  // Fetch a new quote
  const fetchQuote = async () => {
    try {
      const res = await fetch("https://api.quotable.io/random");
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      setQuote(data.content);
      setUserInput("");
      setQuoteColor(getRandomColor());
      setErrors(0);
      setAccuracy(100);
      setWpm(0);
    } catch {
      const localQuotes = [
        "Practice makes perfect.",
        "Stay focused and keep typing.",
        "You can do it!",
        "Fast fingers, sharp mind.",
        "One keystroke at a time."
      ];
      const random = Math.floor(Math.random() * localQuotes.length);
      setQuote(localQuotes[random]);
      setUserInput("");
      setQuoteColor(getRandomColor());
      setErrors(0);
      setAccuracy(100);
      setWpm(0);
    }
  };

  // Start with a quote
  useEffect(() => {
    fetchQuote();
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

  // Calculate WPM and accuracy live
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

  // On input change
  const handleInputChange = (e) => {
    const val = e.target.value;
    if (!isRunning && timer === difficulty.time && val.length === 1) {
      setIsRunning(true);
    }
    setUserInput(val);
  };

  // Restart everything
  const handleRestart = () => {
    setTimer(difficulty.time);
    setIsRunning(false);
    setUserInput("");
    setErrors(0);
    setAccuracy(100);
    setWpm(0);
    fetchQuote();
    inputRef.current && inputRef.current.focus();
  };

  // Change difficulty
  const handleDifficultyChange = (level) => {
    setDifficulty(level);
    setTimer(level.time);
    setIsRunning(false);
    setUserInput("");
    setErrors(0);
    setAccuracy(100);
    setWpm(0);
    fetchQuote();
  };

  // Finalize test and update high score/history
  const finalizeTest = () => {
    const wordsTyped = userInput.trim().split(/\s+/).filter(Boolean).length;
    if (wordsTyped > highScore) {
      setHighScore(wordsTyped);
      localStorage.setItem("highScore", wordsTyped);
    }
    const newHistory = [
      ...history,
      {
        date: new Date().toLocaleString(),
        wpm: wpm,
        accuracy: accuracy,
        errors: errors,
        difficulty: difficulty.label
      }
    ].slice(-5);
    setHistory(newHistory);
    localStorage.setItem("history", JSON.stringify(newHistory));
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
    <div className={`app`}>
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
        disabled={!isRunning && timer === 0}
        placeholder="Start typing here..."
        className="input-box"
        autoFocus
        spellCheck={false}
        maxLength={quote.length + 20}
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

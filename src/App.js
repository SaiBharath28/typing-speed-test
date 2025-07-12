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

const App = () => {
  const [quote, setQuote] = useState("");
  const [userInput, setUserInput] = useState("");
  const [timer, setTimer] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return localStorage.getItem("highScore") || 0;
  });
  const [darkMode, setDarkMode] = useState(false);
  const [difficulty, setDifficulty] = useState(DIFFICULTY_LEVELS[0]);
  const [history, setHistory] = useState(() => {
    const data = localStorage.getItem("history");
    return data ? JSON.parse(data) : [];
  });
  const [quoteColor, setQuoteColor] = useState(getRandomColor());
  const timerRef = useRef(null);

  const fetchQuote = async () => {
    try {
      const res = await fetch("https://api.quotable.io/random");
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      setQuote(data.content);
      setUserInput("");
      setQuoteColor(getRandomColor());
    } catch (error) {
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
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  useEffect(() => {
    if (isRunning && timer > 0) {
      timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
    } else if (timer === 0 && isRunning) {
      setIsRunning(false);
      const finalScore = Math.floor(userInput.trim().split(/\s+/).length);
      setScore(finalScore);
      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem("highScore", finalScore);
      }
      const newHistory = [
        ...history,
        {
          date: new Date().toLocaleString(),
          score: finalScore,
          difficulty: difficulty.label
        }
      ].slice(-5);
      setHistory(newHistory);
      localStorage.setItem("history", JSON.stringify(newHistory));
    }
    return () => clearTimeout(timerRef.current);
  }, [isRunning, timer]);

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
    if (!isRunning) {
      setIsRunning(true);
      setTimer(difficulty.time);
    }
  };

  const handleRestart = () => {
    fetchQuote();
    setUserInput("");
    setTimer(difficulty.time);
    setIsRunning(false);
    setScore(0);
  };

  const handleDifficultyChange = (level) => {
    setDifficulty(level);
    setTimer(level.time);
    setIsRunning(false);
    setScore(0);
    setUserInput("");
    fetchQuote();
  };

  const highlightText = () => {
    return quote.split("").map((char, idx) => {
      let className = "";
      if (userInput[idx]) {
        className = userInput[idx] === char ? "correct" : "incorrect";
      }
      return (
        <span key={idx} className={className}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className={`app ${darkMode ? "dark" : "light"}`}>
      <header>
        <button onClick={() => setDarkMode(!darkMode)} className="toggle-btn">
          {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
        </button>
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
        value={userInput}
        onChange={handleInputChange}
        disabled={!isRunning && timer === 0}
        placeholder="Start typing here..."
        className="input-box"
        autoFocus
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
        <p>🏆 <b>Score:</b> {score} WPM</p>
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
              <th>Score</th>
              <th>Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr>
                <td colSpan="3">No history yet.</td>
              </tr>
            )}
            {history.map((item, idx) => (
              <tr key={idx}>
                <td>{item.date}</td>
                <td>{item.score} WPM</td>
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

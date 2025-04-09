// src/App.js
import React, { useEffect, useState, useRef } from "react";
import "./App.css";

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
  const timerRef = useRef(null);

  const fetchQuote = async () => {
    try {
      const res = await fetch("https://api.quotable.io/random");
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      setQuote(data.content);
      setUserInput("");
    } catch (error) {
      console.error("Failed to fetch quote:", error);
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
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  useEffect(() => {
    if (isRunning && timer > 0) {
      timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
    } else if (timer === 0) {
      setIsRunning(false);
      const finalScore = Math.floor((userInput.length / 5));
      setScore(finalScore);
      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem("highScore", finalScore);
      }
    }
    return () => clearTimeout(timerRef.current);
  }, [isRunning, timer]);

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
    if (!isRunning) {
      setIsRunning(true);
      setTimer(60);
    }
  };

  const handleRestart = () => {
    fetchQuote();
    setUserInput("");
    setTimer(60);
    setIsRunning(false);
    setScore(0);
  };

  return (
    <div className={`app ${darkMode ? "dark" : "light"}`}>
      <button onClick={() => setDarkMode(!darkMode)} className="toggle-btn">
        {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
      </button>
      <h1>Typing Speed Test ⌨️</h1>
      <div className="quote-box">{quote}</div>
      <textarea
        value={userInput}
        onChange={handleInputChange}
        disabled={!isRunning && timer === 0}
        placeholder="Start typing here..."
        className="input-box"
      />
      <div className="stats">
        <p>⏳ Time Left: {timer}s</p>
        <p>🏆 Score: {score} WPM</p>
        <p>🥇 High Score: {highScore} WPM</p>
      </div>
      <button onClick={handleRestart} className="restart-btn">
        🔁 Restart
      </button>
    </div>
  );
};

export default App;
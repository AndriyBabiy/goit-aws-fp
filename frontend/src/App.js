import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

// The base URL for your API. This will be your CloudFront domain.
// For local testing, it would be http://localhost:8000
const API_BASE_URL = ""; // Let the browser figure it out from the current domain

function App() {
  const [subscribers, setSubscribers] = useState([]);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Function to fetch the list of subscribers from the backend
  const fetchSubscribers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscribers`);
      if (!response.ok) {
        throw new Error("Failed to fetch subscribers.");
      }
      const data = await response.json();
      setSubscribers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch subscribers when the component first loads
  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  // Function to handle the form submission
  const handleSubscribe = async (e) => {
    e.preventDefault(); // Prevent page reload
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Subscription failed.");
      }

      setMessage(`Successfully subscribed ${result.email}!`);
      setEmail(""); // Clear input field
      fetchSubscribers(); // Refresh the list
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AWS Newsletter Service</h1>
        <p>A demo running on a scalable AWS architecture.</p>
      </header>

      <main className="App-main">
        <div className="card">
          <h2>Subscribe to our Newsletter</h2>
          <form onSubmit={handleSubscribe}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
          {message && <p className="message">{message}</p>}
          {error && <p className="error">{error}</p>}
        </div>

        <div className="card">
          <div className="subscribers-header">
            <h2>Current Subscribers</h2>
            <button
              onClick={fetchSubscribers}
              className="refresh-btn"
              title="Refresh List"
              disabled={isLoading}
            >
              &#x21bb; {/* Unicode for refresh icon */}
            </button>
          </div>
          {isLoading && subscribers.length === 0 && <p>Loading...</p>}
          <ul>
            {subscribers.map((sub) => (
              <li key={sub.id}>{sub.email}</li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;

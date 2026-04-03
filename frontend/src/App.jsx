import React from 'react';

function App() {
  return (
    <div className="container">
      <div className="card">
        <h1>Hello from React</h1>
        <p>A simple, elegant starting point for your new frontend.</p>
        <button className="primary-btn" onClick={() => alert('Welcome!')}>
          Get Started
        </button>
      </div>
    </div>
  );
}

export default App;

import React from 'react';

export const Home: React.FC = () => { // Changed to named export
  return (
    <div>
      <h1>Welcome to NovelAI Creator!</h1>
      <p>Please select an existing project from the sidebar or create a new one to start writing.</p>
    </div>
  );
};
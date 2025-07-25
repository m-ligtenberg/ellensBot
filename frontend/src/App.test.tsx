import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock scrollIntoView for testing
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: () => {},
});

test('renders EllensBot title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Young Ellens Bot/i);
  expect(titleElement).toBeInTheDocument();
});

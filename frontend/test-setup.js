// Jest test setup file
import '@testing-library/jest-dom';

// Mock global objects
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

// Mock window.scrollTo
window.scrollTo = () => {};

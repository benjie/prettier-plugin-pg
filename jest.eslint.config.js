"use strict";

module.exports = {
  runner: "jest-runner-eslint",
  displayName: "lint",
  testMatch: ["<rootDir>/**/*.{ts,js}"],
  testPathIgnorePatterns: ["node_modules/", "dist/"],
};

export default {
  testTimeout: 60000,
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
    "^.+\\.m?jsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(msw|until-async|@bundled-es-modules|@mswjs)/)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/*.test.ts"],
  setupFilesAfterEnv: ["./src/__tests__/setup.ts"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "text-summary", "lcov", "json-summary"],
  collectCoverageFrom: [
    "src/lib/**/*.ts",
    "src/data/**/*.ts",
    "!src/**/*.d.ts",
  ],
};

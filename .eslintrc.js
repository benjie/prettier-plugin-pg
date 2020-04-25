module.exports = {
  parser: "babel-eslint",
  parserOptions: {
    sourceType: "module",
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
    },
  },
  extends: [
    "eslint:recommended",
    "prettier",
    "plugin:jest/recommended",
  ],
  plugins: ["import"],
  root: true,
  env: {
    jest: true,
    es6: true,
    node: true,
  },
  rules: {
    "no-debugger": 0,
    "comma-dangle": [
      2,
      {
        arrays: "always-multiline",
        objects: "always-multiline",
        imports: "always-multiline",
        exports: "always-multiline",
        functions: "never",
      },
    ],
    "no-confusing-arrow": 0,
    "no-console": 0,
    "no-else-return": 0,
    "no-underscore-dangle": 0,
    "no-unused-vars": [
      2,
      {
        argsIgnorePattern: "^_|^print$|^options$",
      },
    ],
    "no-restricted-syntax": 0,
    "no-await-in-loop": 0,
    camelcase: 0,
  },
  overrides: [
    {
      files: "tests/**/*.js",
      globals: {
        run_spec: true,
      },
    },
  ],
};

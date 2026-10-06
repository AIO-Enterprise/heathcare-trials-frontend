import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import prettierConfig from "eslint-config-prettier";

export default [
  js.configs.recommended,
  prettierConfig,
  {
    files: ["src/**/*.js", "src/**/*.jsx"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "warn",
      // TODO(phase-1): v7 compiler-assumption rules on a React 18 codebase with
      // no compiler — refactor incrementally (lazy useState initializers for
      // set-state-in-effect; hoist CampaignCreator's nested components for
      // static-components; derive wall-clock values in effects/handlers for
      // purity), then re-enable as errors.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/purity": "warn",
    },
  },
];

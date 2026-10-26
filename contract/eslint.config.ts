import js from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import { importX } from "eslint-plugin-import-x";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config({ ignores: ["**/node_modules/**"] }, js.configs.recommended, ...tseslint.configs.recommended, eslintPluginPrettierRecommended, {
  files: ["**/*.ts"],
  languageOptions: { globals: globals.node },
  plugins: { "import-x": importX, "unused-imports": unusedImports },
  rules: {
    curly: "error",
    "no-console": "error",
    "no-debugger": "warn",
    "no-else-return": "error",
    "prefer-const": "error",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/consistent-type-imports": "error",
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_", args: "after-used", ignoreRestSiblings: true },
    ],
    "padding-line-between-statements": [
      "error",
      { blankLine: "always", prev: "*", next: "multiline-const" },
      { blankLine: "always", prev: "*", next: "return" },
      { blankLine: "always", prev: "const", next: "export" },
      { blankLine: "always", prev: "multiline-block-like", next: "export" },
      { blankLine: "always", prev: "*", next: "multiline-expression" },
      { blankLine: "always", prev: "*", next: "if" },
      { blankLine: "always", prev: "multiline-expression", next: "*" },
      { blankLine: "always", prev: "if", next: "*" },
    ],
    "import-x/order": ["error", { groups: ["builtin", "external", "internal", "parent", "sibling", "index", "object"], "newlines-between": "ignore" }],
  },
});

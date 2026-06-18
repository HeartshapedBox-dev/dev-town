import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  globalIgnores(["dist/**", "node_modules/**", "coverage/**"]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
]);

export default eslintConfig;

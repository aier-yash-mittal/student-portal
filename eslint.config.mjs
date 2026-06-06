import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import securityPlugin from "eslint-plugin-security";
import noUnsanitizedPlugin from "eslint-plugin-no-unsanitized";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      security: securityPlugin,
      "no-unsanitized": noUnsanitizedPlugin,
    },
    rules: {
      ...securityPlugin.configs.recommended.rules,
      ...noUnsanitizedPlugin.configs.recommended.rules,
      // Custom security flags
      "security/detect-object-injection": "off", // can yield high false positives
      "security/detect-non-literal-fs-filename": "warn",
      // Allow explicit any for Supabase API mocking
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
  ]),
]);

export default eslintConfig;


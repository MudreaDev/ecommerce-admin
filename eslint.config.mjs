import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Adaugă ignores la început, separat
  {
    ignores: [
      "node_modules/**",
      ".next/**", 
      "out/**",
      "build/**",
      "lib/**",          // Fișierele generate de Prisma
      "prisma/generated/**",
      "next-env.d.ts",   // Fișierul generat de Next.js
      "**/*.wasm.js",    // Toate fișierele wasm
    ],
  },
  // Apoi extinde configurațiile
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Și adaugă rules-urile
  {
    rules: {
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_" 
      }],
      "@typescript-eslint/triple-slash-reference": "warn",
      "@typescript-eslint/no-require-imports": "warn",
    },
  },
];

export default eslintConfig;
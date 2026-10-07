import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Pattern useEffect(() => { loadData(); ... }, []) là hợp lệ để khởi tạo dữ liệu
      "react-hooks/set-state-in-effect": "off",
      // Cho phép dùng any khi cần thiết (API responses, dynamic data)
      "@typescript-eslint/no-explicit-any": "warn",
      // Unused vars: warn thay vì error, cho phép _ prefix
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "ignoreRestSiblings": true
      }],
      // Impure functions trong JSX props (Date.now) - warn thay vì error
      "react-hooks/purity": "warn",
      // Unescaped entities - warn thay vì error
      "react/no-unescaped-entities": "warn",
      // img thay vì next/image - warn (đã biết, cần refactor sau)
      "@next/next/no-img-element": "warn",
    }
  }
]);

export default eslintConfig;

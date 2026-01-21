"use strict";
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        files: ["**/*.js"],
        languageOptions: { globals: globals.node },
        rules: {
            ...js.configs.recommended.rules,
            "no-undef": "off",
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
            "prefer-const": "warn",
            "no-empty": "warn"
        },
        ignores: ["out/", "node_modules/"]
    },
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: tseslint.parser,
            globals: { ...globals.node, ...globals.es2020 }
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            "@typescript-eslint/no-require-imports": "off",
            "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
            "prefer-const": "warn",
            "no-empty": "warn",
            "no-undef": "off"
        },
        ignores: ["out/", "node_modules/"]
    }
]);
//# sourceMappingURL=eslint.config.mjs.map
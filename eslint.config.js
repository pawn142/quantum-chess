import globals from "globals";
import parserTypescript from "@typescript-eslint/parser";

export default [
	{
		files: [ "**/*.js", "**/*.ts" ],
		ignores: [ "dist/**/*" ],
		rules: {
			"no-undef": "off",
			"no-unused-vars": "warn",
			"use-isnan": "error",
			"semi": ["error", "always"],
			"semi-spacing": ["error", {
				before: false,
				after: true,
			}],
			"keyword-spacing": ["error", {
				before: true,
				after: true,
			}],
			"space-before-function-paren": ["error", "never"],
			"space-before-blocks": ["error", "always"],
			"arrow-spacing": ["error", { "before": true, "after": true }],
			"func-call-spacing": ["error", "never"],
			"space-infix-ops": ["error", { "int32Hint": false }],
			"no-eval": "error",
			"indent": ["error", "tab", {
				"SwitchCase": 1,
				"ignoredNodes": ["ConditionalExpression", "ArrayExpression"]
			}],
			"prefer-const": "warn",
			"max-depth": ["warn", 64],
			"no-var": "error",
			"eqeqeq": ["error", "always"],
			"dot-notation": "error",
			"no-empty": "off",
			"no-prototype-builtins": "off",
			"no-multi-spaces": "off",
			"no-case-declarations": "warn",
			"max-lines": ["warn", 10000],
			"complexity": ["warn", { "max": 64 }]
		},
		languageOptions: {
			parser: parserTypescript,
			sourceType: "module",
			globals: {
				NodeJS: "readonly",
				...globals.node,
				...globals.browser,
			}
		}
	},
];

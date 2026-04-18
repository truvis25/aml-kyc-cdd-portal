import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "backend/**",
    "frontend/**",
    "next-env.d.ts",
    "supabase/functions/**",
  ]),
  {
    // Apply to all source files but explicitly exclude app/api/ route handlers,
    // which are the only permitted location for createAdminClient() usage.
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["app/api/**"],
    rules: {
      // Block service-role admin client imports everywhere except app/api/ route handlers.
      // app/api/ is excluded above — that is the sole authorised boundary.
      // Architecture rule: lib/supabase/admin.ts must never appear in client components,
      // server components, shared modules, or middleware.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabase/admin",
              importNames: ["createAdminClient"],
              message:
                "createAdminClient() (service role) may only be used in app/api/ route handlers. " +
                "Use lib/supabase/server.ts in Server Components and middleware.",
            },
          ],
          patterns: [
            {
              group: ["*/lib/supabase/admin*"],
              message:
                "Admin client may only be imported in app/api/ route handlers. " +
                "It bypasses RLS — importing it elsewhere is a security violation.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;

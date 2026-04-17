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
    "next-env.d.ts",
    "supabase/functions/**",
  ]),
  {
    rules: {
      // Prevent the service-role admin client from being imported anywhere in app/.
      // API routes (app/api/) are the sole exception and must import it explicitly
      // with a documented justification comment.
      // Architecture rule: lib/supabase/admin.ts must never be used in client components,
      // server components, or middleware — only in app/api/** route handlers.
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

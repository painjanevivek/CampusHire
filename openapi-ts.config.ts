import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./openapi/campushire.openapi.json",
  output: {
    path: "./src/lib/api/generated",
    clean: true,
  },
  plugins: ["@hey-api/typescript"],
});

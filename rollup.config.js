import { terser } from "rollup-plugin-terser";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/index.js",
  output: {
    file: "dist/index.mjs",
    exports: "default",
    format: "es",
    plugins: [terser(), commonjs()],
  },
};

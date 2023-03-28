import { terser } from "rollup-plugin-terser";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/index.js",
  output: {
    dir: "dist",
    // file: "dist/index.js",
    exports: "default",
    format: "es",
    plugins: [terser(), commonjs()],
  },
};

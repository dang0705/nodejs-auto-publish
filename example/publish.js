import autoPublish from "../src/index.js";
// node 中使用 esm 模块，import文件的后缀名不可省略
const npmScript = "rollup:build";
autoPublish({
  branch: {
    1: {
      name: "release",
      npmScript,
      master: "master",
    },
    2: {
      name: "release-test",
      npmScript,
    },
  },
  debug: true,
});

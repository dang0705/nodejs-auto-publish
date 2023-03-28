import autoPublish from "../dist/index.js";
// node 中使用 esm 模块，import文件的后缀名不可省略
const npmScript = "rollup:build";
autoPublish({
  branch: [
    {
      name: "release",
      npmScript,
      master: "master",
    },
    {
      name: "release-test",
      npmScript,
    },
  ],
  // debug: true,
});

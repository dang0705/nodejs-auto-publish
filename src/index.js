import { execaSync, execa } from "execa";
import { chdir, cwd } from "node:process";
import readline from "node:readline";
import { stat } from "node:fs/promises";
import path from "node:path";
import ora from "ora";

const __dirName = path.resolve();
let spinner = ora("");

const getCurrentBranch = () =>
  execa("git", ["symbolic-ref", "--short", "-q", "HEAD"]);
const getCurrentSrcHash = (currentSourceBranch) =>
  execa("git", ["rev-parse", "--short", currentSourceBranch]);

const publish = async ({
  appName,
  release,
  master,
  npmScript,
  customScript,
  debug,
  dist,
}) => {
  process
    .on("uncaughtException", (err) => {
      spinner.fail(
        `${debug ? "调试" : "打包或部署"}意外退出，遇到以下问题：\n`
      );
      console.log(err);
      process.exit();
    })
    .on("SIGINT", process.exit)
    .on("exit", () => {
      try {
        execaSync("git", ["worktree", "remove", "-f", "-f", release]);
        execaSync("git", ["worktree", "prune"]);
      } catch (e) {}
      execaSync("exit", [1]);
    });

  const { stdout: currentSrcBranch } = await getCurrentBranch();

  if (master && master !== currentSrcBranch) {
    execaSync("echo", [`请切换到 ${master} 分支后再进行打包。`]);
    execaSync("exit", [1]);
    return;
  }
  spinner.text = `开始${debug ? "调试" : "打包部署"}...`;
  spinner.start();

  try {
    await stat(path.join(__dirName, "build"));
  } catch (e) {
    execaSync("mkdir", ["build"]);
  } finally {
    const { stdout } = await execa("git", [
      "worktree",
      "add",
      "-B",
      release,
      `build/${release}`,
      `origin/${release}`,
    ]);
    console.log(stdout);
    chdir(`build/${release}`);
    execaSync("rm", ["-rf", "*"]);
    chdir(__dirName);
  }
  spinner.text = `正在运行打包脚本... npm run ${npmScript}`;
  if (customScript) {
    await customScript();
  } else {
    const { stdout: bundleStatus, stderr: scriptErr } = await execa("npm", [
      "run",
      npmScript,
    ]);
    console.log(scriptErr + "\n", bundleStatus);
  }

  execaSync("cp", [
    "-rf",
    `${dist}${appName ? `/${appName}` : ""}/*`,
    `build/${release}`,
  ]);

  chdir(`build/${release}`);
  if (debug) {
    console.log(`git三连前的工作目录${cwd()}`);
    spinner.succeed("调试完成");
    return;
  }
  spinner.text = "打包完成，准备git发布";
  const { stdout: commits } = await getCurrentSrcHash(currentSrcBranch);

  const COMMITS = `built by branch-${currentSrcBranch}-git-commit-hash ${commits}`;

  execaSync("git", ["add", "-A"]);
  execaSync("git", ["commit", "-m", COMMITS]);
  const { stdout: publishStatus } = execaSync(
    "git",
    ["push", "-u", "--set-upstream", "origin", release],
    { shell: true }
  );
  console.log(publishStatus);
  spinner.succeed(
    `代码推送成功，本次推送的git提交信息为：${COMMITS}，打包分支为${release}`
  );
};

export default function ({
  release = "release",
  dist = "dist",
  master = "master",
  debug = false,
  npmScript,
  customScript = null,
}) {
  if (typeof release === "string") {
    publish({ release, master, npmScript, customScript, debug, dist });
    return;
  }
  const branches = [];
  for (const index in release) {
    branches.push(`${index}.${release[index].branch}`);
  }

  let r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  console.log("所有的构建分支：\n" + branches.join("\n"));

  r1.question("请选择一个构建分支（序号）：\n", async (answer) => {
    console.log("您选择了：", release[answer].branch + "分支");
    await publish({
      appName: release[answer].appName,
      release: release[answer].branch,
      master,
      npmScript: release[answer].npmScript,
      customScript,
      debug,
      dist,
    });
    r1.close();
  });
}

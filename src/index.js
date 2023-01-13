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

const publish = async ({
  release,
  master,
  npmScript,
  customCommit,
  debug,
  dist,
  shortCommitHash,
}) => {
  const cleanWorkTree = ({ removeBuildDir = false } = {}) => {
    try {
      chdir(__dirName);
      execaSync("git", ["worktree", "remove", "-f", "-f", release]);
      execaSync("git", ["worktree", "prune"]);
      if (removeBuildDir) {
        execaSync("rm", ["-rf", "build"]);
        debug && console.log("build临时目录已删除\n");
      }
    } catch (e) {}
  };
  const getCurrentSrcHash = (currentSourceBranch) =>
    execa("git", [
      "rev-parse",
      ...(shortCommitHash ? ["--short"] : []),
      currentSourceBranch,
    ]);
  const { stdout: currentSrcBranch } = await getCurrentBranch();

  process
    .on("SIGINT", process.exit)
    .on("uncaughtException", (err) => {
      spinner.fail(
        `${debug ? "调试" : "打包或部署"}意外退出，遇到以下问题：\n`
      );
      console.log(err);
      process.exit();
    })
    .on("exit", () => {
      cleanWorkTree({ removeBuildDir: true });
      execaSync("exit", [1]);
    });

  if (master && master !== currentSrcBranch) {
    console.log(`请切换到 ${master} 分支后再进行打包。`);
    execaSync("exit", [1]);
    return;
  }
  spinner.text = `开始${debug ? "调试" : "打包部署"}...`;
  spinner.start();

  try {
    await stat(path.join(__dirName, "build"));
  } catch (e) {
    execaSync("mkdir", ["build"]);
    debug && (spinner.text = `已在${cwd()}下建立临时目录build\n`);
  } finally {
    cleanWorkTree();
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
  const { stdout: bundleStatus, stderr: scriptErr } = await execa("npm", [
    "run",
    npmScript,
  ]);
  console.log(scriptErr + "\n", bundleStatus);

  execaSync("cp", ["-rf", `${dist}/*`, `build/${release}`]);

  chdir(`build/${release}`);
  debug && console.log(`git操作前的工作目录${cwd()}`);
  spinner.text = "打包完成，准备git发布";
  const { stdout: commits } = await getCurrentSrcHash(currentSrcBranch);

  if (customCommit) {
    var customCommitText = customCommit({ release, currentSrcBranch });
  }
  const COMMITS = `built by ${`[ ${
    customCommitText || `srcBranch:${currentSrcBranch}`
  } ]`} [ commit-hash:${commits} ]`;

  execaSync("git", ["add", "-A"]);
  execaSync("git", ["commit", "-m", COMMITS]);

  if (debug) {
    spinner.succeed(
      `调试完成，${
        customCommit
          ? `因开启了customCommit，本次自定义提交信息为${COMMITS}`
          : ""
      }调试模式下不会推送代码，请查看本地${release}分支的记录进行验证。`
    );
    return;
  }
  const { stdout: publishStatus } = execaSync("git", [
    "push",
    "-f",
    "origin",
    release,
  ]);
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
  customCommit = null,
  shortCommitHash = true,
}) {
  if (typeof release === "string") {
    publish({
      release,
      master,
      npmScript,
      customCommit,
      shortCommitHash,
      debug,
      dist,
    });
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
    console.log("您选择了：", release[answer].branch + "分支\n");
    await publish({
      release: release[answer].branch,
      dist: release[answer].dist || "dist",
      npmScript: release[answer].npmScript,
      master,
      customCommit,
      debug,
      shortCommitHash,
    });
    r1.close();
  });
}

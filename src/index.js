import { execaSync, execa } from "execa";
import copy from "copy";
import { chdir, cwd } from "node:process";
import fs from "node:fs";
import readline from "node:readline";
import { stat } from "node:fs/promises";
import path from "node:path";
import ora from "ora";
import rimraf from "rimraf";

const __dirName = path.resolve();
let spinner = ora("");
const { stdout: currentSrcBranch } = await execa("git", [
  "symbolic-ref",
  "--short",
  "-q",
  "HEAD",
]);

const handleInvalidBundleBranch = (bundleBranch) => {
  console.log(
    `请切换到${bundleBranch}分支进行打包。\nPlease checkout ${bundleBranch} for release build.`
  );
  execaSync("exit", [1]);
};
const publish = async ({
  branch,
  npmScript,
  customCommit,
  debug,
  dist,
  shortCommitHash,
}) => {
  const WORKTREE = {
    async add() {
      const { stdout } = await execa("git", [
        "worktree",
        "add",
        "-B",
        branch,
        `build/${branch}`,
        `origin/${branch}`,
      ]);
      return stdout;
    },
    exists() {
      const { stdout } = execaSync("git", ["worktree", "list"]);
      const worktrees = stdout.split("\n");
      return worktrees.some(
        (worktree) =>
          worktree.substring(
            worktree.indexOf("[") + 1,
            worktree.indexOf("]")
          ) === branch
      );
    },
    clear(cb = null) {
      chdir(__dirName);
      const clearWorktree = () => {
        try {
          execaSync("git", ["worktree", "remove", "-f", "-f", branch]);
          execaSync("git", ["worktree", "prune"]);
          fs.rmdir("./build", (err) => {
            err && console.log(err);
            cb && cb();
          });
        } catch (e) {}
      };

      if (debug) {
        if (!cb) clearWorktree();
      } else {
        this.exists() && clearWorktree();
      }
    },
  };
  const getCurrentSrcHash = (currentSourceBranch) =>
    execa("git", [
      "rev-parse",
      ...(shortCommitHash ? ["--short"] : []),
      currentSourceBranch,
    ]);

  process
    .on("SIGINT", process.exit)
    .on("uncaughtException", (err) => {
      spinner.fail(
        `${debug ? "调试" : "打包或部署"}意外退出，遇到以下问题：\n`
      );
      console.log(err);
      process.exit();
    })
    .on("exit", () => WORKTREE.clear(() => process.kill()));

  spinner.text = `开始${debug ? "调试" : "打包部署"}...`;
  spinner.start();

  try {
    await stat(path.join(__dirName, "build"));
  } catch (e) {
    fs.mkdir(
      "build",
      () => debug && (spinner.text = `已在${cwd()}下建立临时目录build\n`)
    );
  } finally {
    await WORKTREE.clear();
    console.log(await WORKTREE.add());
    const lastPackagedFiles = fs.readdirSync(`build/${branch}`);

    // 清空上一次的静态资源文件 （ 只保留.git文件做版本对比 ）
    lastPackagedFiles.forEach(
      (name) => name !== ".git" && rimraf(`build/${branch}/${name}`)
    );
  }
  spinner.text = `正在运行打包脚本... npm run ${npmScript}`;
  const { stdout: bundleStatus, stderr: scriptErr } = await execa("npm", [
    "run",
    npmScript,
  ]);
  console.log(scriptErr + "\n", bundleStatus);

  copy(
    [`${dist}/`, `${dist}/**/*`],
    `build/${branch}`,
    { flatten: false },
    async () => {
      chdir(`build/${branch}`);
      spinner.text = "打包完成，准备git发布";
      if (debug) {
        console.log(
          `\n已将下列文件从打包目录 ${dist} 移至发布目录 build/${branch}：\n`
        );
        fs.readdir(`build/${branch}`, (_, files) => console.log(files));
      }
      const { stdout: commits } = await getCurrentSrcHash(currentSrcBranch);

      const COMMITS = `built by ${`[ ${
        customCommit
          ? customCommit({ branch, currentSrcBranch })
          : `srcBranch:${currentSrcBranch}`
      } ]`} [ latest-src-commit: ${commits} ]`;

      execaSync("git", ["add", "-A"]);
      execaSync("git", ["commit", "-m", COMMITS]);

      if (debug) {
        spinner.succeed(
          `调试完成，${
            customCommit
              ? `因开启了customCommit，本次自定义提交信息为${COMMITS}`
              : ""
          }调试模式下不会推送代码，请查看本地${branch}分支的记录进行验证。`
        );
        return;
      }
      execa("git", ["push", "-f", "origin", branch]);
      spinner.succeed(
        `代码推送成功，本次推送的git提交信息为：${COMMITS}，打包分支为${branch}`
      );
    }
  );
};

export default function ({
  branch = "release",
  dist = "dist",
  master = "master",
  debug = false,
  npmScript,
  customCommit = null,
  shortCommitHash = true,
}) {
  console.log(
    "\x1b[43m%s\x1b[0m",
    `当前运行模式为：${
      debug ? "【 调试（打包后不推送) 】" : "【 正常（打包后推送） 】"
    },如需改成${
      debug ? "完整" : "调试（打包后不推送）"
    }模式，请将debug参数设置为${debug ? "false" : "true"}\n`
  );
  if (typeof branch === "string") {
    if (master && master !== currentSrcBranch) {
      handleInvalidBundleBranch(master);
      return;
    }
    publish({
      branch,
      npmScript,
      customCommit,
      shortCommitHash,
      debug,
      dist,
    });
    return;
  }
  const branches = [];
  for (const index in branch) {
    branches.push(`${index}.${branch[index].name}`);
  }

  let r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  console.log(
    "所有的构建分支(all packaging branches)：\n" + branches.join("\n")
  );

  r1.question("请选择一个构建分支（序号）：\n", async (answer) => {
    if (branch[answer].master && branch[answer].master !== currentSrcBranch) {
      handleInvalidBundleBranch(branch[answer].master);
      r1.close();
      return;
    }
    console.log("您选择了：", branch[answer].name + "分支\n");
    await publish({
      branch: branch[answer].name,
      dist: branch[answer].dist || "dist",
      npmScript: branch[answer].npmScript,
      customCommit,
      debug,
      shortCommitHash,
    });
    r1.close();
  });
}

import { execa, execaSync } from "execa";
import { chdir } from "node:process";
import fs from "node:fs";
import path from "node:path";
const __dirName = path.resolve();

export default (branch, debug) => ({
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
        worktree.substring(worktree.indexOf("[") + 1, worktree.indexOf("]")) ===
        branch
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
});

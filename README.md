## 基于nodejs的前端gitflow自动化代码部署。
## NodeJS-based front-end GitFlow automates code deployment

### 说明 (illustrate)：
#### 运用git worktree 实现前端自动部署，源码工作区和生产分支互不干扰。一键运行，自动部署。
Use Git Worktree to implement automatic front-end deployment, and the source code workspace and production branch do not interfere with each other.

### 准备工作 (preparations):

<!-- TOC -->
  * 前端 --- front-end
    * 需至少准备一个源码分支以外的生产分支(You need to prepare at least one production branch other than the source code branch)
    * branches eg:
      * master  -- 源码主分支
      * test    -- 测试分支
      * release -- 生产代码分支
      * ...其他分支


  * 服务端 --- server
    * 服务端对接代码仓库的各生产分支，部署于对应服务上。(The server connects to each production branch of the code repository and deploys it on the corresponding service.)
<!-- TOC -->


### 使用 (usage)：
```
// ./scripts/publish.mjs
import autoPublish from 'nodejs-auto-publish';

// 只有一个打包分支 only one packaging branch
autoPublish({
  branch: 'release',
  dist:'myDistPath',
  npmScript: 'app:prod',
  master:'master'  // Package qualifies the source branch that must be switched to
});

// 有多个打包分支 monorepo or multiple packaging branch
autoPublish({
  branch: {
    1: {
      name: 'release-branch-1',
      dist: 'myDistPath/app1',
      npmScript: 'app1:prod',
      master:'master'
    },
    2: {
      name: 'release-branch-2',
      dist: 'myDistPath/app2',
      npmScript: 'app2:prod'
    }
  }
});

// run node ./scripts/publish.mjs in terminal 
// 终端运行 node ./scripts/publish.mjs
```

| prop         | type            | desc                                                                          | default                          |
|--------------|-----------------|-------------------------------------------------------------------------------|----------------------------------|
| master       | string          | 你的主源码分支，如果设置为null，则任意分支均可以打包发布代码,否则必须切换到master分支才能进行                          | master                           |
| branch       | string / object | 打包分支名，请参照上述示例                                                                 | release                          |
| npmScript    | string          | 打包脚本，参照package.json的打包脚本，内部会执行`npm run ${npmScript}`，只在单个打包分支下有效，多个打包分支参照示例配置 |           |
| debug        | boolean         | 调试模式，在git commit 后结束进程，不会触发 git push                                          | false                            |
| customCommit | function        | 自定义git commit message                                                         | ({release,currentSrcBranch})=>{} |
| dist         | string          | 打包输出的目录，只在单个打包分支下有效，多个打包分支参照示例配置                                              | dist                             |
| shortCommit  | boolean         | 简短的commit hash                                                                | true                             |

## 基于nodejs的前端代码自动打包，git三连操作。
### git分支至少需满足以下结构，分支名可自定义<!-- TOC -->
* master  -- 源码主分支
* release -- 打包分支（不包含源码文件，只有打包后的文件）
<!-- TOC -->
### 打包输出的目录默认为根目录下的dist
### 使用：
```
// ./scripts/publish.mjs
import autoPublish from 'nodejs-auto-publish';

// 只有一个打包分支 only one packaging branch
autoPublish({
  branch: 'release',
  dist:'myDistPath',
  npmScript: 'app:prod',
  master:'master'  // The source code branch that must be switched for the current package
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

# 基于nodejs的前端代码自动打包，git三连操作。
# git分支至少需满足以下结构，分支名可自定义<!-- TOC -->
* master  -- 主分支
* release -- 打包分支（不包含源码文件，只有打包后的文件）
<!-- TOC -->
# 打包输出的目录默认为根目录下的dist
# 使用：
```
import autoPublish from 'nodejs-auto-publish';

// 单个打包分支
autoPublish({
  release: 'release',
  dist:'myDistPath',
  npmScript: 'app:prod'
});

// 多个打包分支
autoPublish({
  release: {
    1: {
      branch: 'release-1',
      dist: 'myDistPath/app1',
      npmScript: 'app1:prod'
    },
    2: {
      branch: 'release-2',
      dist: 'myDistPath/app2',
      npmScript: 'app2:prod'
    }
  }
});
```

| prop         | type            | desc                                               | default          |
|--------------|-----------------|----------------------------------------------------|------------------|
| master       | string          | 你的主分支，如果设置为null，则任意分支均可以打包发布代码,否则必须切换到master分支才能进行 | master           |
| release      | string / object | 请参照上述示例                                            | release          |
| npmScript    | string          | 打包脚本，参照package.json的打包脚本，只在单个应用下有效                 |                  |
| debug        | boolean         | 调试模式，在打包后结束进程，不会git三连                              | false            |
| customCommit | function        | 自定commit message                                   | ({release,currentSrcBranch})=>{} |
| dist         | string          | 打包输出的目录                                            | dist             |
| shortCommit        | boolean         | 简短的commit hash                                     | true             |

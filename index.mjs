import{execa as t,execaSync as o}from"execa";import e from"copy";import{cwd as i,chdir as r}from"node:process";import s from"node:fs";import n from"node:readline";import{stat as c}from"node:fs/promises";import a from"node:path";import m from"ora";const l=a.resolve();let d=m("");const{stdout:u}=await t("git",["symbolic-ref","--short","-q","HEAD"]),p=t=>{console.log(`请切换到${t}分支进行打包。\nPlease checkout ${t} for release build.`),o("exit",[1])},g=async({branch:n,npmScript:m,customCommit:p,debug:g,dist:f,shortCommitHash:$})=>{const h=async({removeBuildDir:o=!1}={})=>{const e=async()=>{try{r(l),console.log("清理worktree"),await t("git",["worktree","remove","-f","-f",n]),await t("git",["worktree","prune"]),s.rmdir("build",(t=>{}))}catch(t){}};if(g)!o&&e();else try{await c(a.join(l,`build/${n}`)),console.log("文件夹存在"),e()}catch(t){}};process.on("SIGINT",process.exit).on("uncaughtException",(t=>{d.fail((g?"调试":"打包或部署")+"意外退出，遇到以下问题：\n"),console.log(t),process.exit()})).on("exit",(async()=>{await h({removeBuildDir:!0}),o("exit",[1])})),d.text=`开始${g?"调试":"打包部署"}...`,d.start();try{await c(a.join(l,"build"))}catch(t){o("mkdir",["build"]),g&&(d.text=`已在${i()}下建立临时目录build\n`)}finally{await h();const{stdout:o}=await t("git",["worktree","add","-B",n,`build/${n}`,`origin/${n}`]);console.log(o),s.rm(`build/${n}/*`,(t=>console.log(t)))}d.text=`正在运行打包脚本... npm run ${m}`;const{stdout:b,stderr:w}=await t("npm",["run",m]);console.log(w+"\n",b);e([`${f}/`,`${f}/**/*`],`build/${n}`,{flatten:!1},(async()=>{r(`build/${n}`),g&&(console.log(`\ngit操作前的工作目录${i()}`),s.readdir(`build/${n}`,((t,o)=>{console.log(o)}))),d.text="打包完成，准备git发布";const{stdout:e}=await(c=u,t("git",["rev-parse",...$?["--short"]:[],c]));var c;if(p)var a=p({branch:n,currentSrcBranch:u});const m=`built by [ ${a||`srcBranch:${u}`} ] [ latest-src-commit:${e} ]`;o("git",["add","-A"]),o("git",["commit","-m",m]),g?d.succeed(`调试完成，${p?`因开启了customCommit，本次自定义提交信息为${m}`:""}调试模式下不会推送代码，请查看本地${n}分支的记录进行验证。`):(t("git",["push","-f","origin",n]),d.succeed(`代码推送成功，本次推送的git提交信息为：${m}，打包分支为${n}`))}))};function f({branch:t="release",dist:o="dist",master:e="master",debug:i=!1,npmScript:r,customCommit:s=null,shortCommitHash:c=!0}){if(console.log("[43m%s[0m",`当前运行模式为：${i?"【 调试（打包后不推送) 】":"【 完全（打包后推送） 】"},如需改成${i?"完整":"调试（打包后不推送）"}模式，请将debug参数设置为${i?"false":"true"}\n`),"string"==typeof t)return e&&e!==u?void p(e):void g({branch:t,npmScript:r,customCommit:s,shortCommitHash:c,debug:i,dist:o});const a=[];for(const o in t)a.push(`${o}.${t[o].name}`);let m=n.createInterface({input:process.stdin,output:process.stdout});console.log("所有的构建分支(all packaging branches)：\n"+a.join("\n")),m.question("请选择一个构建分支（序号）：\n",(async o=>{if(t[o].master&&t[o].master!==u)return p(t[o].master),void m.close();console.log("您选择了：",t[o].name+"分支\n"),await g({branch:t[o].name,dist:t[o].dist||"dist",npmScript:t[o].npmScript,customCommit:s,debug:i,shortCommitHash:c}),m.close()}))}export{f as default};

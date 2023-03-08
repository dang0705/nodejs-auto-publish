import{execa as t,execaSync as o}from"execa";import e from"copy";import{cwd as s,chdir as r}from"node:process";import i from"node:fs";import n from"node:readline";import{stat as c}from"node:fs/promises";import a from"node:path";import l from"ora";const m=a.resolve();let d=l("");const{stdout:u}=await t("git",["symbolic-ref","--short","-q","HEAD"]),g=t=>{console.log(`请切换到${t}分支进行打包。\nPlease checkout ${t} for release build.`),o("exit",[1])},p=async({branch:n,npmScript:l,customCommit:g,debug:p,dist:f,shortCommitHash:$})=>{const h=async o=>{r(m),console.log(s());const e=async()=>{try{console.log("清理worktree"),await t("git",["worktree","remove","-f","-f",n]),await t("git",["worktree","prune"]),i.rmdir("./build",(t=>t&&console.log(t))),o&&o()}catch(t){}};if(p)o||e();else try{const{stdout:o}=await t("git",["worktree","list"]);console.log(o),e()}catch(t){console.log(t)}};process.on("SIGINT",process.exit).on("uncaughtException",(t=>{d.fail((p?"调试":"打包或部署")+"意外退出，遇到以下问题：\n"),console.log(t),process.exit()})).on("exit",(async()=>{console.log("执行清理"),h((()=>t("exit",[1])))})),d.text=`开始${p?"调试":"打包部署"}...`,d.start();try{await c(a.join(m,"build"))}catch(t){i.mkdir("build",(()=>p&&(d.text=`已在${s()}下建立临时目录build\n`)))}finally{await h();const{stdout:o}=await t("git",["worktree","add","-B",n,`build/${n}`,`origin/${n}`]);console.log(o);i.readdirSync(`build/${n}`).forEach((t=>".git"!==t&&i.rm(`build/${n}/${t}`,(t=>t&&console.log(t)))))}d.text=`正在运行打包脚本... npm run ${l}`;const{stdout:b,stderr:w}=await t("npm",["run",l]);console.log(w+"\n",b);e([`${f}/`,`${f}/**/*`],`build/${n}`,{flatten:!1},(async()=>{r(`build/${n}`),p&&(console.log(`\ngit操作前的工作目录${s()}`),i.readdir(`build/${n}`,((t,o)=>{console.log(o)}))),d.text="打包完成，准备git发布";const{stdout:e}=await(c=u,t("git",["rev-parse",...$?["--short"]:[],c]));var c;if(g)var a=g({branch:n,currentSrcBranch:u});const l=`built by [ ${a||`srcBranch:${u}`} ] [ latest-src-commit:${e} ]`;o("git",["add","-A"]),o("git",["commit","-m",l]),p?d.succeed(`调试完成，${g?`因开启了customCommit，本次自定义提交信息为${l}`:""}调试模式下不会推送代码，请查看本地${n}分支的记录进行验证。`):(t("git",["push","-f","origin",n]),d.succeed(`代码推送成功，本次推送的git提交信息为：${l}，打包分支为${n}`))}))};function f({branch:t="release",dist:o="dist",master:e="master",debug:s=!1,npmScript:r,customCommit:i=null,shortCommitHash:c=!0}){if(console.log("[43m%s[0m",`当前运行模式为：${s?"【 调试（打包后不推送) 】":"【 完全（打包后推送） 】"},如需改成${s?"完整":"调试（打包后不推送）"}模式，请将debug参数设置为${s?"false":"true"}\n`),"string"==typeof t)return e&&e!==u?void g(e):void p({branch:t,npmScript:r,customCommit:i,shortCommitHash:c,debug:s,dist:o});const a=[];for(const o in t)a.push(`${o}.${t[o].name}`);let l=n.createInterface({input:process.stdin,output:process.stdout});console.log("所有的构建分支(all packaging branches)：\n"+a.join("\n")),l.question("请选择一个构建分支（序号）：\n",(async o=>{if(t[o].master&&t[o].master!==u)return g(t[o].master),void l.close();console.log("您选择了：",t[o].name+"分支\n"),await p({branch:t[o].name,dist:t[o].dist||"dist",npmScript:t[o].npmScript,customCommit:i,debug:s,shortCommitHash:c}),l.close()}))}export{f as default};

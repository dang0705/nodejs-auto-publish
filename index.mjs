import{execa as t,execaSync as o}from"execa";import r from"rimraf";import e from"copy";import{cwd as i,chdir as s}from"node:process";import n from"node:fs";import c from"node:readline";import{stat as m}from"node:fs/promises";import a from"node:path";import l from"ora";const d=a.resolve();let u=l("");const{stdout:p}=await t("git",["symbolic-ref","--short","-q","HEAD"]),g=t=>{console.log(`请切换到${t}分支进行打包。\nPlease checkout ${t} for release build.`),o("exit",[1])},f=async({branch:c,master:l,npmScript:g,customCommit:f,debug:$,dist:h,shortCommitHash:b})=>{const x=({removeBuildDir:t=!1}={})=>{try{s(d),o("git",["worktree","remove","-f","-f",c]),o("git",["worktree","prune"]),t&&$&&console.log("build临时目录已删除\n")}catch(t){}};process.on("SIGINT",process.exit).on("uncaughtException",(t=>{u.fail(($?"调试":"打包或部署")+"意外退出，遇到以下问题：\n"),console.log(t),process.exit()})).on("exit",(()=>{x({removeBuildDir:!0}),o("exit",[1])})),u.text=`开始${$?"调试":"打包部署"}...`,u.start();try{await m(a.join(d,"build"))}catch(t){o("mkdir",["build"]),$&&(u.text=`已在${i()}下建立临时目录build\n`)}finally{x();const{stdout:o}=await t("git",["worktree","add","-B",c,`build/${c}`,`origin/${c}`]);console.log(o);n.readdirSync(`build/${c}`).forEach((t=>".git"!==t&&r(`build/${c}/${t}`)))}u.text=`正在运行打包脚本... npm run ${g}`;const{stdout:v,stderr:y}=await t("npm",["run",g]);console.log(y+"\n",v);e(`${h}/*`,`build/${c}`,{},(async()=>{s(`build/${c}`),$&&console.log(`git操作前的工作目录${i()}`),u.text="打包完成，准备git发布";const{stdout:r}=await(e=p,t("git",["rev-parse",...b?["--short"]:[],e]));var e;if(f)var n=f({branch:c,currentSrcBranch:p});const m=`built by [ ${n||`srcBranch:${p}`} ] [ latest-src-commit:${r} ]`;if(o("git",["add","-A"]),o("git",["commit","-m",m]),$)return void u.succeed(`调试完成，${f?`因开启了customCommit，本次自定义提交信息为${m}`:""}调试模式下不会推送代码，请查看本地${c}分支的记录进行验证。`);const{stdout:a}=o("git",["push","-f","origin",c]);console.log(a),u.succeed(`代码推送成功，本次推送的git提交信息为：${m}，打包分支为${c}`)}))};function $({branch:t="release",dist:o="dist",master:r="master",debug:e=!1,npmScript:i,customCommit:s=null,shortCommitHash:n=!0}){if(console.log("[43m%s[0m",`当前运行模式为：${e?"【 调试（打包后不推送) 】":"【 完全（打包后推送） 】"},如需改成${e?"完整":"调试（打包后不推送）"}模式，请将debug参数设置为${e?"false":"true"}\n`),"string"==typeof t)return r&&r!==p?void g(r):void f({branch:t,npmScript:i,customCommit:s,shortCommitHash:n,debug:e,dist:o});const m=[];for(const o in t)m.push(`${o}.${t[o].name}`);let a=c.createInterface({input:process.stdin,output:process.stdout});console.log("所有的构建分支(all packaging branches)：\n"+m.join("\n")),a.question("请选择一个构建分支（序号）：\n",(async o=>{if(t[o].master&&t[o].master!==p)return g(t[o].master),void a.close();console.log("您选择了：",t[o].name+"分支\n"),await f({branch:t[o].name,dist:t[o].dist||"dist",npmScript:t[o].npmScript,customCommit:s,debug:e,shortCommitHash:n}),a.close()}))}export{$ as default};

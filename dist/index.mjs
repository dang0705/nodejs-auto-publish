import{execaSync as t,execa as o}from"execa";import{chdir as e,cwd as r}from"node:process";import s from"node:readline";import{stat as i}from"node:fs/promises";import n from"node:path";import c from"ora";const a=n.resolve();let m=c("");const u=async({appName:s,release:c,master:u,npmScript:p,customCommit:l,debug:d,dist:g,shortCommitHash:h})=>{process.on("uncaughtException",(t=>{m.fail((d?"调试":"打包或部署")+"意外退出，遇到以下问题：\n"),console.log(t),process.exit()})).on("SIGINT",process.exit).on("exit",(()=>{try{t("git",["worktree","remove","-f","-f",c]),t("git",["worktree","prune"])}catch(t){}t("exit",[1])}));const{stdout:f}=await o("git",["symbolic-ref","--short","-q","HEAD"]);if(u&&u!==f)return t("echo",[`请切换到 ${u} 分支后再进行打包。`]),void t("exit",[1]);m.text=`开始${d?"调试":"打包部署"}...`,m.start();try{await i(n.join(a,"build"))}catch(o){t("mkdir",["build"])}finally{const{stdout:r}=await o("git",["worktree","add","-B",c,`build/${c}`,`origin/${c}`]);console.log(r),e(`build/${c}`),t("rm",["-rf","*"]),e(a)}m.text=`正在运行打包脚本... npm run ${p}`;const{stdout:$,stderr:b}=await o("npm",["run",p]);console.log(b+"\n",$);t("cp",["-rf",`${`${g}${s?`/${s}`:""}`}/*`,`build/${c}`]),e(`build/${c}`),d&&console.log(`git三连前的工作目录${r()}`),m.text="打包完成，准备git发布";const{stdout:x}=await(w=f,o("git",["rev-parse",...h?["--short"]:[],w]));var w;if(l)var C=l({release:c,currentSrcBranch:f});const v=`built by ${C||`[ srcBranch:${f} ]`} [ commit-hash:${x} ]`;if(t("git",["add","-A"]),t("git",["commit","-m",v]),d)return void m.succeed(`调试完成，${l?`因开启了customCommit，本次自定义提交信息为${v}`:""}调试模式下推送代码，请查看本地${c}分支的记录进行验证。`);const{stdout:y}=t("git",["push","-u","--set-upstream","origin",c],{shell:!0});console.log(y),m.succeed(`代码推送成功，本次推送的git提交信息为：${v}，打包分支为${c}`)};function p({release:t="release",dist:o="dist",master:e="master",debug:r=!1,npmScript:i,customCommit:n=null,shortCommitHash:c=!0}){if("string"==typeof t)return void u({release:t,master:e,npmScript:i,customCommit:n,shortCommitHash:c,debug:r,dist:o});const a=[];for(const o in t)a.push(`${o}.${t[o].branch}`);let m=s.createInterface({input:process.stdin,output:process.stdout});console.log("所有的构建分支：\n"+a.join("\n")),m.question("请选择一个构建分支（序号）：\n",(async s=>{console.log("您选择了：",t[s].branch+"分支"),await u({appName:t[s].appName,release:t[s].branch,master:e,npmScript:t[s].npmScript,customCommit:n,debug:r,dist:o,shortCommitHash:c}),m.close()}))}export{p as default};

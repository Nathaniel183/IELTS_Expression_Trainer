const DATA={templates:"data/templates.txt",themes:"data/themes.txt",questions:"data/questions.txt",prompts:"data/prompts.txt",knowledge:"data/knowledge_base.txt"};
const STORE={progress:"ielts_trainer_progress_v1",records:"ielts_trainer_records_v1"};
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
const norm=s=>String(s||"").replace(/\s+/g," ").trim();
async function loadJson(k){try{const r=await fetch(DATA[k],{cache:"no-store"});if(!r.ok)throw 0;return JSON.parse(await r.text())}catch(e){console.warn("fallback",k);return window.IELTS_FALLBACK_DATA[k]}}
async function loadText(k){try{const r=await fetch(DATA[k],{cache:"no-store"});if(!r.ok)throw 0;return await r.text()}catch(e){return window.IELTS_FALLBACK_DATA.knowledgeBaseText||""}}
async function loadAll(){const [templates,themes,questions,prompts]=await Promise.all([loadJson("templates"),loadJson("themes"),loadJson("questions"),loadJson("prompts")]);return{templates,themes,questions,prompts}}
function getProgress(){try{return JSON.parse(localStorage.getItem(STORE.progress)||"{}")}catch{return{}}}
function setProgress(p){localStorage.setItem(STORE.progress,JSON.stringify(p))}
function updateProgress(id,patch){const p=getProgress();p[id]={...(p[id]||{}),...patch,updatedAt:new Date().toISOString()};setProgress(p);return p[id]}
function done(id){return !!getProgress()[id]?.done}
function getRecords(){try{return JSON.parse(localStorage.getItem(STORE.records)||"{}")}catch{return{}}}
function saveRecord(id,answer){const r=getRecords();r[id]=r[id]||[];r[id].unshift({answer,createdAt:new Date().toISOString()});r[id]=r[id].slice(0,20);localStorage.setItem(STORE.records,JSON.stringify(r));updateProgress(id,{done:true,lastAnswer:answer});return r[id]}
function toast(msg){const t=document.createElement("div");t.className="toast";t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2400)}
async function copyText(text,msg="已复制"){try{await navigator.clipboard.writeText(text)}catch{const a=document.createElement("textarea");a.value=text;document.body.appendChild(a);a.select();document.execCommand("copy");a.remove()}toast(msg)}
function download(name,text){const b=new Blob([text],{type:"application/json;charset=utf-8"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(u)}
function tplById(data,id){for(const g of data.templateGroups||[]){const t=(g.templates||[]).find(x=>x.id===id);if(t)return{...t,functionName:g.functionName,groupId:g.id}}return null}
function themeById(data,id){return(data.themes||[]).find(t=>t.id===id)}
function vocabById(data,id){for(const th of data.themes||[]){const v=(th.coreVocab||[]).find(x=>x.id===id);if(v)return{...v,themeId:th.id,themeName:th.name}}return null}
function fmt(iso){return new Date(iso).toLocaleString("zh-CN",{hour12:false})}

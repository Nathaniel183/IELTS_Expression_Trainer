const DATA_PATHS={
  taxonomy:"data/taxonomy.txt",templates:"data/templates.txt",themes:"data/themes.txt",
  questions:"data/questions.txt",prompts:"data/prompts.txt",knowledge:"data/knowledge_base.txt"
};
const STORE_KEYS={progress:"ielts_expression_progress_v3",records:"ielts_expression_records_v3"};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
const normalize=s=>String(s||"").replace(/\s+/g," ").replace(/\s+([,.;:?!])/g,"$1").trim();

async function loadJsonTxt(key){
  try{
    const res=await fetch(DATA_PATHS[key],{cache:"no-store"});
    if(!res.ok)throw new Error(key);
    return JSON.parse(await res.text());
  }catch(err){
    console.warn("Using fallback data:",key);
    return window.IELTS_FALLBACK_DATA?.[key];
  }
}
async function loadText(key){
  try{
    const res=await fetch(DATA_PATHS[key],{cache:"no-store"});
    if(!res.ok)throw new Error(key);
    return await res.text();
  }catch(err){
    return window.IELTS_FALLBACK_DATA?.knowledgeBaseText||"";
  }
}
async function loadAll(){
  const [taxonomy,templates,themes,questions,prompts]=await Promise.all([
    loadJsonTxt("taxonomy"),loadJsonTxt("templates"),loadJsonTxt("themes"),
    loadJsonTxt("questions"),loadJsonTxt("prompts")
  ]);
  return{taxonomy,templates,themes,questions,prompts};
}
function getProgress(){try{return JSON.parse(localStorage.getItem(STORE_KEYS.progress)||"{}")}catch{return{}}}
function setProgress(v){localStorage.setItem(STORE_KEYS.progress,JSON.stringify(v))}
function updateProgress(id,patch){
  const p=getProgress();p[id]={...(p[id]||{}),...patch,updatedAt:new Date().toISOString()};setProgress(p);return p[id];
}
function isDone(id){return!!getProgress()[id]?.done}
function getRecords(){try{return JSON.parse(localStorage.getItem(STORE_KEYS.records)||"{}")}catch{return{}}}
function saveRecord(id,answer){
  const r=getRecords();r[id]=r[id]||[];r[id].unshift({answer,createdAt:new Date().toISOString()});r[id]=r[id].slice(0,20);
  localStorage.setItem(STORE_KEYS.records,JSON.stringify(r));updateProgress(id,{done:true,lastAnswer:answer});return r[id];
}
function clearProgress(){localStorage.removeItem(STORE_KEYS.progress);localStorage.removeItem(STORE_KEYS.records)}
function toast(message){
  const root=$("#toastRoot");if(!root)return;
  const el=document.createElement("div");el.className="toast";el.textContent=message;root.appendChild(el);
  setTimeout(()=>{el.style.opacity="0";el.style.transform="translateY(6px)"},2200);
  setTimeout(()=>el.remove(),2500);
}
async function copyText(text,message="已复制"){
  try{await navigator.clipboard.writeText(text)}
  catch{
    const t=document.createElement("textarea");t.value=text;t.style.position="fixed";t.style.left="-9999px";document.body.appendChild(t);t.select();document.execCommand("copy");t.remove();
  }
  toast(message);
}
function downloadText(name,text){
  const blob=new Blob([text],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
}
function themeById(data,id){return(data.themes||[]).find(x=>x.id===id)}
function functionById(data,id){return(data.primaryFunctions||[]).find(x=>x.id===id)}
function templateById(data,id){
  for(const group of data.templateGroups||[]){const t=(group.templates||[]).find(x=>x.id===id);if(t)return{...t,functionName:group.functionName}}
  return null;
}
function vocabById(data,id){
  for(const theme of data.themes||[]){const v=(theme.coreVocab||[]).find(x=>x.id===id);if(v)return{...v,themeName:theme.name}}
  return null;
}
function fmtDate(iso){return new Date(iso).toLocaleString("zh-CN",{hour12:false})}
function shuffled(array,seed=Math.random()){
  const a=array.slice();let x=typeof seed==="number"?seed:String(seed).split("").reduce((n,c)=>((n*31+c.charCodeAt(0))>>>0),2166136261);
  const rand=()=>{x=(1664525*x+1013904223)>>>0;return x/4294967296};
  for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a;
}

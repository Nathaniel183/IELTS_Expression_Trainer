
const DATA_PATHS = {
  taxonomy: "data/taxonomy.txt",
  templates: "data/templates.txt",
  themes: "data/themes.txt",
  questions: "data/questions.txt",
  prompts: "data/prompts.txt",
  knowledge: "data/knowledge_base.txt"
};
const STORE_KEYS = {
  progress: "ielts_expression_trainer_progress_v4",
  records: "ielts_expression_trainer_records_v4"
};
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const esc = value => String(value ?? "")
  .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
  .replaceAll('"',"&quot;").replaceAll("'","&#039;");
const normalText = value => String(value ?? "").replace(/\s+/g," ").trim();

async function loadJsonTxt(key){
  try{
    const response = await fetch(DATA_PATHS[key], {cache:"no-store"});
    if(!response.ok) throw new Error(key);
    return JSON.parse(await response.text());
  }catch(error){
    console.warn(`Using fallback data: ${key}`, error);
    return window.IELTS_FALLBACK_DATA?.[key];
  }
}
async function loadText(key){
  try{
    const response = await fetch(DATA_PATHS[key], {cache:"no-store"});
    if(!response.ok) throw new Error(key);
    return await response.text();
  }catch(error){
    return window.IELTS_FALLBACK_DATA?.knowledgeBaseText || "";
  }
}
async function loadAllData(){
  const [taxonomy,templates,themes,questions,prompts] = await Promise.all([
    loadJsonTxt("taxonomy"),loadJsonTxt("templates"),loadJsonTxt("themes"),
    loadJsonTxt("questions"),loadJsonTxt("prompts")
  ]);
  return {taxonomy,templates,themes,questions,prompts};
}
function getProgress(){
  try{return JSON.parse(localStorage.getItem(STORE_KEYS.progress) || "{}");}
  catch{return {};}
}
function setProgress(progress){
  localStorage.setItem(STORE_KEYS.progress, JSON.stringify(progress));
}
function updateProgress(questionId, patch){
  const progress = getProgress();
  progress[questionId] = {...(progress[questionId] || {}), ...patch, updatedAt:new Date().toISOString()};
  setProgress(progress);
  return progress[questionId];
}
function resetQuestionProgress(questionId){
  const progress = getProgress();
  delete progress[questionId];
  setProgress(progress);
}
function getRecords(){
  try{return JSON.parse(localStorage.getItem(STORE_KEYS.records) || "{}");}
  catch{return {};}
}
function saveFreeRecord(questionId, answer){
  const records = getRecords();
  records[questionId] = records[questionId] || [];
  records[questionId].unshift({answer, createdAt:new Date().toISOString()});
  records[questionId] = records[questionId].slice(0,20);
  localStorage.setItem(STORE_KEYS.records, JSON.stringify(records));
  updateProgress(questionId,{done:true,lastAnswer:answer});
  return records[questionId];
}
function questionStatus(question, progress=getProgress()){
  const state = progress[question.id] || {};
  if(question.type === "free") return state.done ? "mastered" : "new";
  if(state.done || state.clozeCorrect) return "mastered";
  if(state.buildCorrect) return "assembled";
  return "new";
}
function statusSymbol(status){
  return status === "mastered" ? "✓" : status === "assembled" ? "◐" : "○";
}
function statusLabel(status){
  return status === "mastered" ? "已掌握" : status === "assembled" ? "待填空" : "未做";
}
function normalizeCloze(value){
  return String(value ?? "")
    .toLowerCase()
    .replace(/['’‘]/g,"")
    .replace(/[^a-z0-9]+/g," ")
    .replace(/\s+/g," ")
    .trim();
}
function isAccepted(value, accepted){
  const norm = normalizeCloze(value);
  return (accepted || []).some(item => normalizeCloze(item) === norm);
}
function themeById(themes,id){
  return (themes.themes || []).find(item => item.id === id);
}
function templateById(templates,id){
  for(const group of templates.templateGroups || []){
    const found = (group.templates || []).find(item => item.id === id);
    if(found) return {...found,functionName:group.functionName};
  }
  return null;
}
function vocabById(themes,id){
  for(const theme of themes.themes || []){
    const found = (theme.coreVocab || []).find(item => item.id === id);
    if(found) return {...found,themeName:theme.name};
  }
  return null;
}
function showToast(message){
  const root = $("#toastRoot") || document.body;
  const item = document.createElement("div");
  item.className = "toast";
  item.textContent = message;
  root.appendChild(item);
  setTimeout(()=>item.classList.add("show"),10);
  setTimeout(()=>item.classList.remove("show"),2100);
  setTimeout(()=>item.remove(),2400);
}
async function copyText(text,message="已复制"){
  try{
    await navigator.clipboard.writeText(text);
  }catch{
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  showToast(message);
}
function downloadText(filename,text){
  const blob = new Blob([text],{type:"application/json;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href=url; link.download=filename;
  document.body.appendChild(link); link.click(); link.remove();
  URL.revokeObjectURL(url);
}
function formatDate(iso){
  return new Date(iso).toLocaleString("zh-CN",{hour12:false});
}

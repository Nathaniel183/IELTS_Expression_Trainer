
let DATA;
const state = {
  theme:"all", type:"all", functionId:"all", mode:"all", order:"sequence",
  questions:[], index:0, selected:[], forceAssembly:{}, clozeUi:{}
};

document.addEventListener("DOMContentLoaded", async ()=>{
  DATA = await loadAllData();
  initialiseFilters();
  applyUrlTheme();
  refreshPool();
  bindControls();
  renderAll();
});

function initialiseFilters(){
  $("#themeFilter").innerHTML = `<option value="all">全部主题</option>` +
    (DATA.themes.themes || []).map(t=>`<option value="${t.id}">${t.icon || ""} ${esc(t.name)}</option>`).join("");
  $("#functionFilter").innerHTML = `<option value="all">全部表达类型</option>` +
    (DATA.taxonomy.primaryFunctions || []).map(f=>`<option value="${f.id}">${esc(f.shortName || f.name)}</option>`).join("");
}
function applyUrlTheme(){
  const theme = new URLSearchParams(location.search).get("theme");
  if(theme && themeById(DATA.themes,theme)){
    state.theme=theme;
    $("#themeFilter").value=theme;
  }
}
function modeMatches(question,selected){
  if(selected==="all") return true;
  if(selected==="speaking") return question.mode==="speaking" || question.mode==="both";
  if(selected==="writing") return question.mode==="writing" || question.mode==="both";
  return question.mode===selected;
}
function refreshPool(keepId=null){
  let questions = DATA.questions.questions || [];
  if(state.theme!=="all") questions=questions.filter(q=>q.themeId===state.theme);
  if(state.type!=="all") questions=questions.filter(q=>q.type===state.type);
  if(state.functionId!=="all") questions=questions.filter(q=>q.primaryFunction===state.functionId);
  questions=questions.filter(q=>modeMatches(q,state.mode));
  state.questions=questions;
  if(keepId){
    const found=questions.findIndex(q=>q.id===keepId);
    state.index=found>=0?found:0;
  }else{
    state.index=Math.min(state.index,Math.max(0,questions.length-1));
  }
  state.selected=[];
}
function bindControls(){
  $("#themeFilter").addEventListener("change",event=>{
    state.theme=event.target.value;
    history.replaceState(null,"",state.theme==="all"?"practice.html":`practice.html?theme=${encodeURIComponent(state.theme)}`);
    refreshPool();renderAll();
  });
  $("#typeFilter").addEventListener("change",event=>{state.type=event.target.value;refreshPool();renderAll();});
  $("#functionFilter").addEventListener("change",event=>{state.functionId=event.target.value;refreshPool();renderAll();});
  $("#modeFilter").addEventListener("change",event=>{state.mode=event.target.value;refreshPool();renderAll();});
  $$(".segmented button").forEach(button=>button.addEventListener("click",()=>{
    $$(".segmented button").forEach(item=>item.classList.remove("active"));
    button.classList.add("active");
    state.order=button.dataset.order;
    if(state.order==="random") chooseRandom(); else renderAll();
  }));
  $("#prevBtn").addEventListener("click",()=>moveQuestion(-1));
  $("#nextBtn").addEventListener("click",()=>moveQuestion(1));
  $("#randomBtn").addEventListener("click",chooseRandom);
  $("#listToggle").addEventListener("click",()=>$("#questionListPanel").classList.toggle("open"));
}
function currentQuestion(){return state.questions[state.index] || null;}
function moveQuestion(delta){
  if(!state.questions.length) return;
  state.index=(state.index+delta+state.questions.length)%state.questions.length;
  state.selected=[];
  renderAll();
}
function chooseRandom(){
  if(!state.questions.length) return;
  const old=state.index;
  if(state.questions.length>1){
    do{state.index=Math.floor(Math.random()*state.questions.length);}while(state.index===old);
  }
  state.selected=[];
  renderAll();
}
function renderAll(){renderProgress();renderList();renderQuestion();}
function renderProgress(){
  const progress=getProgress();
  const mastered=state.questions.filter(q=>questionStatus(q,progress)==="mastered").length;
  $("#progressText").textContent=`${mastered}/${state.questions.length}`;
  $("#progressBar").style.width=state.questions.length?`${Math.round(mastered/state.questions.length*100)}%`:"0%";
}
function renderList(){
  const progress=getProgress();
  const root=$("#questionListPanel");
  root.innerHTML=`<h2>题目列表</h2>` + (state.questions.map((q,index)=>{
    const status=questionStatus(q,progress);
    return `<button class="q-item ${index===state.index?"active":""}" data-index="${index}">
      <span class="q-title"><span>${esc(q.title)}</span><span class="q-status ${status}">${statusSymbol(status)}</span></span>
      <span class="q-meta">${q.type==="build"?"拼句+填空":"自由表达"} · ${esc(q.subType || q.taskKind || q.level)}</span>
    </button>`;
  }).join("") || `<div class="inline-note">当前筛选条件下没有题目。</div>`);
  $$(".q-item",root).forEach(button=>button.addEventListener("click",()=>{
    state.index=Number(button.dataset.index);
    state.selected=[];
    renderAll();
    if(innerWidth<1020) root.classList.remove("open");
  }));
}
function headerHtml(q){
  const theme=themeById(DATA.themes,q.themeId);
  const status=questionStatus(q);
  const func=(DATA.taxonomy.primaryFunctions||[]).find(f=>f.id===q.primaryFunction);
  return `<div class="question-head">
    <div>
      <div class="question-tags">
        <span class="chip">${theme?.icon || "📘"} ${esc(theme?.name || q.themeId)}</span>
        <span class="chip">${q.type==="build"?"拼句 + 填空":"自由表达"}</span>
        <span class="chip">${esc(func?.shortName || q.primaryFunction || "")}</span>
        <span class="chip status-chip ${status}">${statusSymbol(status)} ${statusLabel(status)}</span>
      </div>
      <h1>${esc(q.title)}</h1>
    </div>
    <button class="btn small ${status==="mastered"?"danger":""}" id="manualStatusBtn">${status==="mastered"?"标记未完成":"手动标记已掌握"}</button>
  </div><div class="prompt-box">${esc(q.promptZh)}</div>`;
}
function bindManualStatus(q){
  $("#manualStatusBtn")?.addEventListener("click",()=>{
    const status=questionStatus(q);
    if(status==="mastered"){
      resetQuestionProgress(q.id);
      delete state.clozeUi[q.id];
      state.selected=[];
    }else{
      updateProgress(q.id,q.type==="build"?{buildCorrect:true,clozeCorrect:true,done:true,manual:true}:{done:true,manual:true});
    }
    renderAll();
  });
}
function renderQuestion(){
  const root=$("#questionRoot");
  const q=currentQuestion();
  if(!q){root.innerHTML=`<div class="inline-note">没有可显示的题目。</div>`;return;}
  if(q.type==="build") renderBuild(root,q); else renderFree(root,q);
}

function renderBuild(root,q){
  const progress=getProgress()[q.id] || {};
  const assemblyMode=!progress.buildCorrect || state.forceAssembly[q.id];
  root.innerHTML=headerHtml(q) + (assemblyMode?assemblyHtml(q):completedAssemblyHtml(q)) +
    ((!assemblyMode && progress.buildCorrect)?clozeHtml(q):"");
  bindManualStatus(q);
  if(assemblyMode) bindAssembly(q);
  else{
    $("#redoAssemblyBtn")?.addEventListener("click",()=>{state.forceAssembly[q.id]=true;state.selected=[];renderQuestion();});
    bindCloze(q);
  }
}
function assemblyHtml(q){
  const selected=state.selected.map(id=>q.tokens.find(t=>t.id===id)).filter(Boolean);
  const used=new Set(state.selected);
  return `<div class="block">
    <div class="block-title"><h3>选择并排序</h3></div>
    <div class="token-bank" id="tokenBank">${q.tokens.map(token=>`
      <button class="token ${token.kind} ${used.has(token.id)?"used":""}" data-token="${token.id}" draggable="true">${esc(token.text)}</button>`).join("")}</div>
  </div>
  <div class="block">
    <div class="block-title"><h3>你的答案</h3></div>
    <div class="answer-zone ${selected.length?"":"empty"}" id="answerZone">${selected.map(token=>`
      <button class="token ${token.kind}" data-remove="${token.id}">${esc(token.text)} ×</button>`).join("")}</div>
    <div class="sentence-preview">${esc(selected.map(t=>t.text).join(" "))}</div>
  </div>
  <div class="actions compact">
    <button class="btn primary" id="checkAssemblyBtn">检查拼句</button>
    <button class="btn" id="clearAssemblyBtn">清空</button>
    <button class="btn" id="showSampleBtn">显示示范</button>
  </div><div id="assemblyFeedback"></div>`;
}
function completedAssemblyHtml(q){
  return `<div class="feedback success"><strong>拼句正确</strong><br>${esc(q.sampleAnswers[0])}</div>
    <div class="actions compact"><button class="btn small" id="redoAssemblyBtn">重新拼句</button></div>`;
}
function bindAssembly(q){
  $$("[data-token]").forEach(button=>{
    button.addEventListener("click",()=>addToken(q,button.dataset.token));
    button.addEventListener("dragstart",event=>event.dataTransfer.setData("text/plain",button.dataset.token));
  });
  $$("[data-remove]").forEach(button=>button.addEventListener("click",()=>{
    const index=state.selected.indexOf(button.dataset.remove);
    if(index>=0) state.selected.splice(index,1);
    renderQuestion();
  }));
  const zone=$("#answerZone");
  zone.addEventListener("dragover",event=>event.preventDefault());
  zone.addEventListener("drop",event=>{event.preventDefault();addToken(q,event.dataTransfer.getData("text/plain"));});
  $("#clearAssemblyBtn").addEventListener("click",()=>{state.selected=[];renderQuestion();});
  $("#showSampleBtn").addEventListener("click",()=>{
    $("#assemblyFeedback").innerHTML=`<div class="feedback info">${esc(q.sampleAnswers[0])}</div>`;
  });
  $("#checkAssemblyBtn").addEventListener("click",()=>checkAssembly(q));
}
function addToken(q,id){
  if(!q.tokens.some(t=>t.id===id) || state.selected.includes(id)) return;
  state.selected.push(id);renderQuestion();
}
function checkAssembly(q){
  const attempt=state.selected.join("|");
  const correct=(q.acceptableAnswers||[]).some(answer=>answer.join("|")===attempt);
  const previous=getProgress()[q.id] || {};
  if(!correct){
    updateProgress(q.id,{assemblyAttempts:(previous.assemblyAttempts||0)+1,lastAssemblyCorrect:false});
    $("#assemblyFeedback").innerHTML=`<div class="feedback error">顺序还不正确，请调整后再试。</div>`;
    return;
  }
  updateProgress(q.id,{
    buildCorrect:true,clozeCorrect:previous.clozeCorrect||false,done:previous.clozeCorrect||false,
    assemblyAttempts:(previous.assemblyAttempts||0)+1,lastAssemblyCorrect:true
  });
  state.forceAssembly[q.id]=false;
  state.selected=[];
  state.clozeUi[q.id]={values:{},wrong:[],hint:false,revealed:false,message:""};
  renderAll();
}

function getClozeUi(qid){
  if(!state.clozeUi[qid]) state.clozeUi[qid]={values:{},wrong:[],hint:false,revealed:false,message:"",completed:false};
  return state.clozeUi[qid];
}
function clozeHtml(q){
  const ui=getClozeUi(q.id);
  const items=Object.fromEntries((q.cloze?.items||[]).map(item=>[item.id,item]));
  const sentence=(q.cloze?.parts||[]).map(part=>{
    if(part.type==="text") return esc(part.text);
    const item=items[part.id];
    const value=ui.values?.[part.id] || "";
    const cls=ui.wrong?.includes(part.id)?"wrong":ui.completed?"correct":"";
    return `<input class="cloze-input ${cls}" data-blank="${part.id}" value="${esc(value)}"
      style="--words:${Math.max(2,item?.wordCount||2)}" aria-label="${esc(item?.zh||"填空")}"
      autocomplete="off" autocapitalize="off" spellcheck="false">`;
  }).join("");
  const cues=(q.cloze?.items||[]).map((item,index)=>{
    const initials=item.answer.split(/\s+/).map(word=>word.replace(/[^A-Za-z]/g,"")[0]||"").join(" · ");
    return `<div class="cloze-cue"><span>${index+1}. ${esc(item.zh)}</span>
      <span>${ui.hint?`<b class="hint-text">${item.wordCount}词 · ${esc(initials)}</b>`:""}</span></div>`;
  }).join("");
  let message="";
  if(ui.revealed){
    message=`<div class="feedback info"><strong>参考答案：</strong><br>${(q.cloze.items||[]).map((item,i)=>`${i+1}. ${esc(item.answer)}`).join("<br>")}<br><br>清空后重新填写，才能计为掌握。</div>`;
  }else if(ui.completed){
    message=`<div class="feedback success"><strong>填空正确，本题已掌握。</strong></div>`;
  }else if(ui.message){
    message=`<div class="feedback error">${esc(ui.message)}</div>`;
  }
  return `<div class="cloze-card">
    <div class="cloze-head"><div><h3>核心表达填空</h3><p>根据中文提示填写英文词组。</p></div></div>
    <div class="cloze-sentence">${sentence}</div>
    <div class="cloze-cues">${cues}</div>
    <div class="actions compact">
      <button class="btn primary" id="checkClozeBtn" ${ui.revealed?"disabled":""}>检查填空</button>
      <button class="btn" id="hintClozeBtn">${ui.hint?"隐藏提示":"提示"}</button>
      <button class="btn" id="revealClozeBtn">显示答案</button>
      <button class="btn" id="resetClozeBtn">清空后重试</button>
    </div>${message}
  </div>`;
}
function collectClozeValues(q){
  const values={};
  (q.cloze?.items||[]).forEach(item=>{values[item.id]=$(`[data-blank="${item.id}"]`)?.value || "";});
  return values;
}
function bindCloze(q){
  $("#checkClozeBtn")?.addEventListener("click",()=>checkCloze(q));
  $("#hintClozeBtn")?.addEventListener("click",()=>{
    const ui=getClozeUi(q.id);
    ui.values=collectClozeValues(q);ui.hint=!ui.hint;renderQuestion();
  });
  $("#revealClozeBtn")?.addEventListener("click",()=>{
    const ui=getClozeUi(q.id);
    ui.values=collectClozeValues(q);ui.revealed=true;ui.completed=false;ui.wrong=[];ui.message="";renderQuestion();
  });
  $("#resetClozeBtn")?.addEventListener("click",()=>{
    state.clozeUi[q.id]={values:{},wrong:[],hint:false,revealed:false,message:"",completed:false};
    renderQuestion();
  });
}
function checkCloze(q){
  const ui=getClozeUi(q.id);
  if(ui.revealed) return;
  ui.values=collectClozeValues(q);
  const wrong=[];
  for(const item of q.cloze?.items||[]){
    if(!isAccepted(ui.values[item.id],item.accepted)) wrong.push(item.id);
  }
  const previous=getProgress()[q.id] || {};
  if(wrong.length){
    ui.wrong=wrong;ui.completed=false;ui.message=`还有 ${wrong.length} 个空不正确。`;
    updateProgress(q.id,{buildCorrect:true,clozeAttempts:(previous.clozeAttempts||0)+1,lastClozeCorrect:false});
    renderQuestion();return;
  }
  ui.wrong=[];ui.completed=true;ui.message="";
  updateProgress(q.id,{
    buildCorrect:true,clozeCorrect:true,done:true,
    clozeAttempts:(previous.clozeAttempts||0)+1,lastClozeCorrect:true
  });
  renderProgress();renderList();renderQuestion();
}

function renderFree(root,q){
  const templates=(q.suggestedTemplateIds||[]).map(id=>templateById(DATA.templates,id)).filter(Boolean);
  const vocab=(q.suggestedVocabIds||[]).map(id=>vocabById(DATA.themes,id)).filter(Boolean);
  const records=getRecords()[q.id] || [];
  const last=getProgress()[q.id]?.lastAnswer || "";
  root.innerHTML=headerHtml(q)+`
    <div class="block"><div class="block-title"><h3>句型模板</h3></div><div class="toolbox">
      ${templates.map(item=>`<button class="token structure insert-item" data-insert="${esc(item.text)}">${esc(item.functionName)}：${esc(item.text)}</button>`).join("")}
    </div></div>
    <div class="block"><div class="block-title"><h3>主题词组</h3></div><div class="toolbox">
      ${vocab.map(item=>`<button class="token concept insert-item" data-insert="${esc(item.en)}">${esc(item.en)} · ${esc(item.zh)}</button>`).join("")}
    </div></div>
    <div class="block"><div class="block-title"><h3>你的回答</h3></div>
      <textarea id="freeAnswer" placeholder="在这里组织英文回答。">${esc(last)}</textarea>
    </div>
    <div class="actions compact">
      <button class="btn primary" id="saveFreeBtn">保存回答</button>
      <button class="btn" id="copyReviewBtn">复制 AI 评判提示词</button>
      <button class="btn" id="sampleFreeBtn">示范答案</button>
    </div><div id="freeFeedback"></div><div class="records" id="recordRoot">${recordsHtml(records)}</div>`;
  bindManualStatus(q);
  const textarea=$("#freeAnswer");
  $$(".insert-item").forEach(button=>button.addEventListener("click",()=>insertAtCursor(textarea,button.dataset.insert)));
  $("#saveFreeBtn").addEventListener("click",()=>{
    const answer=normalText(textarea.value);
    if(!answer){$("#freeFeedback").innerHTML=`<div class="feedback error">请先填写回答。</div>`;return;}
    const updated=saveFreeRecord(q.id,answer);
    $("#freeFeedback").innerHTML=`<div class="feedback success">回答已保存。</div>`;
    $("#recordRoot").innerHTML=recordsHtml(updated);
    renderProgress();renderList();
  });
  $("#copyReviewBtn").addEventListener("click",()=>{
    const answer=normalText(textarea.value);
    if(!answer){$("#freeFeedback").innerHTML=`<div class="feedback error">请先填写回答。</div>`;return;}
    const template=(DATA.prompts.prompts||[]).find(p=>p.id==="ai-review")?.text || "";
    copyText(template.replace("{{question}}",q.promptZh).replace("{{answer}}",answer),"AI 评判提示词已复制");
  });
  $("#sampleFreeBtn").addEventListener("click",()=>{
    $("#freeFeedback").innerHTML=`<div class="feedback info">${esc(q.sampleAnswer)}</div>`;
  });
}
function insertAtCursor(textarea,text){
  const start=textarea.selectionStart ?? textarea.value.length;
  const end=textarea.selectionEnd ?? textarea.value.length;
  const before=textarea.value.slice(0,start),after=textarea.value.slice(end);
  const left=before && !/\s$/.test(before)?" ":"";
  const right=after && !/^\s|[.,!?;:]/.test(after)?" ":"";
  const insertion=left+text+right;
  textarea.value=before+insertion+after;
  textarea.focus();
  textarea.setSelectionRange(start+insertion.length,start+insertion.length);
}
function recordsHtml(records){
  if(!records.length) return `<div class="inline-note">暂无历史回答。</div>`;
  return `<h3>历史回答</h3>`+records.map(item=>`<div class="record"><small>${formatDate(item.createdAt)}</small><p>${esc(item.answer)}</p></div>`).join("");
}

let APP;
const state={theme:"all",type:"all",func:"all",mode:"all",orderMode:"order",pool:[],index:0,selected:[],tokenOrders:{}};

document.addEventListener("DOMContentLoaded",async()=>{
  APP=await loadAll();initFilters();applyUrl();refreshPool();renderAll();bindControls();
});

function initFilters(){
  $("#themeSelect").innerHTML=`<option value="all">全部主题</option>`+(APP.themes.themes||[]).map(t=>`<option value="${t.id}">${t.icon||""} ${esc(t.name)}</option>`).join("");
  $("#functionFilter").innerHTML=`<option value="all">全部表达类型</option>`+(APP.taxonomy.primaryFunctions||[]).map(f=>`<option value="${f.id}">${esc(f.shortName||f.name)}</option>`).join("");
}
function applyUrl(){
  const p=new URLSearchParams(location.search),theme=p.get("theme"),func=p.get("function");
  if(theme&&themeById(APP.themes,theme)){state.theme=theme;$("#themeSelect").value=theme}
  if(func&&functionById(APP.taxonomy,func)){state.func=func;$("#functionFilter").value=func}
}
function bindControls(){
  $("#themeSelect").onchange=e=>{state.theme=e.target.value;state.index=0;refreshPool();renderAll()};
  $("#typeFilter").onchange=e=>{state.type=e.target.value;state.index=0;refreshPool();renderAll()};
  $("#functionFilter").onchange=e=>{state.func=e.target.value;state.index=0;refreshPool();renderAll()};
  $("#modeFilter").onchange=e=>{state.mode=e.target.value;state.index=0;refreshPool();renderAll()};
  $$(".segmented button").forEach(b=>b.onclick=()=>{
    $$(".segmented button").forEach(x=>x.classList.remove("active"));b.classList.add("active");state.orderMode=b.dataset.mode;
    if(state.orderMode==="random")randomQuestion();else renderAll();
  });
  $("#prevBtn").onclick=()=>move(-1);$("#nextBtn").onclick=()=>move(1);$("#randomBtn").onclick=randomQuestion;
  $("#toggleList").onclick=()=>$("#questionListPanel").classList.toggle("open");
}
function refreshPool(keepId=null){
  let q=APP.questions.questions||[];
  if(state.theme!=="all")q=q.filter(x=>x.themeId===state.theme);
  if(state.type!=="all")q=q.filter(x=>x.type===state.type);
  if(state.func!=="all")q=q.filter(x=>x.primaryFunction===state.func);
  if(state.mode!=="all")q=q.filter(x=>x.mode===state.mode||(state.mode!=="both"&&x.mode==="both"));
  state.pool=q;
  if(keepId){const i=q.findIndex(x=>x.id===keepId);state.index=i>=0?i:0}else state.index=Math.min(state.index,Math.max(0,q.length-1));
  state.selected=[];
}
function current(){return state.pool[state.index]||null}
function move(delta){if(!state.pool.length)return;state.index=(state.index+delta+state.pool.length)%state.pool.length;state.selected=[];renderAll()}
function randomQuestion(){if(!state.pool.length)return;const old=state.index;if(state.pool.length>1){do{state.index=Math.floor(Math.random()*state.pool.length)}while(state.index===old)}state.selected=[];renderAll()}
function renderAll(){renderProgress();renderList();renderQuestion()}
function renderProgress(){
  const p=getProgress(),done=state.pool.filter(q=>p[q.id]?.done).length,total=state.pool.length,per=total?Math.round(done/total*100):0;
  $("#progressText").textContent=`${done}/${total}`;$("#progressBar").style.width=per+"%";$("#listCount").textContent=total;
}
function renderList(){
  const p=getProgress(),root=$("#questionList");
  root.innerHTML=state.pool.map((q,i)=>`<button class="q-list-item ${i===state.index?"active":""}" data-index="${i}"><span class="done-dot">${p[q.id]?.done?"●":"○"}</span><b>${esc(q.title||q.subFunction||"练习题")}</b><small>${q.type==="build"?"拼句":"自由"} · ${esc(q.level||"")}</small></button>`).join("")||`<div class="muted">当前筛选没有题目。</div>`;
  $$(".q-list-item",root).forEach(b=>b.onclick=()=>{state.index=Number(b.dataset.index);state.selected=[];renderAll();if(innerWidth<900)$("#questionListPanel").classList.remove("open")});
}
function headHtml(q){
  const theme=themeById(APP.themes,q.themeId),func=functionById(APP.taxonomy,q.primaryFunction),d=isDone(q.id);
  return`<div class="question-head"><div><div class="chip-row"><span class="chip">${theme?.icon||"📘"} ${esc(theme?.name||q.themeId)}</span><span class="chip neutral">${q.type==="build"?"拼句题":"自由表达"}</span><span class="chip neutral">${esc(func?.shortName||q.primaryFunction||"")}</span><span class="chip neutral">${q.mode==="speaking"?"口语":q.mode==="writing"?"写作":"通用"}</span>${d?`<span class="chip success">已做</span>`:""}</div><h1>${esc(q.title||q.subFunction||"练习题")}</h1></div><button id="toggleDone" class="btn small ${d?"danger":"success"}">${d?"标记未做":"标记已做"}</button></div><div class="prompt-box">${esc(q.promptZh)}</div>`;
}
function bindDone(q){
  $("#toggleDone").onclick=()=>{updateProgress(q.id,{done:!isDone(q.id)});renderAll()};
}
function renderQuestion(){
  const root=$("#questionRoot"),q=current();
  if(!q){root.innerHTML=`<div class="muted">请选择其他筛选条件。</div>`;return}
  q.type==="build"?renderBuild(q):renderFree(q);
}
function getOrder(q){
  if(!state.tokenOrders[q.id])state.tokenOrders[q.id]=shuffled(q.tokens,q.id+"-session-"+Date.now());
  return state.tokenOrders[q.id];
}
function renderBuild(q){
  const selectedSet=new Set(state.selected),tokenBy=Object.fromEntries(q.tokens.map(t=>[t.id,t])),selected=state.selected.map(id=>tokenBy[id]).filter(Boolean),order=getOrder(q);
  $("#questionRoot").innerHTML=headHtml(q)+`
    <div class="legend"><span><i class="s"></i> 结构语块</span><span><i class="c"></i> 内容语块</span></div>
    <h3 class="section-title">选项</h3>
    <div id="tokenBank" class="token-bank">${order.map(t=>`<button draggable="true" class="token ${t.kind} ${selectedSet.has(t.id)?"used":""}" data-token="${t.id}">${esc(t.text)}</button>`).join("")}</div>
    <h3 class="section-title">答案</h3>
    <div id="answerZone" class="answer-zone ${selected.length?"":"empty"}">${selected.map(t=>`<button class="token ${t.kind}" data-remove="${t.id}">${esc(t.text)} ×</button>`).join("")}</div>
    <div class="sentence-preview"><strong>当前：</strong> ${esc(normalize(selected.map(t=>t.text).join(" ")))}</div>
    <div class="actions"><button id="checkAnswer" class="btn primary">检查</button><button id="clearAnswer" class="btn">清空</button><button id="showSample" class="btn">示范</button></div>
    <div id="feedback"></div>`;
  bindDone(q);
  $$("[data-token]").forEach(b=>{b.onclick=()=>addToken(q,b.dataset.token);b.ondragstart=e=>e.dataTransfer.setData("text/plain",b.dataset.token)});
  $$("[data-remove]").forEach(b=>b.onclick=()=>removeToken(b.dataset.remove));
  const zone=$("#answerZone");zone.ondragover=e=>e.preventDefault();zone.ondrop=e=>{e.preventDefault();addToken(q,e.dataTransfer.getData("text/plain"))};
  $("#clearAnswer").onclick=()=>{state.selected=[];renderQuestion()};
  $("#showSample").onclick=()=>$("#feedback").innerHTML=`<div class="feedback info"><strong>示范答案</strong><br>${q.sampleAnswers.map(esc).join("<br>")}<br><small>${esc(q.explanation||"")}</small></div>`;
  $("#checkAnswer").onclick=()=>checkBuild(q);
}
function addToken(q,id){if(!q.tokens.some(t=>t.id===id)||state.selected.includes(id))return;state.selected.push(id);renderQuestion()}
function removeToken(id){state.selected=state.selected.filter(x=>x!==id);renderQuestion()}
function checkBuild(q){
  const key=state.selected.join("|"),ok=(q.acceptableAnswers||[]).some(a=>a.join("|")===key),p=getProgress(),attempts=(p[q.id]?.attempts||0)+1;
  if(ok){updateProgress(q.id,{done:true,lastCorrect:true,attempts});$("#feedback").innerHTML=`<div class="feedback success"><strong>正确</strong><br>${esc(q.explanation||"")}</div>`;renderProgress();renderList()}
  else{updateProgress(q.id,{lastCorrect:false,attempts});$("#feedback").innerHTML=`<div class="feedback error"><strong>顺序还不正确</strong><br>可以调整语块，或查看示范答案。</div>`}
}
function insertAtCursor(ta,text){
  const s=ta.selectionStart??ta.value.length,e=ta.selectionEnd??ta.value.length,b=ta.value.slice(0,s),a=ta.value.slice(e),left=b&&!/\s$/.test(b)?" ":"",right=a&&!/^\s|[.,?!;:]/.test(a)?" ":"",ins=left+text+right;
  ta.value=b+ins+a;const pos=s+ins.length;ta.focus();ta.setSelectionRange(pos,pos);
}
function recordsHtml(records){
  if(!records.length)return`<p class="muted small-text">暂无历史回答。</p>`;
  return`<h3 class="section-title">历史回答</h3>`+records.map(r=>`<div class="record"><small>${fmtDate(r.createdAt)}</small><p>${esc(r.answer)}</p></div>`).join("");
}
function renderFree(q){
  const ts=(q.suggestedTemplateIds||[]).map(id=>templateById(APP.templates,id)).filter(Boolean),vs=(q.suggestedVocabIds||[]).map(id=>vocabById(APP.themes,id)).filter(Boolean),records=getRecords()[q.id]||[],last=getProgress()[q.id]?.lastAnswer||"";
  $("#questionRoot").innerHTML=headHtml(q)+`
    <h3 class="section-title">可用句型</h3><div class="toolbox">${ts.map(t=>`<button class="token structure insert" data-insert="${esc(t.text)}">${esc(t.text)}</button>`).join("")}</div>
    <h3 class="section-title">主题词汇</h3><div class="toolbox">${vs.map(v=>`<button class="token concept insert" data-insert="${esc(v.en)}">${esc(v.en)}</button>`).join("")}</div>
    <h3 class="section-title">回答</h3><textarea id="freeAnswer" class="free-answer" placeholder="在这里组织英文回答">${esc(last)}</textarea>
    <div class="actions"><button id="saveFree" class="btn primary">保存</button><button id="copyReview" class="btn">复制 AI 评判提示词</button><button id="showFreeSample" class="btn">示范</button></div>
    <div id="feedback"></div><div id="records">${recordsHtml(records)}</div>`;
  bindDone(q);const ta=$("#freeAnswer");
  $$(".insert").forEach(b=>b.onclick=()=>insertAtCursor(ta,b.dataset.insert));
  $("#saveFree").onclick=()=>{const ans=normalize(ta.value);if(!ans){$("#feedback").innerHTML=`<div class="feedback error">请先写下回答。</div>`;return}const rec=saveRecord(q.id,ans);$("#feedback").innerHTML=`<div class="feedback success">已保存。</div>`;$("#records").innerHTML=recordsHtml(rec);renderProgress();renderList()};
  $("#copyReview").onclick=()=>{const ans=normalize(ta.value);if(!ans){$("#feedback").innerHTML=`<div class="feedback error">请先写下回答。</div>`;return}const tpl=(APP.prompts.prompts||[]).find(p=>p.id==="ai-review")?.text||"";copyText(tpl.replace("{{question}}",q.promptZh).replace("{{answer}}",ans),"评判提示词已复制")};
  $("#showFreeSample").onclick=()=>$("#feedback").innerHTML=`<div class="feedback info"><strong>示范答案</strong><br>${esc(q.sampleAnswer)}<br><br><strong>检查要点</strong><br>${(q.rubric||[]).map(x=>"· "+esc(x)).join("<br>")}</div>`;
}

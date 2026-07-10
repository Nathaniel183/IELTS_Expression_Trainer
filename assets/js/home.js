let HOME;
document.addEventListener("DOMContentLoaded",async()=>{
  HOME=await loadAll();renderStats();renderThemes();renderFunctions();renderPrompts();bindHome();
});
function renderStats(){
  const qs=HOME.questions.questions||[],p=getProgress(),r=getRecords();
  const done=qs.filter(q=>p[q.id]?.done).length,build=qs.filter(q=>q.type==="build").length,free=qs.filter(q=>q.type==="free").length;
  $("#stats").innerHTML=`<div class="stat"><b>${build}</b><span>拼句题</span></div><div class="stat"><b>${free}</b><span>自由表达</span></div><div class="stat"><b>${done}</b><span>已完成</span></div>`;
  const per=qs.length?Math.round(done/qs.length*100):0;$("#overallProgressText").textContent=per+"%";$("#overallProgressBar").style.width=per+"%";
}
function renderThemes(){
  const root=$("#themeCards"),qs=HOME.questions.questions||[],p=getProgress();
  root.innerHTML=(HOME.themes.themes||[]).map(t=>{
    const arr=qs.filter(q=>q.themeId===t.id),d=arr.filter(q=>p[q.id]?.done).length,per=arr.length?Math.round(d/arr.length*100):0;
    const chips=(t.coreVocab||[]).slice(0,3).map(v=>`<span class="chip neutral">${esc(v.en)}</span>`).join("");
    return`<a class="card theme-card" href="practice.html?theme=${encodeURIComponent(t.id)}"><div class="theme-icon">${t.icon||"📘"}</div><div><h3>${esc(t.name)}</h3><p class="muted">${esc(t.description)}</p></div><div class="chip-row">${chips}</div><div class="progress-line"><span>${d}/${arr.length}</span><strong>${per}%</strong></div><div class="progress-track"><i style="width:${per}%"></i></div></a>`;
  }).join("");
}
function renderFunctions(){
  const qs=HOME.questions.questions||[];
  $("#functionCards").innerHTML=(HOME.taxonomy.primaryFunctions||[]).map(f=>{
    const count=qs.filter(q=>q.primaryFunction===f.id).length;
    return`<a class="function-card" href="practice.html?function=${encodeURIComponent(f.id)}"><b>${esc(f.shortName||f.name)}</b><span>${count} 题</span></a>`;
  }).join("");
}
function renderPrompts(){
  const list=(HOME.prompts.prompts||[]).filter(p=>p.id!=="ai-review");
  $("#promptCards").innerHTML=list.map(p=>`<div class="prompt-item"><span>${esc(p.title)}</span><button class="btn small copy-prompt" data-id="${p.id}">复制</button></div>`).join("");
  $$(".copy-prompt").forEach(btn=>btn.onclick=()=>{const p=list.find(x=>x.id===btn.dataset.id);copyText(p.text,"提示词已复制")});
}
function bindHome(){
  $("#exportProgress").onclick=()=>downloadText("ielts-expression-progress.json",JSON.stringify({exportedAt:new Date().toISOString(),progress:getProgress(),records:getRecords()},null,2));
  let pending=false,timer=null;
  $("#resetProgress").onclick=()=>{
    if(!pending){pending=true;$("#resetProgress").textContent="再次点击确认";toast("再次点击即可清空");clearTimeout(timer);timer=setTimeout(()=>{pending=false;$("#resetProgress").textContent="清空进度"},5000);return}
    clearProgress();pending=false;$("#resetProgress").textContent="清空进度";renderStats();renderThemes();toast("进度已清空");
  };
}

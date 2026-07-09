let D;
document.addEventListener("DOMContentLoaded",async()=>{D=await loadAll();renderStats();renderThemes();renderPrompts();bindHome()});
function renderStats(){const qs=D.questions.questions||[],p=getProgress(),r=getRecords();const d=qs.filter(q=>p[q.id]?.done).length;const rc=Object.values(r).reduce((s,a)=>s+a.length,0);$("#stats").innerHTML=`<div class=stat><b>${qs.length}</b><span>总题数</span></div><div class=stat><b>${d}</b><span>已完成</span></div><div class=stat><b>${rc}</b><span>表达记录</span></div>`}
function renderThemes(){const qs=D.questions.questions||[],p=getProgress();$("#themeCards").innerHTML=(D.themes.themes||[]).map(t=>{const arr=qs.filter(q=>q.themeId===t.id),d=arr.filter(q=>p[q.id]?.done).length,per=arr.length?Math.round(d/arr.length*100):0;return`<a class="card" href="practice.html?theme=${t.id}"><div class=theme-icon>${t.icon||"📘"}</div><h3>${esc(t.name)}</h3><p class=muted>${esc(t.description)}</p><p>${(t.coreVocab||[]).slice(0,4).map(v=>`<span class=chip>${esc(v.en)}</span>`).join("")}</p><div class=progress><span>${d}/${arr.length} 已完成 · ${per}%</span><div><i style="width:${per}%"></i></div></div></a>`}).join("")}
function renderPrompts(){const ps=(D.prompts.prompts||[]).filter(p=>p.id!=="ai-review");$("#promptCards").innerHTML=ps.map(p=>`<div class="panel"><h3>${esc(p.title)}</h3><p class=muted>${esc(p.description)}</p><button class="btn small cp" data-id="${p.id}">${esc(p.buttonText)}</button></div>`).join("");$$(".cp").forEach(b=>b.onclick=()=>{const p=ps.find(x=>x.id===b.dataset.id);copyText(p.text,"提示词已复制")})}
function bindHome(){
  $("#exportProgress").onclick=()=>download("ielts-progress.json",JSON.stringify({exportedAt:new Date().toISOString(),progress:getProgress(),records:getRecords()},null,2));
  let pendingReset=false, timer=null;
  $("#resetProgress").onclick=()=>{
    if(!pendingReset){
      pendingReset=true;
      $("#resetProgress").textContent="再次点击确认清空";
      toast("为了避免误删，请再次点击清空进度");
      clearTimeout(timer);
      timer=setTimeout(()=>{pendingReset=false;$("#resetProgress").textContent="清空进度"},5000);
      return;
    }
    localStorage.removeItem(STORE.progress);
    localStorage.removeItem(STORE.records);
    pendingReset=false;
    $("#resetProgress").textContent="清空进度";
    toast("已清空本机进度");
    renderStats();
    renderThemes();
  };
}


let HOME_DATA;

document.addEventListener("DOMContentLoaded", async () => {
  HOME_DATA = await loadAllData();
  renderStats();
  renderThemes();
  renderPrompts();
  bindHomeActions();
});

function renderStats(){
  const questions = HOME_DATA.questions.questions || [];
  const progress = getProgress();
  const build = questions.filter(q=>q.type==="build");
  const free = questions.filter(q=>q.type==="free");
  const mastered = build.filter(q=>questionStatus(q,progress)==="mastered").length;
  const assembled = build.filter(q=>questionStatus(q,progress)==="assembled").length;
  const freeDone = free.filter(q=>questionStatus(q,progress)==="mastered").length;
  $("#statGrid").innerHTML = `
    <div class="stat"><b>${build.length}</b><span>拼句题</span></div>
    <div class="stat"><b>${mastered}</b><span>填空已掌握</span></div>
    <div class="stat"><b>${assembled}</b><span>待完成填空</span></div>
    <div class="stat"><b>${freeDone}</b><span>自由表达已做</span></div>`;
}

function renderThemes(){
  const questions = HOME_DATA.questions.questions || [];
  const progress = getProgress();
  $("#themeCards").innerHTML = (HOME_DATA.themes.themes || []).map(theme=>{
    const items = questions.filter(q=>q.themeId===theme.id);
    const mastered = items.filter(q=>questionStatus(q,progress)==="mastered").length;
    const assembled = items.filter(q=>questionStatus(q,progress)==="assembled").length;
    const percent = items.length ? Math.round(mastered/items.length*100) : 0;
    return `<a class="card theme-card" href="practice.html?theme=${encodeURIComponent(theme.id)}">
      <div class="theme-icon">${theme.icon || "📘"}</div>
      <div><h3>${esc(theme.name)}</h3><p class="muted">${esc(theme.description)}</p></div>
      <div class="chip-row">${(theme.coreVocab||[]).slice(0,4).map(v=>`<span class="chip">${esc(v.en)}</span>`).join("")}</div>
      <div class="q-meta">${mastered}/${items.length} 已掌握 · ${assembled} 待填空</div>
      <div class="progress-track"><i style="width:${percent}%"></i></div>
    </a>`;
  }).join("");
}

function renderPrompts(){
  const prompts = (HOME_DATA.prompts.prompts || []).filter(p=>p.id!=="ai-review");
  $("#promptCards").innerHTML = prompts.map(p=>`<div class="panel">
    <h3>${esc(p.title)}</h3><p class="muted">${esc(p.description)}</p>
    <button class="btn small copy-prompt" data-id="${p.id}">${esc(p.buttonText)}</button>
  </div>`).join("");
  $$(".copy-prompt").forEach(button=>{
    button.addEventListener("click",()=>{
      const item = prompts.find(p=>p.id===button.dataset.id);
      if(item) copyText(item.text,"提示词已复制");
    });
  });
}

function bindHomeActions(){
  $("#exportBtn").addEventListener("click",()=>{
    downloadText("ielts-expression-progress.json",JSON.stringify({
      exportedAt:new Date().toISOString(),
      progress:getProgress(),
      records:getRecords()
    },null,2));
  });
  let waiting=false;
  let timer=null;
  $("#resetBtn").addEventListener("click",()=>{
    const note=$("#resetNote");
    if(!waiting){
      waiting=true;
      note.classList.remove("hidden");
      note.textContent="再次点击“清空进度”确认。";
      clearTimeout(timer);
      timer=setTimeout(()=>{waiting=false;note.classList.add("hidden");},5000);
      return;
    }
    localStorage.removeItem(STORE_KEYS.progress);
    localStorage.removeItem(STORE_KEYS.records);
    waiting=false;
    note.classList.add("hidden");
    renderStats();
    renderThemes();
    showToast("进度已清空");
  });
}

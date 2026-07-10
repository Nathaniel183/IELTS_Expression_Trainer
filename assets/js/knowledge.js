
let fullKnowledge = "";
document.addEventListener("DOMContentLoaded", async ()=>{
  fullKnowledge = await loadText("knowledge");
  $("#knowledgeText").textContent = fullKnowledge || "未能加载知识库。";
  $("#searchInput").addEventListener("input",event=>{
    const query = normalText(event.target.value).toLowerCase();
    if(!query){$("#knowledgeText").textContent=fullKnowledge;return;}
    const lines = fullKnowledge.split(/\r?\n/).filter(line=>line.toLowerCase().includes(query));
    $("#knowledgeText").textContent = lines.length ? lines.join("\n") : "没有找到匹配内容。";
  });
  $("#copyBtn").addEventListener("click",()=>copyText($("#knowledgeText").textContent,"当前内容已复制"));
});

let FULL_TEXT="";
document.addEventListener("DOMContentLoaded",async()=>{
  FULL_TEXT=await loadText("knowledge");$("#knowledgeText").textContent=FULL_TEXT||"未能加载知识库。";
  $("#searchInput").oninput=e=>{
    const q=normalize(e.target.value).toLowerCase();
    if(!q){$("#knowledgeText").textContent=FULL_TEXT;return}
    const lines=FULL_TEXT.split(/\r?\n/),matched=[];
    lines.forEach((line,i)=>{if(line.toLowerCase().includes(q)){if(i>0)matched.push(lines[i-1]);matched.push(line);if(i<lines.length-1)matched.push(lines[i+1]);matched.push("")}});
    $("#knowledgeText").textContent=matched.length?[...new Set(matched)].join("\n"):"没有找到匹配内容。";
  };
  $("#copyVisible").onclick=()=>copyText($("#knowledgeText").textContent,"当前内容已复制");
});

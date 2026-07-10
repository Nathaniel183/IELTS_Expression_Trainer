from pathlib import Path
import json, re, collections, sys

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"

def load(name):
    return json.loads((DATA/name).read_text(encoding="utf-8"))

taxonomy=load("taxonomy.txt")
templates=load("templates.txt")
themes=load("themes.txt")
questions=load("questions.txt")
prompts=load("prompts.txt")

theme_ids={x["id"] for x in themes["themes"]}
function_ids={x["id"] for x in taxonomy["primaryFunctions"]}
template_ids=set()
for group in templates["templateGroups"]:
    for t in group["templates"]:
        if t["id"] in template_ids: raise ValueError("重复模板ID: "+t["id"])
        template_ids.add(t["id"])
vocab_ids=set()
for theme in themes["themes"]:
    for v in theme["coreVocab"]:
        if v["id"] in vocab_ids: raise ValueError("重复词汇ID: "+v["id"])
        vocab_ids.add(v["id"])

question_ids=set()
counts=collections.Counter()
for q in questions["questions"]:
    if q["id"] in question_ids: raise ValueError("重复题目ID: "+q["id"])
    question_ids.add(q["id"])
    if q["themeId"] not in theme_ids: raise ValueError("不存在主题: "+q["id"])
    if q.get("primaryFunction") not in function_ids: raise ValueError("不存在表达类型: "+q["id"])
    counts[q["type"]]+=1
    if q["type"]=="build":
        ids={t["id"] for t in q["tokens"]}
        for t in q["tokens"]:
            if t["kind"] not in {"structure","concept"}:
                raise ValueError("非法 token kind: "+q["id"])
            words=len(re.sub(r"[.,?!;:]","",t["text"]).split())
            if words>5:
                raise ValueError(f"token 超过5词: {q['id']} -> {t['text']}")
        for ans in q["acceptableAnswers"]:
            if not ans: raise ValueError("空答案: "+q["id"])
            if any(x not in ids for x in ans): raise ValueError("答案引用不存在 token: "+q["id"])
    else:
        for tid in q.get("suggestedTemplateIds",[]):
            if tid not in template_ids: raise ValueError("模板引用不存在: "+q["id"]+" -> "+tid)
        for vid in q.get("suggestedVocabIds",[]):
            if vid not in vocab_ids: raise ValueError("词汇引用不存在: "+q["id"]+" -> "+vid)

print("VALID")
print("themes:",len(theme_ids))
print("functions:",len(function_ids))
print("templates:",len(template_ids))
print("questions:",len(question_ids))
print("build:",counts["build"])
print("free:",counts["free"])

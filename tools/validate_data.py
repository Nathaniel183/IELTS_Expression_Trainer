from pathlib import Path
import json,re,sys

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"

def load(name):
    return json.loads((DATA/name).read_text(encoding="utf-8"))

taxonomy=load("taxonomy.txt")
templates=load("templates.txt")
themes=load("themes.txt")
questions=load("questions.txt")
prompts=load("prompts.txt")

errors=[]
theme_ids={t["id"] for t in themes["themes"]}
template_ids={t["id"] for g in templates["templateGroups"] for t in g["templates"]}
vocab_ids={v["id"] for theme in themes["themes"] for v in theme["coreVocab"]}
question_ids=set()
build_count=free_count=0
blank_counts=[]
token_lengths=[]

for q in questions["questions"]:
    if q["id"] in question_ids: errors.append(f"duplicate question id: {q['id']}")
    question_ids.add(q["id"])
    if q["themeId"] not in theme_ids: errors.append(f"unknown theme: {q['id']}")
    if q["type"]=="build":
        build_count+=1
        token_ids={t["id"] for t in q["tokens"]}
        for token in q["tokens"]:
            if token["kind"] not in {"structure","concept"}:
                errors.append(f"invalid token kind: {q['id']} {token['kind']}")
            words=len(re.findall(r"[A-Za-z0-9'-]+",token["text"]))
            token_lengths.append(words)
            if words>5: errors.append(f"token too long: {q['id']} -> {token['text']}")
        for answer in q["acceptableAnswers"]:
            if any(item not in token_ids for item in answer):
                errors.append(f"answer references missing token: {q['id']}")
        cloze=q.get("cloze")
        if not cloze: errors.append(f"missing cloze: {q['id']}"); continue
        items={item["id"]:item for item in cloze.get("items",[])}
        blank_counts.append(len(items))
        if not 1<=len(items)<=3: errors.append(f"invalid blank count: {q['id']} {len(items)}")
        for part in cloze.get("parts",[]):
            if part["type"]=="blank" and part["id"] not in items:
                errors.append(f"unknown blank id: {q['id']} {part['id']}")
        sentence=q["sampleAnswers"][0].lower()
        for item in items.values():
            if item["answer"].lower() not in sentence:
                errors.append(f"cloze answer missing from sentence: {q['id']} {item['answer']}")
            if not item.get("accepted"):
                errors.append(f"empty accepted list: {q['id']} {item['id']}")
            if item["kind"] not in {"structure","concept"}:
                errors.append(f"invalid cloze kind: {q['id']} {item['kind']}")
            if item.get("wordCount",0)>8:
                errors.append(f"cloze phrase too long: {q['id']} {item['answer']}")
    elif q["type"]=="free":
        free_count+=1
        for tid in q.get("suggestedTemplateIds",[]):
            if tid not in template_ids: errors.append(f"unknown template: {q['id']} {tid}")
        for vid in q.get("suggestedVocabIds",[]):
            if vid not in vocab_ids: errors.append(f"unknown vocab: {q['id']} {vid}")
    else:
        errors.append(f"unknown type: {q['id']}")

report={
    "themes":len(theme_ids),
    "templateGroups":len(templates["templateGroups"]),
    "templates":len(template_ids),
    "questions":len(question_ids),
    "buildQuestions":build_count,
    "freeQuestions":free_count,
    "clozeBlankDistribution":{str(i):blank_counts.count(i) for i in sorted(set(blank_counts))},
    "maxTokenWords":max(token_lengths or [0]),
    "errors":len(errors)
}
print(json.dumps(report,ensure_ascii=False,indent=2))
if errors:
    print("\n".join(errors[:100]))
    sys.exit(1)

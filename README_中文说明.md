# IELTS Expression Trainer 中文说明

## 1. 项目定位

这是一个本地运行的雅思口语与写作表达训练项目。

新版拼句题使用两阶段训练：

```text
中文题干 → 拼句选择 → 核心表达打字填空 → 已掌握
```

拼句正确只表示已经识别句型和语序；核心填空也正确后，题目才计为已掌握。

## 2. 运行方式

Windows 可以双击：

```text
启动本地服务器.bat
```

也可以在项目目录运行：

```bash
python start_server.py
```

然后打开：

```text
http://localhost:8000
```

直接双击 `index.html` 也能使用内置备用数据，但修改 `data/*.txt` 后建议使用本地服务器。

## 3. 项目结构

```text
IELTS_Expression_Trainer/
├── index.html
├── practice.html
├── knowledge.html
├── start_server.py
├── 启动本地服务器.bat
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── common.js
│       ├── home.js
│       ├── practice.js
│       ├── knowledge.js
│       └── fallback-data.js
├── data/
│   ├── taxonomy.txt
│   ├── templates.txt
│   ├── themes.txt
│   ├── questions.txt
│   ├── prompts.txt
│   └── knowledge_base.txt
├── docs/
└── tools/
```

## 4. 拼句与填空状态

- `○ 未做`：尚未完成拼句。
- `◐ 待填空`：拼句正确，但核心表达填空未完成。
- `✓ 已掌握`：填空也已正确完成。

显示答案后，需要点击“清空后重试”，再独立输入正确，才能计为已掌握。

## 5. 填空数据结构

每道 build 题包含：

```json
"cloze": {
  "parts": [
    {"type":"text","text":"In my view, "},
    {"type":"blank","id":"b1"},
    {"type":"text","text":"."}
  ],
  "items": [
    {
      "id":"b1",
      "answer":"public transport should be prioritised",
      "accepted":["public transport should be prioritised"],
      "zh":"应优先发展公共交通",
      "kind":"concept",
      "wordCount":5
    }
  ]
}
```

`parts` 决定填空在句子中的位置；`items` 提供答案、中文提示和可接受形式。

## 6. 当前题库

- 主题：12 个
- 拼句题：660 道
- 自由表达题：144 道
- 总题数：804 道

## 7. 进度保存

进度保存在浏览器 localStorage，不会上传。

主页支持导出进度。清除浏览器数据会删除本地进度。

# IELTS Expression Trainer

一个不依赖后端的本地英语表达训练网站，面向雅思口语、写作和日常交际。

## 启动

推荐双击：

```text
启动本地服务器.bat
```

或在项目目录运行：

```bash
python start_server.py
```

浏览器会打开：

```text
http://localhost:8000
```

也可以直接打开 `index.html`。项目包含 `fallback-data.js`，但修改 `data/*.txt` 后应使用本地服务器，以读取最新数据。

## 页面

- `index.html`：主题、进度、提示词工具。
- `practice.html`：拼句题和自由表达题。
- `knowledge.html`：知识库浏览与搜索。

## 数据

- `data/taxonomy.txt`：十大表达类型和次级标签。
- `data/templates.txt`：口语与写作功能模板。
- `data/themes.txt`：十二个主题与核心词汇。
- `data/questions.txt`：660 道拼句题和 144 道自由表达题。
- `data/prompts.txt`：AI 提示词。
- `data/knowledge_base.txt`：项目知识库。

这些 `.txt` 文件内部均为 UTF-8 文本；除知识库外，其余为 JSON 格式。

## 拼句题规则

- 中文题干；
- 英文答案由单词和短语组成；
- 结构语块与概念语块使用不同颜色；
- 干扰项不使用特殊颜色；
- 选项每次显示时会打乱；
- 支持点击和拖拽；
- 可以提供多个正确顺序。

## 进度

做题记录和自由表达历史保存在浏览器 `localStorage` 中。主页可导出或清空进度。

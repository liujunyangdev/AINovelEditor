好的，我们现在进入 **可直接进入开发** 的阶段。

下面给你的是：

1. **Python AI 服务 API 设计表**（接口结构统一、可直接写 FastAPI）
2. **四大模块 Prompt 模板（可直接复制到代码里使用）**
3. Request / Response 示例，开发可直接对接 Electron

做到：**后端先可跑，前端直接调用，无需补脑。**

---

## ✅ **一、API 设计（Python FastAPI）**

服务统一监听本地端口，例如：

```
http://127.0.0.1:5050/
```

### **AI 模型接入层设计**

为兼容不同的AI模型，后端服务需要设计一个抽象层，使其能同时支持：
1.  **Ollama 本地模型**: 通过直接请求本地运行的 Ollama 服务来获取响应。
2.  **标准化 API 模型**: 通过 HTTP 请求支持标准 API 的商业或开源模型（如 OpenAI API、Gemini API 等）。

具体实现上，可以通过配置文件或在请求中指定 `provider` 字段来切换不同的模型源。

### **统一错误处理机制**

所有 API 在处理失败时，应返回统一的 JSON 错误结构，HTTP 状态码建议为 `400` (客户端错误) 或 `500` (服务端错误)。

**错误响应示例：**
```json
{
  "detail": {
    "code": "MODEL_GENERATION_FAILED",
    "message": "AI 模型生成内容失败，请检查模型连接或稍后重试。"
  }
}
```

### **1. 人物生成器 API**

**POST** `/character/generate`

| 字段              | 类型                | 描述             |
| --------------- | ----------------- | -------------- |
| theme           | string            | 小说世界/氛围/题材背景   |
| prompt_question | string            | 用户提出的人物设定问题或描述 |
| options         | object (optional) | 可选控制项，例如字数、语气等 |

**Request 示例：**

```json
{
  "theme": "奇幻 魔法王国",
  "prompt_question": "想要一个高冷但内心柔软的宫廷女术士",
  "options": { "detail_level": "high" }
}
```

**Response 示例：**

```json
{
  "name": "艾琳·维尔赫姆",
  "age": 24,
  "personality": "外冷内暖，情感表达克制...",
  "family_background": "生于宫廷侍卫贵族家庭...",
  "social_class": "王室直属术士阶层",
  "growth_experiences": "自幼天赋出众，因权力斗争见识到人性...",
  "education_and_culture": "皇家奥术学院，精通星象语言和仪式魔法",
  "profession_and_skills": "宫廷术士，擅长结界、精神系法术",
  "inner_conflict": "渴望温暖却害怕失去，爱情和权力之间摇摆..."
}
```

---

### **2. 故事梗概生成器 API**

**POST** `/story/outline`

| 字段         | 类型            | 描述                       |
| ---------- | ------------- | ------------------------ |
| characters | array<object> | 人物生成器的输出角色数组             |
| theme      | string        | 故事主题或世界观                 |
| style      | string        | 表达风格（轻松 / 严肃 / 中二 / 文学等） |

**Request 示例：**

```json
{
  "theme": "宫廷权谋 + 魔法",
  "style": "严肃现实主义幻想",
  "characters": [ ...人物生成器返回的 JSON... ]
}
```

**Response（关键输出）**：

```json
{
  "story_theme": "权力与信任之间的选择",
  "core_conflict": "主人公必须在守护恋人与追求权力间做选择",
  "character_relationships": "艾琳与王储互相依赖却彼此猜疑...",
  "world_setting": "魔法掌控政治秩序的王国，法师即权力",
  "plot_structure": [
    "开端：宫廷权力暗流涌动",
    "发展：主人公卷入争斗",
    "高潮：最重要的人变成威胁",
    "结局：选择与代价"
  ],
  "abstract_outline": "一段由信任到背叛、又重新理解爱的旅程..."
}
```

---

### **3. 章节规划器 API**

**POST** `/story/chapters`

| 字段            | 类型     |              |
| ------------- | ------ | ------------ |
| outline       | object | 故事梗概生成器返回的内容 |
| chapter_count | int    | 章节数量         |

**Response 示例：**

```json
{
  "chapters": [
    {
      "index": 1,
      "position": "铺垫",
      "dramatic_goal": "展示主人公的能力与孤独",
      "inner_conflict_display": "想亲近他人但保持防备",
      "summary": "艾琳在宫廷魔法典仪中施法，却目睹权谋代价..."
    },
    ...
  ]
}
```

---

### **4. 剧情扩写器 API (支持流式输出)**

**POST** `/story/expand`

此接口采用 **流式响应 (Streaming Response)**，以提供更实时的前端体验。

| 字段              | 类型     | 描述     |
| --------------- | ------ | ------ |
| chapter_summary | string | 本章概述   |
| characters      | array  | 人物设定   |
| style           | string | 语言表达风格 |

**Response (流式 `text/event-stream`)**：

客户端将接收一系列的 Server-Sent Events (SSE)。每个事件包含部分生成的文本。

**流式响应示例：**
```
data: {"chunk": "夜色深沉。"}

data: {"chunk": "宫墙高耸，"}

data: {"chunk": "烛光如溺星沉落……"}

...

data: {"status": "done"}
```

---

## 🎯 二、核心 Prompt 模板（可直接使用）

> 注意：你可以存为 `.txt` 文件、或写进 Python 中 string boilerplate，不要写死变量。

---

### **人物生成 Prompt**

```
你是一名小说人物设计专家。请根据用户输入，生成一个具有内在驱动力和成长痕迹的人物设定档案。

要求：
1. 所有性格必须由经历与环境推导，而非简单标签描述。
2. 重点展现人物的「内在矛盾」和「行动动机」。
3. 输出必须结构化、分段清晰、可直接用于小说创作。

用户描述：
{prompt_question}

小说背景/主题：
{theme}

输出格式（严格保持）：
姓名（如未指定可生成）
年龄
性格特征
家庭背景与社会阶层
成长经历与关键事件
教育与文化熏陶
职业与技能
内在矛盾（推动人物行动的情感与冲突核心）
```

---

### **故事梗概 Prompt**

```
你是一名故事结构工程师。请根据人物设定，从人物性格与关系的冲突中自然推导故事，而非凭空编造。

要求：
1. 情节必须由人物性格驱动。
2. 主题、矛盾、关系、剧情必须彼此呼应。
3. 整体逻辑必须连贯且具有“必然性”。

输入人物：
{characters_json}

输出结构：
主题：
核心矛盾：
人物关系网：
世界设定：
完整剧情主线：
```

---

### **章节规划 Prompt**

```
你将故事梗概拆分为章节结构。每章必须完成“角色变化 + 情节推进”二者之一或两者。

输入：
{outline}

章节数量：{chapter_count}

输出格式：
第 X 章
功能定位（铺垫/推进/冲突/转折/高潮/收束）
本章戏剧目标
人物内在冲突表现方式
简要概述（100~300 字）
```

---

### **剧情扩写 Prompt**

```
你现在是一名小说作者。根据章节概述生成完整正文。要求风格统一，人物行为符合动机，情感真实细腻，不要流水账。

输入：
章节概述：
{chapter_summary}

小说风格要求：
{style}

人物设定参考：
{characters_json}

输出：
章节正文（可直接作为小说）
```


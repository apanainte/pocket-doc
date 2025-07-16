# GPT‑4o‑mini & PDF Integration Guide

## Capability Overview
OpenAI’s vision‑capable models — **GPT‑4o, GPT‑4o‑mini, and o1** — can now ingest PDF files directly. The model extracts both text and visual features from each page, so you no longer need OCR or image conversion.

| Limit | Value |
|-------|-------|
| Max pages | ≈ 100 pages |
| Max total size | 32 MB across all `input_file`s in a request |
| Supported endpoints | `/v1/chat/completions` and `/v1/responses` |
| Supported file purpose | `user_data` (preferred). `assistants` also works but is intended for the Assistants API. |

## Workflow A – Files API + `file_id`

1. **Upload**  
   ```ts
   const file = await client.files.create({
     file: fs.createReadStream("my.pdf"),
     purpose: "user_data",   // REQUIRED
   });
   ```

2. **Chat**  
   ```ts
   const resp = await client.chat.completions.create({
     model: "gpt‑4o‑mini",
     messages: [
       {
         role: "user",
         content: [
           { type: "input_text", text: "Summarise the document" },
           { type: "input_file", file_id: file.id }
         ]
       }
     ]
   });
   console.log(resp.choices[0].message.content);
   ```

## Workflow B – Inline Base64

```ts
import fs from "fs";

const pdfB64 = fs.readFileSync("my.pdf").toString("base64");

const resp = await client.chat.completions.create({
  model: "gpt‑4o‑mini",
  messages: [
    {
      role: "user",
      content: [
        { type: "input_text", text: "Extract key points" },
        {
          type: "input_file",
          file: {
            filename: "my.pdf",
            mime_type: "application/pdf",
            data: pdfB64
          }
        }
      ]
    }
  ]
});
```

> ⚠️ Base64 is convenient but counts toward the 32 MB total payload and can make requests very large.

## Structured Output (Optional)

```ts
const resp = await client.chat.completions.create({
  model: "gpt‑4o‑mini",
  messages: [ …same as above… ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "summary",
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          bullets: { type: "array", items: { type: "string" } }
        },
        required: ["title", "bullets"],
        additionalProperties: false
      },
      strict: true
    }
  }
});
```

## Best‑Practice Notes
* **Token usage**: Each page is treated like an image; expect ~8–12× more tokens than plain text.  
* **Chunk multi‑PDF workflows**: If a single document exceeds 100 pages, split it.  
* **Security**: PDFs are stored encrypted at rest; delete them when you no longer need them with `client.files.del(file.id)`.  
* **Assistants vs. Chat**: For long‑running or multi‑turn document QA, use the Assistants API with the **file search** tool; otherwise a single chat call is simpler.

## Resources
* OpenAI “Images & Vision” guide  
* OpenAI text guide (file upload snippet)  
* LearnPrompting — “OpenAI API Now Works with PDFs”  
* StackOverflow — answer with `input_file` / `input_text` example  
* Community posts on `purpose="user_data"`

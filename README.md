# docs

公开文档预览仓库。将 PDF 或 Markdown 放入 `content/` 后运行 `./scripts/publish.sh`，
站点会自动扫描并生成目录。

## 支持的格式

| 类型 | 目录 | 扩展名 |
|------|------|--------|
| PDF | `content/pdf/` | `.pdf` |
| Markdown | `content/md/` | `.md` |

可选：为每个文件添加同名元数据 `文件名.meta.json`：

```json
{
  "title": "文档标题",
  "blurb": "一句话摘要",
  "tags": ["tag1", "tag2"]
}
```

未提供元数据时，标题由文件名自动生成。

## 发布

```bash
# 1. 放入文档
cp report.pdf content/pdf/report.pdf

# 2. 生成目录并推送（单 commit）
./scripts/publish.sh
```

`publish.sh` 会执行：

1. 扫描 `content/pdf/` 与 `content/md/`
2. 生成 `manifest.json`
3. 以单 commit 形式 force-push 到 `main`

## 仓库结构

```text
index.html / view.html / site.json / manifest.json
assets/
content/
  pdf/
  md/
scripts/
  generate-manifest.py
  publish.sh
```

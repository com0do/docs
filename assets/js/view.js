function $(selector) {
  return document.querySelector(selector);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function loadManifest() {
  const response = await fetch("manifest.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`manifest.json ${response.status}`);
  return response.json();
}

async function renderMarkdown(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path} ${response.status}`);
  const markdown = await response.text();
  const container = document.createElement("article");
  container.className = "markdown-body";
  container.innerHTML = marked.parse(markdown, { mangle: false, headerIds: true });
  return container;
}

function renderPdf(path) {
  const frame = document.createElement("iframe");
  frame.className = "pdf-frame";
  frame.title = "PDF viewer";
  frame.src = `${path}#view=FitH`;
  return frame;
}

async function bootstrap() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const body = $("#view-body");
  const title = $("#view-title");
  const meta = $("#view-meta");

  if (!id) {
    body.innerHTML = `<div class="error-state">缺少文档 id。请从首页选择一篇文档。</div>`;
    return;
  }

  try {
    const manifest = await loadManifest();
    const doc = (manifest.documents || []).find((item) => item.id === id);
    if (!doc) throw new Error(`未找到文档：${id}`);

    document.title = `${doc.title} · ${manifest.site?.title || "Docs"}`;
    title.textContent = doc.title;
    meta.textContent = `${doc.type.toUpperCase()} · ${doc.id}`;

    const rawLink = $("#raw-link");
    if (rawLink) {
      rawLink.href = doc.path;
      rawLink.setAttribute("download", "");
    }

    if (doc.type === "pdf") {
      body.replaceChildren(renderPdf(doc.path));
      return;
    }

    if (doc.type === "md") {
      body.replaceChildren(await renderMarkdown(doc.path));
      return;
    }

    throw new Error(`不支持的文档类型：${doc.type}`);
  } catch (error) {
    body.innerHTML = `<div class="error-state">${escapeHtml(error.message)}</div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  void bootstrap();
});

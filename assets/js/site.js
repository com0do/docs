const state = {
  documents: [],
  activeTag: "all",
  query: "",
};

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

function collectTags(documents) {
  const tags = new Set();
  for (const doc of documents) {
    for (const tag of doc.tags || []) tags.add(tag);
  }
  return [...tags].sort();
}

function matches(doc) {
  if (state.activeTag !== "all" && !(doc.tags || []).includes(state.activeTag)) {
    return false;
  }
  if (!state.query) return true;
  const haystack = [doc.title, doc.blurb, doc.id, ...(doc.tags || [])]
    .join(" ")
    .toLowerCase();
  return haystack.includes(state.query);
}

function readHref(doc) {
  if (doc.type === "pdf") return doc.path;
  return `view.html?id=${encodeURIComponent(doc.id)}`;
}

function renderChips(tags) {
  const row = $("#tag-filters");
  if (!row) return;
  const chips = [
    `<button class="chip active" data-tag="all" type="button">全部</button>`,
    ...tags.map(
      (tag) =>
        `<button class="chip" data-tag="${escapeHtml(tag)}" type="button">${escapeHtml(tag)}</button>`,
    ),
  ];
  row.innerHTML = chips.join("");
  row.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.activeTag = chip.dataset.tag || "all";
      row.querySelectorAll(".chip").forEach((node) => {
        node.classList.toggle("active", node === chip);
      });
      renderList();
    });
  });
}

function rowHtml(doc) {
  const href = readHref(doc);
  const typeLabel = doc.type === "pdf" ? "PDF" : "MD";
  const blurb = doc.blurb
    ? `<p class="doc-blurb">${escapeHtml(doc.blurb)}</p>`
    : "";
  const tags = (doc.tags || [])
    .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join("");

  return `
    <article class="doc-row">
      <div class="doc-main">
        <div class="doc-head">
          <h2 class="doc-title">
            <a href="${href}" target="_blank" rel="noopener">${escapeHtml(doc.title)}</a>
          </h2>
          <span class="type-pill">${typeLabel}</span>
        </div>
        ${blurb}
        ${tags ? `<div class="tag-row">${tags}</div>` : ""}
      </div>
      <div class="doc-actions">
        <a class="button primary" href="${href}" target="_blank" rel="noopener">阅读</a>
      </div>
    </article>
  `;
}

function renderList() {
  const list = $("#doc-list");
  const empty = $("#empty-state");
  const filtered = state.documents.filter(matches);

  if (list) {
    list.innerHTML = filtered.map(rowHtml).join("");
  }
  if (empty) {
    empty.hidden = filtered.length !== 0;
  }
}

async function bootstrap() {
  const layout = document.querySelector(".layout");
  try {
    const response = await fetch("manifest.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`manifest.json ${response.status}`);
    const manifest = await response.json();
    state.documents = manifest.documents || [];

    const title = manifest.site?.title;
    const subtitle = manifest.site?.subtitle;
    if (title) $("#site-title").textContent = title;
    if (subtitle) {
      const node = $("#site-subtitle");
      node.textContent = subtitle;
      node.hidden = false;
    }

    renderChips(collectTags(state.documents));
    renderList();

    const search = $("#search-input");
    if (search) {
      search.addEventListener("input", () => {
        state.query = search.value.trim().toLowerCase();
        renderList();
      });
    }
  } catch (error) {
    if (layout) {
      layout.innerHTML = `<div class="error-state">无法加载文档目录：${escapeHtml(error.message)}</div>`;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  void bootstrap();
});

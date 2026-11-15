const bookGrid = document.getElementById("bookGrid");
const bookCount = document.getElementById("bookCount");
const searchInput = document.getElementById("searchInput");

const pdfModal = document.getElementById("pdfModal");
const modalDialog = document.getElementById("modalDialog");
const modalTitle = document.getElementById("modalTitle");
const modalMeta = document.getElementById("modalMeta");
const pdfViewer = document.getElementById("pdfViewer");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

// Fallback SVG cover if Drive thumbnail is restricted
function getFallbackCover(title, writer) {
  const safeTitle = title.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const safeWriter = writer.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
      </defs>
      <rect width="300" height="400" fill="url(#g)"/>
      <rect x="18" y="18" width="264" height="364" rx="8" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
      <text x="150" y="150" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">
        ${safeTitle.slice(0, 26)}
      </text>
      <text x="150" y="180" fill="#bae6fd" font-family="sans-serif" font-size="14" text-anchor="middle">
        ${safeTitle.slice(26, 54)}
      </text>
      <text x="150" y="330" fill="#e2e8f0" font-family="sans-serif" font-size="13" text-anchor="middle">
        ${safeWriter.slice(0, 32)}
      </text>
    </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

// Render Rokomari-style cards
function renderBooks(list) {
  bookGrid.innerHTML = "";
  bookCount.textContent = `Showing ${list.length} book${list.length === 1 ? "" : "s"}`;

  if (list.length === 0) {
    bookGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding:40px; color:#64748b;">No matching books found.</p>`;
    return;
  }

  list.forEach((book) => {
    const card = document.createElement("article");
    card.className = "book-card";

    const thumbUrl = book.isFolder
      ? getFallbackCover(book.title, book.writer)
      : `https://drive.google.com/thumbnail?id=${book.fileId}&sz=w600`;

    card.innerHTML = `
      <div>
        <div class="cover-wrapper">
          <span class="edition-tag">${book.edition}</span>
          <img
            src="${thumbUrl}"
            alt="${book.title}"
            loading="lazy"
            onerror="this.onerror=null; this.src='${getFallbackCover(book.title, book.writer)}';"
          />
        </div>
        <div class="book-info">
          <h3 class="book-title" title="${book.title}">${book.title}</h3>
          <p class="book-writer">${book.writer}</p>
          <p class="book-edition">${book.edition}</p>
        </div>
      </div>
      <button class="btn-read" type="button" data-id="${book.id}">
        Read Online
      </button>
    `;

    card.querySelector(".btn-read").addEventListener("click", () => openBookModal(book));
    bookGrid.appendChild(card);
  });
}

// Open PDF Popup Modal
function openBookModal(book) {
  modalTitle.textContent = book.title;
  modalMeta.textContent = `${book.writer} • ${book.edition}`;

  const embedUrl = book.isFolder
    ? `https://drive.google.com/embeddedfolderview?id=${book.fileId}#grid`
    : `https://drive.google.com/file/d/${book.fileId}/preview`;

  pdfViewer.src = embedUrl;
  pdfModal.classList.add("active");
  pdfModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

// Close PDF Popup Modal
function closeBookModal() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
  modalDialog.classList.remove("is-fullscreen");
  fullscreenBtn.textContent = "⛶ Full Screen";
  pdfModal.classList.remove("active");
  pdfModal.setAttribute("aria-hidden", "true");
  pdfViewer.src = "";
  document.body.style.overflow = "";
}

// Toggle Full Screen (Native API + Mobile CSS Fallback)
fullscreenBtn.addEventListener("click", () => {
  const isNowFull = modalDialog.classList.toggle("is-fullscreen");

  if (isNowFull) {
    fullscreenBtn.textContent = "❐ Exit Full Screen";
    if (modalDialog.requestFullscreen) {
      modalDialog.requestFullscreen().catch(() => {});
    }
  } else {
    fullscreenBtn.textContent = "⛶ Full Screen";
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }
});

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) {
    modalDialog.classList.remove("is-fullscreen");
    fullscreenBtn.textContent = "⛶ Full Screen";
  }
});

closeModalBtn.addEventListener("click", closeBookModal);

pdfModal.addEventListener("click", (e) => {
  if (e.target === pdfModal) closeBookModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && pdfModal.classList.contains("active")) {
    closeBookModal();
  }
  if ((e.ctrlKey || e.metaKey) && ["s", "p", "u"].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});

document.addEventListener("contextmenu", (e) => e.preventDefault());

// Live Search
searchInput.addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  const filtered = BOOKS_DATA.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      b.writer.toLowerCase().includes(q) ||
      b.edition.toLowerCase().includes(q)
  );
  renderBooks(filtered);
});

// Initial Render
renderBooks(BOOKS_DATA);

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const homeRows = document.getElementById("galleryRows");
  const homeActions = document.getElementById("galleryActions");
  const fullGrid = document.getElementById("galleryFullGrid");
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const closeButton = lightbox?.querySelector(".lightbox-close");
  const previousButton = lightbox?.querySelector(".lightbox-prev");
  const nextButton = lightbox?.querySelector(".lightbox-next");

  if ((!homeRows && !fullGrid) || !window.GalleryService) return;

  let items = [];
  let currentIndex = 0;

  function escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[char]
    );
  }

  function imageUrl(value) {
    if (!value || /^(https?:)?\/\//i.test(value) || value.startsWith("data:")) {
      return value;
    }
    return `${window.VisionAPI.baseUrl}${value.startsWith("/") ? "" : "/"}${value}`;
  }

  function galleryItem(item, index) {
    const source = imageUrl(item.image);
    return `<button class="gallery-item" type="button" data-gallery-index="${index}" aria-label="View ${escapeHtml(item.title)}">
      <img src="${escapeHtml(source)}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async">
      <span><i class="fa-solid fa-eye"></i><strong>${escapeHtml(item.title)}</strong></span>
    </button>`;
  }

  function skeletons(count = 8) {
    return Array.from(
      { length: count },
      () => `<div class="gallery-skeleton" aria-hidden="true"></div>`
    ).join("");
  }

  function message(text, type = "empty") {
    const icon = type === "error"
      ? "fa-triangle-exclamation"
      : "fa-images";
    return `<div class="course-empty-state gallery-state" role="${type === "error" ? "alert" : "status"}">
      <i class="fa-solid ${icon}"></i>
      <p>${escapeHtml(text)}</p>
    </div>`;
  }

  function renderHome(data) {
    items = data.items || [];
    if (!items.length) {
      homeRows.innerHTML = message("No gallery images available.");
      homeActions.innerHTML = "";
      return;
    }
    const firstRow = items.filter((_, index) => index % 2 === 0);
    const secondRow = items.filter((_, index) => index % 2 === 1);
    const firstIndexes = firstRow.map((item) => items.indexOf(item));
    const secondIndexes = secondRow.map((item) => items.indexOf(item));
    const rowMarkup = (rowItems, indexes, direction) => {
      if (!rowItems.length) return "";
      const repeatCount = Math.max(2, Math.ceil(6 / rowItems.length));
      const cycle = Array.from(
        { length: repeatCount },
        () => rowItems.map(
          (item, index) => galleryItem(item, indexes[index])
        ).join("")
      ).join("");
      return `<div class="gallery-marquee" data-direction="${direction}">
        <div class="gallery-track">${cycle}${cycle}</div>
      </div>`;
    };
    homeRows.innerHTML = rowMarkup(firstRow, firstIndexes, "right")
      + rowMarkup(secondRow, secondIndexes, "left");
    homeActions.innerHTML = `<a class="btn btn-primary" href="gallery.html">
      <i class="fa-solid fa-images"></i> View Full Gallery
    </a>`;
  }

  function renderFull(data) {
    items = data.items || [];
    fullGrid.innerHTML = items.length
      ? items.map(galleryItem).join("")
      : message("No gallery images available.");
  }

  function openLightbox(index) {
    if (!lightbox || !items[index]) return;
    currentIndex = index;
    const item = items[currentIndex];
    lightboxImage.src = imageUrl(item.image);
    lightboxImage.alt = item.title;
    lightboxTitle.textContent = item.title;
    const hasMultiple = items.length > 1;
    previousButton.hidden = !hasMultiple;
    nextButton.hidden = !hasMultiple;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeButton?.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.src = "";
    document.body.style.overflow = "";
  }

  function moveLightbox(step) {
    if (!items.length) return;
    openLightbox((currentIndex + step + items.length) % items.length);
  }

  document.addEventListener("click", (event) => {
    const item = event.target.closest("[data-gallery-index]");
    if (item) openLightbox(Number(item.dataset.galleryIndex));
  });
  closeButton?.addEventListener("click", closeLightbox);
  previousButton?.addEventListener("click", () => moveLightbox(-1));
  nextButton?.addEventListener("click", () => moveLightbox(1));
  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (!lightbox?.classList.contains("open")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") moveLightbox(-1);
    if (event.key === "ArrowRight") moveLightbox(1);
  });

  if (homeRows) {
    homeRows.innerHTML = `<div class="gallery-skeleton-grid">${skeletons()}</div>`;
    window.GalleryService.getGallery({ page: 1, page_size: 8 })
      .then(renderHome)
      .catch((error) => {
        homeRows.innerHTML = message(error.message, "error");
        homeActions.innerHTML = "";
      });
  }

  if (fullGrid) {
    fullGrid.innerHTML = skeletons(12);
    window.GalleryService.getGallery({ page: 1, page_size: 100 })
      .then(renderFull)
      .catch((error) => {
        fullGrid.innerHTML = message(error.message, "error");
      });
  }
});

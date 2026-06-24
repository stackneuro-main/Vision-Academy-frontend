(function () {
  "use strict";

  const mount = document.getElementById("teamShowcase");
  const actions = document.getElementById("teamShowcaseActions");
  const modal = document.getElementById("teamShowcaseModal");
  const modalGrid = document.getElementById("teamShowcaseModalGrid");
  if (!mount || !actions || !modal || !modalGrid || !window.TeamService) return;

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

  function profileCard(member) {
    const initial = String(member.full_name || "?").charAt(0).toUpperCase();
    const image = member.profile_image
      ? `<img src="${escapeHtml(member.profile_image)}" alt="${escapeHtml(member.full_name)}" loading="lazy">`
      : `<span class="team-avatar-fallback" aria-hidden="true">${escapeHtml(initial)}</span>`;
    const status = String(member.status || "active").toLowerCase();

    return `<article class="team-card">
      <div class="team-card-image">${image}</div>
      <h3>${escapeHtml(member.full_name)}</h3>
      <strong>${escapeHtml(member.designation)}</strong>
      <span>${escapeHtml(member.department)}</span>
      <div class="course-badge duration"><i class="fa-solid fa-briefcase"></i>${Number(member.experience)} year${Number(member.experience) === 1 ? "" : "s"} experience</div>
      <div class="team-status" data-status="${escapeHtml(status)}"><i class="fa-solid fa-circle"></i>${escapeHtml(status)}</div>
    </article>`;
  }

  function emptyState(message, role = "status", icon = "fa-people-group") {
    return `<div class="course-empty-state" role="${role}">
      <i class="fa-solid ${icon}"></i>
      <p>${escapeHtml(message)}</p>
    </div>`;
  }

  function closeModal() {
    if (modal.open) modal.close();
  }

  modal.querySelectorAll("[data-close-team-modal]").forEach((button) => {
    button.addEventListener("click", closeModal);
  });
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  mount.innerHTML = emptyState("Loading our team…", "status", "fa-circle-notch fa-spin");

  window.TeamService.getTeamMembers()
    .then((data) => {
      const members = Array.isArray(data.items) ? data.items : [];
      if (!members.length) {
        mount.innerHTML = emptyState("No faculty or staff members available at the moment.");
        actions.innerHTML = "";
        return;
      }

      mount.innerHTML = members.slice(0, 8).map(profileCard).join("");
      modalGrid.innerHTML = members.map(profileCard).join("");
      actions.innerHTML = members.length > 8
        ? `<button class="btn btn-primary" id="viewAllTeam" type="button">
            <i class="fa-solid fa-users-viewfinder"></i> View All Faculty &amp; Staff
          </button>`
        : "";
      document.getElementById("viewAllTeam")?.addEventListener("click", () => {
        modal.showModal();
      });
    })
    .catch((error) => {
      mount.innerHTML = emptyState(error.message, "alert", "fa-triangle-exclamation");
      actions.innerHTML = "";
    });
})();

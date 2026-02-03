import { $ } from "../utils/dom.js";
import { editDoctor, deleteDoctorAction } from "../controllers/doctorController.js";
export function renderDoctorTable(doctors) {
  const body = $("doctorsTableBody");
  const noDoctors = $("noDoctors");
  body.innerHTML = "";
  if (!doctors || doctors.length === 0) {
    noDoctors.style.display = "block";
    return;
  }
  noDoctors.style.display = "none";
  doctors.forEach((d, i) => {
    const row = document.createElement("tr");
    row.className = "border-b";
    row.innerHTML = `
      <td class="px-3 py-2">${i + 1}</td>
      <td class="px-3 py-2 font-medium text-gray-900">${d.name}</td>
      <td class="px-3 py-2">${d.specialty || ""}</td>
      <td class="px-3 py-2">${d.schedule || "-"}</td>
      <td class="px-3 py-2">${d.phone || ""}</td>
      <td class="px-3 py-2 flex space-x-2">
        <button type="button" class="bg-yellow-400 hover:bg-yellow-500 text-black py-1 px-3 rounded" data-edit="${d.id}">Edit</button>
        <button type="button" class="btn-danger text-white py-1 px-3 rounded" data-delete="${d.id}">Delete</button>
      </td>
    `;
    body.appendChild(row);
  });
  // delegated handlers
  body.onclick = (e) => {
    const editBtn = e.target.closest("[data-edit]");
    if (editBtn) {
      const id = Number(editBtn.getAttribute("data-edit"));
      if (!Number.isNaN(id)) editDoctor(id);
      return;
    }
    const delBtn = e.target.closest("[data-delete]");
    if (delBtn) {
      const id = Number(delBtn.getAttribute("data-delete"));
      if (!Number.isNaN(id)) deleteDoctorAction(id);
      return;
    }
  };
}

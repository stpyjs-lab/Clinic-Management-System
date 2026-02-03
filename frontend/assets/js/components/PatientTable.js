import { $ } from "../utils/dom.js";
import { editPatient, deletePatientAction } from "../controllers/patientController.js";

export function renderPatientTable(patients) {
  const body = $("patientsTableBody");
  const noPatients = $("noPatients");

  body.innerHTML = "";

  if (!patients || patients.length === 0) {
    noPatients.style.display = "block";
    return;
  }

  noPatients.style.display = "none";

  patients.forEach((p, i) => {
    const row = document.createElement("tr");
    row.className = "border-b";

    row.innerHTML = `
      <td class="px-3 py-2">${i + 1}</td>
      <td class="px-3 py-2 font-medium text-gray-900">${p.first_name} ${p.last_name}</td>
      <td class="px-3 py-2">${p.age != null ? p.age : "-"}</td>
      <td class="px-3 py-2">${p.gender || "-"}</td>
      <td class="px-3 py-2">${p.phone || ""}</td>
      <td class="px-3 py-2 flex space-x-2">
        <button type="button" class="bg-yellow-400 hover:bg-yellow-500 text-black py-1 px-3 rounded" data-edit="${p.id}">Edit</button>
        <button type="button" class="btn-danger text-white py-1 px-3 rounded" data-delete="${p.id}">Delete</button>
      </td>
    `;

    body.appendChild(row);
  });

  // Use event delegation so handlers remain reliable even after re-rendering
  body.onclick = (e) => {
    const editBtn = e.target.closest("[data-edit]");
    if (editBtn) {
      const id = Number(editBtn.getAttribute("data-edit"));
      if (!Number.isNaN(id)) editPatient(id);
      return;
    }

    const delBtn = e.target.closest("[data-delete]");
    if (delBtn) {
      const id = Number(delBtn.getAttribute("data-delete"));
      if (!Number.isNaN(id)) deletePatientAction(id);
      return;
    }
  };
}

// frontend/assets/js/components/ProfileView.js
import { $ } from "../utils/dom.js";

function show(id, yes) {
  const el = $(id);
  if (!el) return;
  el.classList[yes ? "remove" : "add"]("hidden");
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value ?? "";
}

export function setProfileLoading(isLoading) {
  // Basic (shared)
  show("basicLoading", isLoading);
  show("basicDetails", !isLoading);

  // Bills / Enrollments
  show("billsLoading", isLoading);
  show("billsTableContainer", !isLoading);
  show("joinLoading", isLoading);
  show("joinTableContainer", !isLoading);
}

// Student functions (kept for backward compatibility)
export function renderStudentBasic(student) {
  setText("studentId", student?.id ?? "—");
  setText("studentName", student?.name ?? "—");
  setText("studentEmail", student?.email ?? "—");
  setText("studentYear", student?.year ?? "—");
}

export function renderEnrollmentCount(count) {
  const totalEl = $("totalEnrollments");
  if (totalEl) totalEl.textContent = `Total: ${count ?? 0}`;
}

export function renderEnrollmentsTable(rows) {
  const body = $("joinTableBody");
  if (body) body.innerHTML = "";

  if (!rows || rows.length === 0) {
    show("noEnrollments", true);
    return;
  }

  show("noEnrollments", false);

  rows.forEach((r) => {
    const tr = document.createElement("tr");
    tr.className = "border-b";
    tr.innerHTML = `
      <td class="px-3 py-2">${r.enrollment_id ?? "-"}</td>
      <td class="px-3 py-2">${r.course_title ?? "-"}</td>
      <td class="px-3 py-2">${r.course_code ?? r.code ?? "-"}</td>
      <td class="px-3 py-2">${r.teacher_name ?? "-"}</td>
      <td class="px-3 py-2">${r.fees ?? "-"}</td>
      <td class="px-3 py-2">${r.duration_weeks ?? "-"}</td>
      <td class="px-3 py-2">${r.enrolled_on ?? "-"}</td>
    `;
    body.appendChild(tr);
  });
}

// Patient functions
export function renderPatientBasic(patient, serial) {
  // Show a friendly serial number (when available) and only fall back to DB id when serial is not available.
  // Example: "1" or fallback to "56" if serial cannot be computed.
  if (serial != null) {
    setText("patientId", `${serial}`);
  } else {
    setText("patientId", patient?.id ?? "—");
  }

  setText("patientName", `${patient?.first_name ?? ""} ${patient?.last_name ?? ""}`.trim() || "—");
  setText("patientAge", patient?.age ?? "—");
  setText("patientGender", patient?.gender ?? "—");
  setText("patientPhone", patient?.phone ?? "—");
}

export function renderBillCount(count) {
  const totalEl = $("totalBills");
  if (totalEl) totalEl.textContent = `Total: ${count ?? 0}`;
}

export function renderBillsTable(rows, doctorMap) {
  const body = $("billsTableBody");
  if (body) body.innerHTML = "";

  if (!rows || rows.length === 0) {
    show("noBills", true);
    return;
  }

  show("noBills", false);

  // Ensure header label shows 'No.' to match serial numbers
  try {
    const headerFirst = document.querySelector('#billsTableContainer thead th');
    if (headerFirst) headerFirst.textContent = 'No.';
  } catch (e) {
    // ignore
  }

  rows.forEach((r, i) => {
    const tr = document.createElement("tr");
    tr.className = "border-b";
    tr.innerHTML = `
      <td class="px-3 py-2">${i + 1}</td>
      <td class="px-3 py-2">${r.doctor_name ?? doctorMap.get(r.doctor_id) ?? "-"}</td>
      <td class="px-3 py-2">${doctorMap.get(r.doctor_id + "__spec") ?? "-"}</td>
      <td class="px-3 py-2">${r.amount ?? "-"}</td>
      <td class="px-3 py-2">${r.issued_on ?? "-"}</td>
      <td class="px-3 py-2">${r.description ?? ""}</td>
    `;
    body.appendChild(tr);
  });
}



export function renderProfileError() {
  setProfileLoading(false);
  renderEnrollmentCount(0);
  renderBillCount(0);
}

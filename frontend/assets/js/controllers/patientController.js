import { apiGetAll, apiGetOne, apiCreate, apiUpdate, apiDelete } from "../services/patientService.js";
import { showAlert } from "../components/Alert.js";
import { renderPatientTable } from "../components/PatientTable.js";
import { resetForm, fillForm } from "../components/PatientForm.js";
import { setState, getState } from "../state/store.js";
import { $, createElement } from "../utils/dom.js";

export function initPatientController() {
  loadPatients();

  $("patientForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      first_name: $("first_name").value.trim(),
      last_name: $("last_name").value.trim(),
      age: $("age").value ? Number($("age").value) : null,
      gender: $("gender").value || null,
      phone: $("phone").value.trim(),
    };

    const { editingId } = getState();
    editingId ? await updatePatient(editingId, data) : await createNewPatient(data);
  });

  $("cancelBtn").addEventListener("click", () => {
    setState({ editingId: null });
    resetForm();
  });
}

export async function loadPatients() {
  const spinner = $("loadingSpinner");
  const table = $("patientsTableContainer");
  spinner.style.display = "block";
  table.style.display = "none";

  let patients = await apiGetAll();

  // Compute age from dob for older records that don't have `age` populated
  patients = (patients || []).map((p) => {
    // Normalize age to number or null
    if (p.age !== null && p.age !== undefined && p.age !== "") {
      p.age = Number(p.age);
    } else if (p.dob) {
      const d = new Date(p.dob);
      if (!Number.isNaN(d.getTime())) {
        const ageYears = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
        p.age = ageYears;
      } else {
        p.age = null;
      }
    } else {
      p.age = null;
    }

    // Ensure gender property exists
    p.gender = p.gender || null;
    return p;
  });

  setState({ patients });
  renderPatientTable(patients);

  spinner.style.display = "none";
  table.style.display = "block";
}

export async function createNewPatient(data) {
  const res = await apiCreate(data);
  if (res.ok) {
    showAlert("Patient added!");
    resetForm();
    loadPatients();
    try { window.dispatchEvent(new CustomEvent('patients:changed', { detail: { patient_id: res?.id || null } })); } catch (e) {}
  }
}

export async function editPatient(id) {
  const patient = await apiGetOne(id);
  if (!patient) {
    showAlert("Patient not found.", "error");
    return;
  }
  setState({ editingId: id });
  fillForm(patient);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export async function updatePatient(id, data) {
  const res = await apiUpdate(id, data);
  if (res.ok) {
    showAlert("Updated!");
    resetForm();
    setState({ editingId: null });
    loadPatients();
    try { window.dispatchEvent(new CustomEvent('patients:changed', { detail: { patient_id: id } })); } catch (e) {}
  }
}

export async function deletePatientAction(id) {
  const res = await apiDelete(id);
  if (res.ok) {
    showAlert("Deleted!");
    loadPatients();
    try { window.dispatchEvent(new CustomEvent('patients:changed', { detail: { patient_id: id } })); } catch (e) {}
  }
}

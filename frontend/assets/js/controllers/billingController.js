import { apiGetAll, apiGetOne, apiCreate, apiUpdate, apiDelete } from "../services/billingService.js";
import { apiGetAll as apiGetAllPatients } from "../services/patientService.js";
import { apiGetAll as apiGetAllDoctors } from "../services/doctorService.js";
import { showAlert } from "../components/Alert.js";
import { renderBillingTable } from "../components/BillingTable.js";
import { resetForm, fillForm, populateSelects } from "../components/BillingForm.js";
import { setState, getState } from "../state/store.js";
import { $, createElement } from "../utils/dom.js";

export async function initBillingController() {
  await populateSelects();
  loadInvoices();

  $("billingForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      patient_id: Number($("patient_id").value),
      doctor_id: Number($("doctor_id").value),
      amount: Number($("amount").value),
      issued_on: $("issued_on").value || null,
      description: $("description").value.trim(),
    };

    const { editingId } = getState();
    editingId ? await updateInvoice(editingId, data) : await createNewInvoice(data);
  });

  $("cancelBtn").addEventListener("click", () => {
    setState({ editingId: null });
    resetForm();
  });
}

export async function loadInvoices() {
  const spinner = $("loadingSpinner");
  const table = $("billingTableContainer");
  spinner.style.display = "block";
  table.style.display = "none";

  const invoices = await apiGetAll();

  // load patients & doctors to show names in the table
  const [patients, doctors] = await Promise.all([apiGetAllPatients(), apiGetAllDoctors()]);
  const pMap = new Map((patients || []).map((p) => [p.id, `${p.first_name} ${p.last_name}`]));
  const dMap = new Map((doctors || []).map((d) => [d.id, d.name || `${d.first_name || ""} ${d.last_name || ""}`.trim()]));

  const decorated = (invoices || []).map((inv) => ({
    ...inv,
    patient_name: inv.patient_name || pMap.get(inv.patient_id),
    doctor_name: inv.doctor_name || dMap.get(inv.doctor_id),
  }));

  setState({ invoices: decorated });
  renderBillingTable(decorated);

  spinner.style.display = "none";
  table.style.display = "block";
}

export async function createNewInvoice(data) {
  const res = await apiCreate(data);
  if (res.ok) {
    showAlert("Invoice created!");
    resetForm();
    loadInvoices();
    // Notify interested parts of the app that invoices changed (e.g., profile view)
    try { window.dispatchEvent(new CustomEvent('invoices:changed', { detail: { patient_id: data.patient_id } })); } catch (e) {}
  }
}

export async function editInvoice(id) {
  const invoice = await apiGetOne(id);
  setState({ editingId: id });
  fillForm(invoice);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export async function updateInvoice(id, data) {
  const res = await apiUpdate(id, data);
  if (res.ok) {
    showAlert("Updated!");
    resetForm();
    setState({ editingId: null });
    loadInvoices();
    try { window.dispatchEvent(new CustomEvent('invoices:changed', { detail: { patient_id: data.patient_id } })); } catch (e) {}
  }
}

export async function deleteInvoiceAction(id) {
  const res = await apiDelete(id);
  if (res.ok) {
    showAlert("Deleted!");
    loadInvoices();
    try { window.dispatchEvent(new CustomEvent('invoices:changed', { detail: {} })); } catch (e) {}
  }
}

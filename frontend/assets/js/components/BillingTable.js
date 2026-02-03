import { $ } from "../utils/dom.js";
import { editInvoice, deleteInvoiceAction } from "../controllers/billingController.js";

export function renderBillingTable(invoices) {
  const body = $("billingTableBody");
  const noInvoices = $("noBilling");

  body.innerHTML = "";

  if (!invoices || invoices.length === 0) {
    noInvoices.style.display = "block";
    return;
  }

  noInvoices.style.display = "none";

  invoices.forEach((a, i) => {
    const row = document.createElement("tr");
    row.className = "border-b";

    row.innerHTML = `
      <td class="px-3 py-2">${i + 1}</td>
      <td class="px-3 py-2 font-medium text-gray-900">${a.patient_name || a.patient_id}</td>
      <td class="px-3 py-2">${a.doctor_name || a.doctor_id || ""}</td>
      <td class="px-3 py-2">${a.issued_on || ""}</td>
      <td class="px-3 py-2">${a.amount}</td>
      <td class="px-3 py-2 flex space-x-2">
        <button class="bg-yellow-400 hover:bg-yellow-500 text-black py-1 px-3 rounded" data-edit="${a.id}">Edit</button>
        <button class="btn-danger text-white py-1 px-3 rounded" data-delete="${a.id}">Delete</button>
      </td>
    `;

    row.querySelector("[data-edit]").onclick = () => editInvoice(a.id);
    row.querySelector("[data-delete]").onclick = () => deleteInvoiceAction(a.id);

    body.appendChild(row);
  });
}

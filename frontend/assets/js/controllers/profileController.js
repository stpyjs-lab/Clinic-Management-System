// frontend/assets/js/controllers/profileController.js

import { $ } from "../utils/dom.js";
import { exportToCSV, exportToPDF } from "../utils/exportTools.js";

import { fetchStudentById, fetchEnrollmentsForStudent } from "../services/profileService.js";
import { apiGetOne as apiGetPatient } from "../services/patientService.js";
import { apiGetAll as apiGetAllInvoices } from "../services/billingService.js";
import { apiGetAll as apiGetAllDoctors } from "../services/doctorService.js";

import {
  setProfileLoading,
  renderStudentBasic,
  renderEnrollmentCount,
  renderEnrollmentsTable,
  renderProfileError,
  renderPatientBasic,
  renderBillCount,
  renderBillsTable,
} from "../components/ProfileView.js";
import { buildPrintableTableHTML } from "../utils/printTable.js";

export async function initProfileController(id) {
  console.debug("[profileController] init", id);
  setProfileLoading(true);

  // Listen for global changes so profile updates live when patient/invoices are created/updated
  if (typeof window !== 'undefined') {
    // remove previous listeners to avoid duplicates
    try { window.removeEventListener('invoices:changed', window.__profiles_invoices_listener); } catch (e) {}
    try { window.removeEventListener('patients:changed', window.__profiles_patients_listener); } catch (e) {}

    window.__profiles_invoices_listener = async (evt) => {
      // If the change concerns this patient (or no patient specified), reload the profile
      if (!evt || !evt.detail || !evt.detail.patient_id || Number(evt.detail.patient_id) === Number(id)) {
        console.debug('[profileController] invoices:changed -> reloading profile', evt && evt.detail);
        try { await initProfileController(id); } catch (e) { console.warn('reload failed', e); }
      }
    };

    window.__profiles_patients_listener = async (evt) => {
      // Recompute serial if patient list changed; simply reload
      console.debug('[profileController] patients:changed -> reloading profile', evt && evt.detail);
      try { await initProfileController(id); } catch (e) { console.warn('reload failed', e); }
    };

    window.addEventListener('invoices:changed', window.__profiles_invoices_listener);
    window.addEventListener('patients:changed', window.__profiles_patients_listener);
  }

  try {
    // Try patient first (clinic flow)
    const patient = await apiGetPatient(id);
    console.debug("[profileController] apiGetPatient ->", patient);

    if (patient) {
      // Clinic profile: fetch invoices and doctors
      const [invoices, doctors, allPatients] = await Promise.all([apiGetAllInvoices(), apiGetAllDoctors(), import('../services/patientService.js').then(m => m.apiGetAll())]);
      console.debug("[profileController] invoices, doctors ->", invoices?.length, doctors?.length);

      // Filter invoices belonging to this patient and order by insertion time (oldest first)
      const bills = (invoices || [])
        .filter((inv) => inv.patient_id === patient.id)
        .sort((a, b) => {
          // Prefer created_at when present, otherwise fall back to id
          const aTime = a.created_at ? new Date(a.created_at).getTime() : Number.MAX_SAFE_INTEGER;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : Number.MAX_SAFE_INTEGER;
          if (aTime !== bTime) return aTime - bTime;
          return a.id - b.id;
        });
      const docMap = new Map((doctors||[]).map(d => [d.id, d.name]));
      // also map specialty under key 'id__spec'
      doctors?.forEach(d => docMap.set(d.id + "__spec", d.specialty || ""));

      // Compute serial number for this patient based on the patients list order
      let serial = null;
      try {
        if (allPatients && Array.isArray(allPatients)) {
          const idx = allPatients.findIndex(p => p.id === patient.id);
          if (idx !== -1) serial = idx + 1;
        }
      } catch (e) {
        console.warn('[profileController] could not compute patient serial', e);
      }

      // Render UI (pass serial when available)
      renderPatientBasic(patient, serial);
      renderBillCount(bills.length);
      renderBillsTable(bills, docMap);


      // exports
      $("profileExportCsvBtn")?.addEventListener("click", () => {
        exportToCSV(`patient_${patient.id}_bills.csv`, bills, [
          {key: 'id', label: 'Invoice ID'},
          {key: 'doctor_name', label: 'Doctor'},
          {key: 'amount', label: 'Amount'},
          {key: 'issued_on', label: 'Issued On'},
          {key: 'description', label: 'Description'},
        ]);
      });

      $("profileExportPdfBtn")?.addEventListener("click", () => {
        const html = buildPrintableTableHTML(`Patient ${patient.id} Bills`, bills, [
          {key: 'id', label: 'Invoice ID'},
          {key: 'doctor_name', label: 'Doctor'},
          {key: 'amount', label: 'Amount'},
          {key: 'issued_on', label: 'Issued On'},
          {key: 'description', label: 'Description'},
        ]);
        exportToPDF(`Patient ${patient.id} Bills`, html);
      });

      return;
    }

    // Fallback: student profile (previous behavior)
    const [student, rows] = await Promise.all([
      fetchStudentById(id),
      fetchEnrollmentsForStudent(id),
    ]);

    if (!student) throw new Error("Resource not found");

    renderStudentBasic(student);
    renderEnrollmentCount(rows.length);
    renderEnrollmentsTable(rows);

    // Wire export buttons (controller)
    $("profileExportCsvBtn")?.addEventListener("click", () => {
      // use existing profile export util if needed
      // keep simple CSV using exportToCSV
      exportToCSV(`student_${student.id}_enrollments.csv`, rows, [
        { key: 'enrollment_id', label: 'Enroll ID' },
        { key: 'course_title', label: 'Course' },
        { key: 'course_code', label: 'Code' },
        { key: 'teacher_name', label: 'Teacher' },
        { key: 'fees', label: 'Fees' },
        { key: 'duration_weeks', label: 'Weeks' },
        { key: 'enrolled_on', label: 'Enrolled On' },
      ]);
    });

    $("profileExportPdfBtn")?.addEventListener("click", () => {
      // build simple printable HTML
      const html = buildPrintableTableHTML(`Student ${student.id} Enrollments`, rows, [
        { key: 'enrollment_id', label: 'Enroll ID' },
        { key: 'course_title', label: 'Course' },
        { key: 'course_code', label: 'Code' },
        { key: 'teacher_name', label: 'Teacher' },
        { key: 'fees', label: 'Fees' },
        { key: 'duration_weeks', label: 'Weeks' },
        { key: 'enrolled_on', label: 'Enrolled On' },
      ]);
      exportToPDF(`Student ${student.id} Profile`, html);
    });
  } catch (err) {
    console.error("[profileController] error:", err);
    renderProfileError();
  } finally {
    // Ensure we always hide loading indicators
    try {
      setProfileLoading(false);
    } catch (e) {
      console.error('[profileController] error hiding loader', e);
    }
  }
}

export default { initProfileController };

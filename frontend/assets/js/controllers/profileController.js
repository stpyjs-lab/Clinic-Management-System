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

  try {
    // Try patient first (clinic flow)
    const patient = await apiGetPatient(id);
    console.debug("[profileController] apiGetPatient ->", patient);

    if (patient) {
      // Clinic profile: fetch invoices and doctors
      const [invoices, doctors] = await Promise.all([apiGetAllInvoices(), apiGetAllDoctors()]);
      console.debug("[profileController] invoices, doctors ->", invoices?.length, doctors?.length);

      const bills = (invoices || []).filter((inv) => inv.patient_id === patient.id).sort((a,b)=>b.id - a.id);
      const docMap = new Map((doctors||[]).map(d => [d.id, d.name]));
      // also map specialty under key 'id__spec'
      doctors?.forEach(d => docMap.set(d.id + "__spec", d.specialty || ""));

      // Render UI
      renderPatientBasic(patient);
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

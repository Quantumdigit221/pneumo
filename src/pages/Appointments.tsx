import React, { useState } from 'react';
import { useStore } from '../store';
import { AppointmentStatus } from '../types';
import { Calendar, Clock, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export const Appointments: React.FC = () => {
  const { appointments, patients, users, createAppointment } = useStore();
  const [showForm, setShowForm] = useState(false);

  // New Booking State
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const doctors = users.filter(u => u.role === 'DOCTOR');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim() || !appointmentDate || !appointmentTime) {
      setFormError('Veuillez renseigner le patient, le téléphone, la date et l\'heure du rendez-vous.');
      return;
    }
    setFormError(null);

    await createAppointment({
      patientId: patientId || undefined,
      patientName,
      patientPhone,
      appointmentDate,
      appointmentTime,
      doctorId: doctorId || undefined,
      reason
    });

    // Reset Form
    setPatientId('');
    setPatientName('');
    setPatientPhone('');
    setDoctorId('');
    setAppointmentDate('');
    setAppointmentTime('');
    setReason('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-5 border border-slate-100 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Planification des Rendez-vous & Suivi Clinique</h2>
          <p className="text-xs text-slate-400">Service de Pneumologie et Maladies Infectieuses • CHREIN Kaolack — Suivis Tuberculose, BPCO, Asthme et bilans EFR</p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setShowForm(!showForm);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Rendez-vous</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-teal-100 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-teal-800 uppercase tracking-wider mb-4">
            Planifier un suivi ou une consultation spécialisée
          </h3>
          {formError && (
            <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quick Patient Select */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Patient Enregistré (Optionnel)</label>
              <select
                value={patientId}
                onChange={(e) => {
                  const pid = e.target.value;
                  setPatientId(pid);
                  const found = patients.find(p => p.id === pid);
                  if (found) {
                    setPatientName(`${found.firstName} ${found.lastName}`);
                    setPatientPhone(found.phone);
                  }
                }}
                className="border border-slate-200 rounded-lg p-2 text-sm bg-white outline-none focus:border-teal-500"
              >
                <option value="">-- Choisir un patient existant --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.code} - {p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Nom Complet du Patient *</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Ex: Fatou Sow"
                className="border border-slate-200 rounded-lg p-2 text-sm bg-white outline-none focus:border-teal-500"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Téléphone Mobile (SMS) *</label>
              <input
                type="text"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="Ex: 770000000"
                className="border border-slate-200 rounded-lg p-2 text-sm bg-white outline-none focus:border-teal-500"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Médecin en Charge</label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="border border-slate-200 rounded-lg p-2 text-sm bg-white outline-none focus:border-teal-500"
              >
                <option value="">Attribuer automatiquement</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.specialty || 'Généraliste'})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Date *</label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="border border-slate-200 rounded-lg p-2 text-sm bg-white outline-none focus:border-teal-500"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Heure de Visite *</label>
              <input
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="border border-slate-200 rounded-lg p-2 text-sm bg-white outline-none focus:border-teal-500"
                required
              />
            </div>

            <div className="flex flex-col gap-1 md:col-span-3">
              <label className="text-xs font-bold text-slate-500">Motif Spécialisé / Protocole de Suivi</label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {[
                  'Contrôle Tuberculose M2 (Crachats)',
                  'Contrôle Tuberculose M5 (Bactério)',
                  'Fin de traitement TB (Bilan guérison)',
                  'Contrôle Asthme & Test GINA',
                  'Évaluation BPCO & Score CAT/mMRC',
                  'Suivi Post-Hospitalisation Pneumo',
                  'Bilan EFR / Spirométrie',
                  'Première consultation pneumologie'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setReason(preset)}
                    className="text-[10px] font-semibold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200 transition-colors cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Saisir des symptômes ou sélectionner un protocole ci-dessus..."
                className="border border-slate-200 rounded-lg p-2 text-sm bg-white h-16 outline-none focus:border-teal-500 resize-none"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold"
              >
                Confirmer l'ajout
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Appointment Cards and Timelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {appointments.map((apt) => (
          <div key={apt.id} className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-1 text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span className="text-xs font-semibold">{apt.appointmentDate}</span>
                <Clock className="w-3.5 h-3.5 text-teal-600 ml-2" />
                <span className="text-xs font-semibold">{apt.appointmentTime}</span>
              </div>
              <span className="text-xxs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                SÉCURISÉ
              </span>
            </div>

            <h4 className="font-bold text-md text-slate-800 mb-1">{apt.patientName}</h4>
            <p className="text-xs text-indigo-600 mb-3">Mobile: {apt.patientPhone}</p>

            <div className="bg-slate-50 p-2.5 rounded-lg text-xs text-slate-600 space-y-1 mb-4">
              <p><span className="font-medium text-slate-400">Médecin:</span> {apt.doctorName || 'À attribuer'}</p>
              <p><span className="font-medium text-slate-400">Motif:</span> {apt.reason || 'Non précisé'}</p>
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 pt-3">
              <div className="flex items-center gap-2">
                <span className="text-xxs px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-bold">
                  {apt.smsSent ? 'SMS ENVOYÉ' : 'SMS PENDING'}
                </span>
              </div>
              <span className="text-xxs font-extrabold uppercase bg-teal-100/50 text-teal-700 px-2 py-1 rounded">
                PROGRAMMÉ
              </span>
            </div>
          </div>
        ))}

        {appointments.length === 0 && (
          <div className="col-span-3 bg-white border border-dashed border-slate-200 rounded-xl p-10 text-center text-slate-400">
            Aucun rendez-vous planifié aujourd'hui.
          </div>
        )}
      </div>
    </div>
  );
};
export default Appointments;

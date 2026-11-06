import React, { useState } from 'react';
import { useStore } from '../store';
import { User, Role } from '../types';
import { Plus, Search, ShieldCheck, Mail, Building, Trash2, Pencil, AlertTriangle, Check, X, Store } from 'lucide-react';

export const Users: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, currentUser } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'DOCTOR' | 'NURSE' | 'SECRETARY' | 'LAB_TECHNICIAN' | 'IMAGING_TECHNICIAN' | 'SUPER_ADMIN'>('DOCTOR');
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [revealPasswordList, setRevealPasswordList] = useState<Record<string, boolean>>({});

  const toggleRevealPassword = (userId: string) => {
    setRevealPasswordList(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const filterUsers = users.filter(u => 
    u.role !== Role.SUPER_ADMIN && (
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role as any);
    setSpecialty(user.specialty || '');
    setPhone(user.phone || '');
    setPassword(user.password || 'password');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setName('');
    setEmail('');
    setRole('DOCTOR');
    setSpecialty('');
    setPhone('');
    setPassword('');
    setEditingUser(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      alert('Veuillez renseigner tous les champs obligatoires.');
      return;
    }

    if (editingUser) {
      await updateUser(editingUser.id, {
        name,
        email,
        role: role as any,
        specialty,
        phone,
        password: password || 'password'
      });
    } else {
      await addUser({
        name,
        email,
        role: role as any,
        specialty,
        phone,
        password: password || 'password',
        isActive: true
      });
    }

    setName('');
    setEmail('');
    setRole('DOCTOR');
    setSpecialty('');
    setPhone('');
    setPassword('');
    setEditingUser(null);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    await deleteUser(id);
    setUserToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-5 border border-slate-100 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Équipe Médicale & Soignante du Service</h2>
          <p className="text-xs text-slate-400 font-medium">Gestion des praticiens, soignants, techniciens et rôles cliniques (CHREIN Kaolack)</p>
        </div>
        <button
          onClick={() => {
            if (editingUser) {
              handleCancelForm();
            } else {
              setShowForm(!showForm);
            }
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer shadow-sm"
        >
          {editingUser ? <X className="w-4.5 h-4.5" /> : <Plus className="w-4 h-4" />}
          <span>{editingUser ? "Annuler Modification" : showForm ? "Masquer le Formulaire" : "Nouveau Praticien / Soignant"}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-teal-100 rounded-xl p-6 shadow-sm space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold text-teal-800 uppercase tracking-wider">
            {editingUser ? `Modifier le Compte de ${editingUser.name}` : "Ajouter un Professionnel de Santé"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Nom Complet *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Dr. Fatou Diop"
                className="border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-teal-500 font-medium text-slate-800"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Adresse Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: f.diop@chrein-kaolack.sn"
                className="border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-teal-500 font-medium text-slate-800"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Rôle Hospitalier *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-teal-500 bg-white font-medium text-slate-800"
              >
                <option value="DOCTOR">Médecin Spécialiste (Pneumologie / Infectiologie)</option>
                <option value="NURSE">Infirmier(e) Diplômé(e) d'État (Soins & DAR)</option>
                <option value="LAB_TECHNICIAN">Technicien de Laboratoire (BK / GeneXpert)</option>
                <option value="IMAGING_TECHNICIAN">Manipulateur Radiologie / Scanner</option>
                <option value="SECRETARY">Secrétaire Médicale (Accueil IP / Admissions)</option>
                <option value="ADMIN">Administrateur Hospitalier de Structure</option>
                {currentUser?.role === Role.SUPER_ADMIN && (
                  <option value="SUPER_ADMIN">Super Administrateur Système</option>
                )}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Discipline / Spécialité</label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Ex: Tuberculose & Résistance, BPCO & VNI, Soins Intensifs"
                className="border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-teal-500 font-medium text-slate-800"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Téléphone Mobile</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 771122334"
                className="border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-teal-500 font-medium text-slate-800"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">Mot de Passe Réseau *</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ex: Passe123!"
                className="border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-teal-500 font-medium text-slate-800 bg-teal-50/10"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCancelForm}
              className="px-4 py-2 text-xs border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg cursor-pointer transition-colors"
            >
              {editingUser ? "Enregistrer les modifications" : "Créer le compte"}
            </button>
          </div>
        </form>
      )}

      {/* Account display List */}
      <div className="space-y-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-4 h-4 text-slate-400" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par Nom, Email d'identification ou Rôle..."
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-500 shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filterUsers.map((user) => {
            // Check if this card is in delete confirmation mode
            if (userToDelete === user.id) {
              return (
                <div key={user.id} className="bg-rose-50 border border-rose-100 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between min-h-[190px] animate-fade-in">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-rose-800">
                      <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
                      <span className="font-extrabold text-xs uppercase tracking-wider">Supprimer le Compte</span>
                    </div>
                    <p className="text-xs text-rose-700 font-bold leading-relaxed">
                      Voulez-vous vraiment désactiver et supprimer le profil de <span className="underline">{user.name}</span> ? Cette opération est définitive.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-rose-100/50">
                    <button
                      type="button"
                      onClick={() => setUserToDelete(null)}
                      className="px-3 py-1.5 text-xxs font-extrabold bg-white border border-rose-200 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(user.id)}
                      className="px-3 py-1.5 text-xxs font-extrabold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
                    >
                      Supprimer définitivement
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={user.id} className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm flex flex-col justify-between gap-4 transition-all hover:shadow-md">
                <div className="space-y-4">
                  <div className="flex gap-3 justify-between">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center font-extrabold text-sm">
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm leading-none mb-1">{user.name}</h4>
                        <span className={`text-3xs uppercase font-extrabold px-2 py-0.5 rounded tracking-wider ${
                          user.role === 'DOCTOR'
                            ? 'bg-teal-100 text-teal-800 border border-teal-200'
                            : user.role === 'NURSE'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : user.role === 'LAB_TECHNICIAN' || user.role === 'IMAGING_TECHNICIAN'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {user.role === 'DOCTOR'
                            ? 'Médecin Clinicien'
                            : user.role === 'NURSE'
                            ? 'Infirmier(e) Soins / DAR'
                            : user.role === 'LAB_TECHNICIAN'
                            ? 'Laboratoire BK/GeneXpert'
                            : user.role === 'IMAGING_TECHNICIAN'
                            ? 'Manipulateur Radio'
                            : user.role === 'SECRETARY'
                            ? 'Secrétaire Médicale'
                            : user.role}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded h-5 flex items-center">
                      ACTIF
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50/70 p-3 rounded-lg font-semibold/90">
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> 
                      <span className="truncate">{user.email}</span>
                    </p>
                    {user.specialty && (
                      <p className="flex items-center gap-1.5">
                        <span className="text-teal-650 text-slate-500">🔬</span> 
                        <span>Spécialité : <strong className="text-slate-750 font-bold">{user.specialty}</strong></span>
                      </p>
                    )}
                    {user.phone && (
                      <p className="flex items-center gap-1.5">
                        <span className="text-teal-650 text-slate-500">📞</span> 
                        <span>Tél : <strong className="text-slate-750 font-bold">{user.phone}</strong></span>
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-200/50 mt-1">
                      <span className="flex items-center gap-1.5">
                        <span className="text-teal-600">🔑</span> 
                        <span className="text-xxs text-slate-500 font-bold">Passe : <strong className="text-slate-800 font-mono text-xs font-extrabold">{revealPasswordList[user.id] ? (user.password || 'password') : '••••••••'}</strong></span>
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleRevealPassword(user.id)}
                        className="text-[10px] text-teal-650 hover:text-teal-800 font-black hover:underline cursor-pointer"
                      >
                        {revealPasswordList[user.id] ? "Masquer" : "Le voir"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Actions Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100/60 gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(user)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] uppercase tracking-wider font-extrabold text-teal-700 hover:text-teal-800 hover:bg-teal-55/40 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Modifier</span>
                  </button>

                  {currentUser?.id !== user.id ? (
                    <button
                      type="button"
                      onClick={() => setUserToDelete(user.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] uppercase tracking-wider font-extrabold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 bg-slate-100/80 px-2 py-1 rounded-lg font-bold italic">
                      Votre Compte
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Users;

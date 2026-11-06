import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import {
  Building2,
  Phone,
  Mail,
  User,
  MapPin,
  FileText,
  Save,
  CheckCircle,
  HelpCircle,
  Layers,
  ShieldCheck,
  Image as ImageIcon,
  Check,
  Printer,
  Upload,
  Trash2,
  Lock,
  Sparkles,
  Info
} from 'lucide-react';
import { Role } from '../types';

export const ClinicConfig: React.FC = () => {
  const { currentCenter, updateCenter, currentUser, beds } = useStore();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    directorName: '',
    rnis: '',
    logoUrl: '',
    capacity: 50,
    pispialias: ''
  });

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setStatusMsg({ type: 'error', text: 'Veuillez sélectionner un fichier image valide (PNG, JPG, SVG, WEBP).' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setStatusMsg({ type: 'error', text: 'Le fichier choisi est trop volumineux (limite max recommandée : 2 Mo).' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        const base64Data = event.target.result;
        setFormData(prev => ({ ...prev, logoUrl: base64Data }));
        setStatusMsg({ type: 'success', text: 'Le logo de votre sceau officiel a été chargé localement ! Cliquez sur "Sauvegarder les Changements" ci-dessous pour confirmer.' });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Default professional clinic imagery suggestions
  const PRESET_LOGOS = [
    {
      name: 'Général / Médical',
      url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=200',
      tag: 'Dispensaire'
    },
    {
      name: 'Pédiatric',
      url: 'https://images.unsplash.com/photo-1502740479796-6199b6810c55?auto=format&fit=crop&q=80&w=200',
      tag: 'Enfance'
    },
    {
      name: 'Dentaire',
      url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=200',
      tag: 'Sourire'
    },
    {
      name: 'Cardiologie',
      url: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&q=80&w=200',
      tag: 'Urgences'
    }
  ];

  useEffect(() => {
    if (currentCenter) {
      setFormData({
        name: currentCenter.name || '',
        address: currentCenter.address || '',
        phone: currentCenter.phone || '',
        email: currentCenter.email || '',
        directorName: currentCenter.directorName || '',
        rnis: currentCenter.rnis || '',
        logoUrl: currentCenter.logoUrl || '',
        capacity: currentCenter.capacity || 50,
        pispialias: currentCenter.pispialias || ''
      });
    }
  }, [currentCenter]);

  // Restrict access to roles
  const hasAccess = currentUser && [Role.ADMIN, Role.SUPER_ADMIN].includes(currentUser.role);

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto text-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-3 bg-red-100 text-red-600 rounded-full mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-800">Accès Restreint</h3>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Désolé, seuls les administrateurs généraux ou les supers-administrateurs possèdent les privilèges requis pour modifier l'en-tête et les coordonnées officielles de l'établissement.
        </p>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || 0 : value
    }));
  };

  const handleSelectPresetLogo = (url: string) => {
    setFormData(prev => ({ ...prev, logoUrl: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg(null);

    // Validation
    if (!formData.name.trim()) {
      setStatusMsg({ type: 'error', text: 'Le nom du centre est obligatoire' });
      setIsSubmitting(false);
      return;
    }

    try {
      await updateCenter(formData);
      setStatusMsg({
        type: 'success',
        text: 'Les paramètres de la clinique ont été mis à jour et synchronisés avec succès !'
      });
      // Scroll to top to see success banner
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        text: `Une erreur est survenue lors de la sauvegarde : ${err.message || 'Erreur inconnue'}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Configuration de la Clinique</h2>
          <p className="text-sm text-slate-500">
            Personnalisez l’identité de votre structure, son logo et ses mentions légales imprimées sur vos ordonnances et reçus.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold bg-teal-50 text-teal-800 border border-teal-100 rounded-lg px-3 py-1.5 self-start">
          <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <span>Rôle : {currentUser?.role}</span>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border text-sm font-medium shadow-sm animate-fade-in ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <div className="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">!</div>
          )}
          <div className="flex-1">
            <p className="font-bold">{statusMsg.type === 'success' ? 'Succès !' : 'Erreur'}</p>
            <p className="mt-0.5 text-xs opacity-90">{statusMsg.text}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Parameters Forms */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          
          {/* Box 1: Identité Clinique */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Identité de l'Établissement</h3>
                <p className="text-xxs text-slate-400 font-bold uppercase tracking-wider">Nom, Directeurs & Capacité d'accueil</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nom Officiel d'Exercice *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: Clinique Dentaire Cheikh Anta Diop"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Médecin Chef / Directeur
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="directorName"
                    value={formData.directorName}
                    onChange={handleInputChange}
                    placeholder="Ex: Dr. Mamadou Diouf"
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Capacité d'accueil (Lits / Boxes)
                </label>
                <div className="relative">
                  <Layers className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    min="1"
                    placeholder="Ex: 50"
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: Coordonnées */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Coordonnées de Contact</h3>
                <p className="text-xxs text-slate-400 font-bold uppercase tracking-wider">Localisation, Téléphonie & E-mail</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Adresse Postale / Physique complète
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Ex: Rue Amadou Assane Ndoye face Clinique du Cap, Dakar"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Téléphone d'Accueil public
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Ex: +221 33 824 45 45"
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email de Contact général
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Ex: contact@santeclinique.sn"
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Box 3: Reglementation & Logo Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Mentions Administratives & Identifiants Nationaux</h3>
                <p className="text-xxs text-slate-400 font-bold uppercase tracking-wider">Régulation rnis, assurance ipm & logos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Code National d'Exercice (RNIS)
                </label>
                <input
                  type="text"
                  name="rnis"
                  value={formData.rnis}
                  onChange={handleInputChange}
                  placeholder="Ex: SEN-RNIS-DK-904"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition animate-fade-in"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Identifiant Assurances (Alias PISPI/IPM)
                </label>
                <input
                  type="text"
                  name="pispialias"
                  value={formData.pispialias}
                  onChange={handleInputChange}
                  placeholder="Ex: IPM-SENELEC-7140"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1.5" id="logo-uploader-label">
                  Sceau ou Logo Officiel de la Clinique
                </label>
                
                {/* Drag and Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    dragActive
                      ? 'border-teal-500 bg-teal-50/30'
                      : formData.logoUrl
                      ? 'border-slate-300 bg-slate-50/50'
                      : 'border-slate-200 hover:border-slate-350 bg-slate-50/30'
                  }`}
                  id="logo-dropzone"
                >
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {formData.logoUrl ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-20 h-20 rounded-full border border-slate-350 overflow-hidden shadow-sm bg-white p-0.5 relative group">
                        <img
                          src={formData.logoUrl}
                          alt="Logo chargé"
                          className="w-full h-full object-cover rounded-full"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="text-xs">
                        <p className="font-extrabold text-slate-700">Un logo personnalisé est sélectionné</p>
                        <p className="text-slate-400 text-[10px] mt-0.5">Le logo sera intégré à vos ordonnances et reçus.</p>
                      </div>
                      <div className="flex gap-2">
                        <label
                          htmlFor="logo-upload"
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 shadow-sm cursor-pointer"
                          id="btn-replace-logo"
                        >
                          Remplacer le logo
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                          id="btn-delete-logo"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label htmlFor="logo-upload" className="flex flex-col items-center justify-center cursor-pointer space-y-2">
                      <div className="p-3 bg-white border border-slate-150 rounded-full text-slate-400 shadow-sm hover:text-teal-600 transition">
                        <Upload className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">
                          <span className="text-teal-600 hover:underline">Saisir/Uploader un fichier image</span> ou glissez-déposez
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide">Fichiers PNG, JPG, SVG ou WebP (max. 2 Mo)</p>
                      </div>
                    </label>
                  )}
                </div>

                {/* Direct clinical logo URL input field */}
                <div className="mt-4">
                  <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1.5" id="logo-url-label">
                    Adresse URL du Sceau ou Logo de la Clinique
                  </label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="url"
                      name="logoUrl"
                      value={formData.logoUrl.startsWith('data:') ? '' : formData.logoUrl}
                      onChange={handleInputChange}
                      placeholder="https://images.unsplash.com/... ou adresse URL de l'image"
                      className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition"
                      id="logo-url-input"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Saisissez l'adresse URL directe d'une image hébergée en ligne ou chargez un fichier ci-dessus.</p>
                </div>
              </div>

              {/* Quick logo presets switcher */}
              <div className="md:col-span-2 pt-2">
                <p className="text-xxs font-extrabold text-slate-400 uppercase tracking-wider mb-2">Choisir parmi nos sceaux professionnels :</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PRESET_LOGOS.map((logo, index) => {
                    const isSelected = formData.logoUrl === logo.url;
                    return (
                      <div
                        key={index}
                        onClick={() => handleSelectPresetLogo(logo.url)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 cursor-pointer transition bg-white select-none relative ${
                          isSelected ? 'border-teal-500 bg-teal-50/20' : 'border-slate-100 hover:border-slate-250'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0">
                          <img src={logo.url} alt={logo.name} className="w-full h-full object-cover" reffererpolicy="no-referrer" />
                        </div>
                        <p className="text-xxs font-extrabold text-slate-700 mt-2 truncate text-center w-full">{logo.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold tracking-tight uppercase">{logo.tag}</p>
                        {isSelected && (
                          <div className="absolute top-1 right-1 p-0.5 bg-teal-600 rounded-full text-white">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow shadow-teal-500/15 disabled:opacity-50 cursor-pointer text-sm"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Mise à jour...' : 'Sauvegarder les Changements'}</span>
            </button>
          </div>
        </form>

        {/* Right Side: Professional Invoice & Prescription letterhead preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-6">
            <div className="bg-slate-50 rounded-2xl border border-slate-250 shadow-sm p-4 text-center">
              <span className="inline-flex items-center gap-1 text-xxs font-black bg-indigo-50 border border-indigo-150 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-wider mb-2">
                <Printer className="w-3 h-3 text-indigo-600" />
                Aperçu de l'En-tête Clinique
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                La boîte ci-dessous simule le rendu de l’entête officiel imprimé sur vos ordonnances médicales, bilans d’examens cliniques, reçus de tickets et historiques des ventes de la pharmacie.
              </p>

              {/* Realistic Envelope/Letterhead Sheet Card container */}
              <div className="bg-white border border-slate-200 shadow-md rounded-xl p-5 text-left font-sans text-slate-900 min-h-[360px] flex flex-col justify-between">
                {/* Header Top Section (Traditional African Administration style) */}
                <div>
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
                    {/* Republic seal left */}
                    <div className="text-[9px] font-bold text-center leading-tight uppercase font-serif max-w-[140px]">
                      <p className="text-[8px] text-slate-500 tracking-wider">RÉPUBLIQUE DU SÉNÉGAL</p>
                      <p className="text-[7px] text-slate-400">Un Peuple - Un But - Une Foi</p>
                      <div className="w-4 h-[1px] bg-slate-300 mx-auto my-1" />
                      <p className="text-[7.5px] font-extrabold text-slate-600 leading-none">MINISTÈRE DE LA SANTÉ ET DE L'ACTION SOCIALE</p>
                    </div>

                    {/* Hospital central logo / stamp seal */}
                    <div className="flex flex-col items-center justify-center">
                      {formData.logoUrl ? (
                        <div className="w-12 h-12 rounded-full border border-slate-350 overflow-hidden shadow-sm bg-white flex items-center justify-center p-0.5">
                          <img
                            src={formData.logoUrl}
                            alt="Sceau Clinique"
                            className="w-full h-full object-cover rounded-full"
                            reffererpolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-teal-50 border-2 border-dashed border-teal-600 flex flex-col items-center justify-center text-teal-700">
                          <Building2 className="w-5 h-5" />
                        </div>
                      )}
                      {formData.rnis && (
                        <p className="text-[7.5px] font-mono font-bold text-slate-500 uppercase mt-1">Code : {formData.rnis}</p>
                      )}
                    </div>

                    {/* Hospital/Clinic info right */}
                    <div className="text-right max-w-[180px]">
                      <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-tight leading-tight">
                        {formData.name || 'NOM CLINIQUE NON DÉFINI'}
                      </h4>
                      <p className="text-[9px] text-slate-500 font-medium leading-normal mt-0.5 truncate" title={formData.address}>
                        {formData.address || 'Aucune adresse enregistrée'}
                      </p>
                      <p className="text-[9px] text-slate-500 font-bold mt-1">
                        Tel: <span className="font-mono text-slate-700">{formData.phone || '—— ——'}</span>
                      </p>
                      <p className="text-[8.5px] text-indigo-700 hover:underline cursor-pointer truncate font-medium">
                        {formData.email || 'Pas de messager électronique'}
                      </p>
                    </div>
                  </div>

                  {/* Representative Body Content Template */}
                  <div className="space-y-4 pt-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] font-black uppercase text-slate-400 font-mono">Dossier N° : REG-2026-90</span>
                      <span className="text-[9px] font-bold text-slate-500 font-mono">Dakar, le {new Date().toLocaleDateString('fr-FR')}</span>
                    </div>

                    {/* Dummy Prescription Area */}
                    <div className="border border-dashed border-slate-200 rounded-lg p-3 bg-slate-50/50">
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Exemple d'Ordonnance Médicale</p>
                      <div className="space-y-2 text-[10.5px]">
                        <div className="flex justify-between text-slate-700">
                          <span className="font-semibold text-slate-800">1. Amoxicilline 500mg</span>
                          <span className="font-mono text-slate-500">1 gél x 3 / jour (6j)</span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span className="font-semibold text-slate-800">2. Paracétamol 1g Effervescent</span>
                          <span className="font-mono text-slate-500">1 comp toutes les 8h (3j)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer legal note */}
                <div className="border-t border-slate-150 pt-2 mt-4 text-[7.5px] text-slate-400 flex justify-between items-center font-mono">
                  <span>Directeur de l'Établissement : {formData.directorName || 'Non désigné'}</span>
                  {formData.pispialias && (
                    <span className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded text-[7px] font-bold">
                      Partenaire : {formData.pispialias}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Warning callout for data model integrity */}
            <div className="mt-4 p-4 rounded-xl border border-blue-150 bg-blue-50/50 text-blue-900 text-xs flex gap-3 pb-4">
              <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Amortissement et Couplage Local</p>
                <p className="text-blue-800/90 leading-relaxed text-[11px] font-medium">
                  La modification de ces variables met à jour l'en-tête clinique à l’échelle globale de l’application. Les médecins, caissiers et pharmaciens verront ainsi instantanément s'actualiser le cache de l'en-tête lors de l'impression ou de l'analyse des reçus et du diagnostic.
                </p>
              </div>
            </div>

            {/* Organisation Hospitalière & Unités Spécialisées de Pneumologie (CHREIN) */}
            <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm text-left animate-fadeIn">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
                  <Layers className="w-5 h-5 font-bold" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Unités Hospitalières & Protocoles Spécialisés</h3>
                  <p className="text-xxs text-slate-400 font-bold uppercase tracking-wider">Service de Pneumologie & Maladies Infectieuses • CHREIN Kaolack</p>
                </div>
              </div>

              {/* Status and Capacity */}
              <div className="bg-gradient-to-br from-teal-50/50 via-slate-50 to-white rounded-xl p-4.5 border border-slate-200/60 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-3xs bg-teal-100/80 border border-teal-200 text-teal-800 font-black tracking-widest px-2 py-0.5 rounded uppercase">
                    Service Hospitalier de Référence
                  </span>
                  <span className="text-3xs px-2.5 py-0.5 rounded font-black border uppercase tracking-wider bg-emerald-50 text-emerald-700 border-emerald-200">
                    ● Capacité Opérationnelle Active
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-3xs text-slate-400 font-bold block uppercase">Lits Totaux</span>
                    <span className="text-base font-black text-slate-800">{beds?.length || 18} lits</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-3xs text-slate-400 font-bold block uppercase">Isolement TB</span>
                    <span className="text-base font-black text-red-700">4 chambres</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-3xs text-slate-400 font-bold block uppercase">Lits VNI / O2</span>
                    <span className="text-base font-black text-teal-700">6 postes</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-3xs text-slate-400 font-bold block uppercase">Plateau EFR</span>
                    <span className="text-base font-black text-slate-800">Opérationnel</span>
                  </div>
                </div>
              </div>

              {/* Specialized Modules & Clinical Protocols */}
              <div className="space-y-3">
                <p className="text-3xs font-black text-slate-400 uppercase tracking-widest block mb-2">
                  Protocoles Médicaux & Modules Cliniques Actifs :
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-semibold">
                  {[
                    { title: 'Tuberculose & Résistance (Directives PNT Sénégal)', badge: 'PNT / GeneXpert' },
                    { title: 'BPCO & Évaluation Spirométrique GOLD 2025', badge: 'GOLD A-E' },
                    { title: 'Asthme Sévère & Contrôle Clinique GINA', badge: 'GINA Paliers 1-5' },
                    { title: 'Pneumopathies Interstitielles Diffuses (PID/IPAF)', badge: 'Scanner HRCT' },
                    { title: 'Dilatation des Bronches (DDB) & Kinésithérapie', badge: 'Protocole DDB' },
                    { title: 'Pleurésies & Ponction / Drainage Pleural', badge: 'Échographie Pleure' },
                    { title: 'Surveillance Paramédicale DAR (Transmissions)', badge: 'Données-Actions-Résultats' },
                    { title: 'Imagerie Thoracique & Vision IA (Ark+ / MONAI)', badge: 'DICOM NEMA / IA', isAI: true },
                    { title: 'Calculateur Scores Cliniques (Wells, CRB-65, BAP-65)', badge: '8 Scores Validés' },
                    { title: 'Registre Épidémiologique & Recherche Clinique', badge: 'Export CSV / XLSX' }
                  ].map((proto, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg border text-xxs tracking-tight select-none bg-teal-50/40 border-teal-150 text-slate-800 font-bold"
                    >
                      <span className="truncate flex items-center gap-1.5">
                        {proto.isAI ? (
                          <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-teal-600" />
                        )}
                        <span>{proto.title}</span>
                      </span>
                      <span className="text-3xs px-2 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200 font-mono">
                        {proto.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-3.5 bg-teal-50/50 border border-teal-200 rounded-xl text-xxs text-slate-600 leading-normal flex gap-2">
                <Info className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <span className="font-semibold text-slate-700">
                  Système de Pneumologie & Maladies Infectieuses paramétré pour le Centre Hospitalier Régional El Hadji Ibrahima Niass (CHREIN Kaolack). Données hébergées et traitées conformément aux directives de la CDP Sénégal.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

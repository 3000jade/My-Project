import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  X,
  Check,
  RefreshCw,
  Plus
} from 'lucide-react';
import subdivisionService from '../../../services/subdivisionService';

export default function SubdivisionCreateModal({
  isOpen,
  onClose,
  onCreated,
}) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: '',
    developer_name: '',
    location_address: '',
    city: 'Taguig City',
    province_state: 'Metro Manila',
    latitude: 14.5547,
    longitude: 121.0350,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Subdivision Name is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await subdivisionService.createSubdivision({
        name: formData.name.trim(),
        developer_name: formData.developer_name.trim() || undefined,
        location_address: formData.location_address.trim() || `${formData.name}, ${formData.city}`,
        city: formData.city.trim(),
        province_state: formData.province_state.trim(),
        latitude: Number(formData.latitude) || 14.5547,
        longitude: Number(formData.longitude) || 121.0350,
        status: 'Active',
      });

      const newProject = response?.data || response;
      if (typeof onCreated === 'function') {
        onCreated(newProject);
      }
      onClose();
    } catch (err) {
      console.error('[SubdivisionCreateModal] Error:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to create subdivision project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0F766E]/10 flex items-center justify-center text-[#0F766E]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">New Parent Subdivision</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Create a master estate to anchor child lot listings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subdivision Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Ayala Greenfield Estates Phase 2"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Developer Name
            </label>
            <input
              type="text"
              name="developer_name"
              value={formData.developer_name}
              onChange={handleChange}
              placeholder="e.g. Ayala Land Premier"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#0F766E] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City / Municipality
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#0F766E] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Province / State
              </label>
              <input
                type="text"
                name="province_state"
                value={formData.province_state}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#0F766E] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Site Latitude
              </label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#0F766E] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Site Longitude
              </label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:border-[#0F766E] transition-all"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0F766E] hover:bg-[#0D625C] text-white shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Subdivision</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

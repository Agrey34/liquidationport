'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Plus, Lock, Building, Trash2, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from '@/lib/toast';
import { createClient } from '@/lib/supabase/client';
import InternationalPhoneInput from '@/app/components/ui/InternationalPhoneInput';

interface SavedAddress {
  id: string;
  addressLine: string;
  city: string;
  postalCode?: string;
  country: string;
  createdAt?: string;
}

interface UserProfile {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  buyerType?: string | null;
  companyName?: string | null;
  phone?: string | null;
  addresses?: SavedAddress[];
}

export default function CustomerSettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses'>('profile');

  // Profile Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [buyerType, setBuyerType] = useState('Retail Buyer');
  const [companyName, setCompanyName] = useState('');
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Addresses State
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isAddressesLoading, setIsAddressesLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New Address Form State
  const [newAddressLine, setNewAddressLine] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newPostalCode, setNewPostalCode] = useState('');
  const [newCountry, setNewCountry] = useState('United States');

  // Load User Profile on Mount
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        setIsProfileLoading(true);
        const res = await apiFetch<UserProfile>('/users/me');
        if (isMounted && res?.data) {
          const u = res.data;
          setFirstName(u.firstName || '');
          setLastName(u.lastName || '');
          setEmail(u.email || '');
          setPhone(u.phone || '');
          setBuyerType(u.buyerType || 'Retail Buyer');
          setCompanyName(u.companyName || '');
          if (Array.isArray(u.addresses)) {
            setAddresses(u.addresses);
          }
        }
      } catch (err) {
        // Fallback to dashboard overview if /users/me is missing
        try {
          const dashRes = await apiFetch<any>('/users/dashboard');
          if (isMounted && dashRes?.data?.profile) {
            const p = dashRes.data.profile;
            setFirstName(p.firstName || '');
            setLastName(p.lastName || '');
            setEmail(p.email || '');
            setBuyerType(p.buyerType || 'Retail Buyer');
          }
        } catch (dashErr) {
          console.error('Failed to load profile:', dashErr);
        }
      } finally {
        if (isMounted) setIsProfileLoading(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load Addresses when switching to addresses tab
  const loadAddresses = async () => {
    try {
      setIsAddressesLoading(true);
      const res = await apiFetch<SavedAddress[]>('/addresses');
      if (res?.data && Array.isArray(res.data)) {
        setAddresses(res.data);
      }
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setIsAddressesLoading(false);
    }
  };

  const handleTabChange = (tab: 'profile' | 'addresses') => {
    setActiveTab(tab);
    if (tab === 'addresses') {
      loadAddresses();
    }
  };

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && phoneError) {
      toast.error(phoneError);
      return;
    }

    try {
      setIsSavingProfile(true);
      await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || null,
          buyerType,
          companyName: companyName.trim(),
        }),
      });
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      toast.error(err?.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Update Password Handler
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Failed to update password:', err);
      toast.error(err?.message || 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Add Address Handler
  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressLine.trim() || !newCity.trim() || !newCountry.trim()) {
      toast.error('Please fill in all required address fields.');
      return;
    }

    try {
      setIsSavingAddress(true);
      const res = await apiFetch<SavedAddress>('/addresses', {
        method: 'POST',
        body: JSON.stringify({
          addressLine: newAddressLine.trim(),
          city: newCity.trim(),
          postalCode: newPostalCode.trim() || undefined,
          country: newCountry.trim(),
        }),
      });

      if (res?.data) {
        setAddresses((prev) => [...prev, res.data]);
        toast.success('Delivery address added successfully!');
        setIsAddModalOpen(false);
        setNewAddressLine('');
        setNewCity('');
        setNewPostalCode('');
        setNewCountry('United States');
      }
    } catch (err: any) {
      console.error('Failed to create address:', err);
      toast.error(err?.message || 'Failed to save address.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Delete Address Handler
  const handleDeleteAddress = async (id: string) => {
    try {
      setDeletingId(id);
      await apiFetch(`/addresses/${id}`, {
        method: 'DELETE',
      });
      setAddresses((prev) => prev.filter((addr) => addr.id !== id));
      toast.success('Address removed.');
    } catch (err: any) {
      console.error('Failed to delete address:', err);
      toast.error(err?.message || 'Failed to delete address.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Account Settings</h1>
          <p className="text-sm font-medium text-neutral-500 mt-1">
            Manage your personal wholesale credentials and commercial freight addresses.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-neutral-200 mb-6 font-bold text-sm">
        <button
          onClick={() => handleTabChange('profile')}
          className={`pb-3 border-b-2 px-1 transition-colors cursor-pointer ${
            activeTab === 'profile'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          Profile & Security
        </button>
        <button
          onClick={() => handleTabChange('addresses')}
          className={`pb-3 border-b-2 px-1 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'addresses'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-400 hover:text-neutral-700'
          }`}
        >
          Saved Freight Addresses
          {addresses.length > 0 && (
            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded-full text-xs font-semibold">
              {addresses.length}
            </span>
          )}
        </button>
      </div>

      {/* Profile & Security Tab */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Personal Info Card */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-neutral-400" /> Wholesale Buyer Profile
            </h2>

            {isProfileLoading ? (
              <div className="space-y-4 py-4 animate-pulse">
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-10 bg-neutral-100 rounded-xl" />
                  <div className="h-10 bg-neutral-100 rounded-xl" />
                </div>
                <div className="h-10 bg-neutral-100 rounded-xl" />
                <div className="h-10 bg-neutral-100 rounded-xl" />
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Dennis"
                      className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Smith"
                      className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" /> Account Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full p-3 bg-neutral-100/70 border border-neutral-200 rounded-xl text-neutral-500 cursor-not-allowed text-sm font-medium"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Email address is verified via Supabase Authentication.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <InternationalPhoneInput
                      id="settings-phone"
                      label="Phone Number"
                      value={phone}
                      onChange={(e164, result) => {
                        setPhone(e164);
                        if (result.digits && !result.isValid) {
                          setPhoneError(result.error || 'Please enter a valid phone number.');
                        } else {
                          setPhoneError(null);
                        }
                      }}
                      error={phoneError}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                      Buyer Category
                    </label>
                    <select
                      value={buyerType}
                      onChange={(e) => setBuyerType(e.target.value)}
                      className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none transition-all text-sm font-medium cursor-pointer"
                    >
                      <option value="Retail Buyer">Retail Buyer</option>
                      <option value="B2B Wholesaler">B2B Wholesaler</option>
                      <option value="Volume Liquidator">Volume Liquidator</option>
                      <option value="Exporter / Broker">Exporter / Broker</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-neutral-400" /> Company / Warehouse Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Liquidation Holdings LLC (Optional)"
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none transition-all text-sm font-medium"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full sm:w-auto px-6 py-3 bg-neutral-900 text-white rounded-xl text-sm font-bold hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Security Card */}
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-neutral-400" /> Security & Password
            </h2>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter at least 6 characters"
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none transition-all text-sm"
                />
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-500 leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                <span>
                  Passwords must contain at least 6 characters. Your session will remain active across your verified devices.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full sm:w-auto px-6 py-3 border border-neutral-300 text-neutral-900 rounded-xl text-sm font-bold hover:bg-neutral-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  {isUpdatingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* Saved Addresses Tab */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Real Saved Address Cards */}
            {isAddressesLoading ? (
              [1, 2].map((n) => (
                <div key={n} className="bg-white border border-neutral-200 rounded-3xl p-6 h-48 animate-pulse" />
              ))
            ) : (
              addresses.map((addr, idx) => (
                <div
                  key={addr.id}
                  className={`bg-white rounded-3xl p-6 shadow-xs relative transition-all ${
                    idx === 0
                      ? 'border-2 border-neutral-900'
                      : 'border border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {idx === 0 && (
                    <span className="absolute -top-3 left-6 px-3 py-0.5 bg-neutral-900 text-white text-[10px] font-black uppercase tracking-wider rounded-md">
                      Primary Delivery Address
                    </span>
                  )}

                  <div className="flex justify-between items-start mb-4 mt-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-neutral-700" />
                      <h3 className="font-bold text-neutral-900 text-base">
                        {idx === 0 ? 'Default Freight Facility' : `Facility Address #${idx + 1}`}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      disabled={deletingId === addr.id}
                      title="Remove Address"
                      className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      {deletingId === addr.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="text-xs text-neutral-600 font-medium leading-relaxed mb-6 space-y-1">
                    <p className="font-bold text-neutral-900 text-sm">{addr.addressLine}</p>
                    <p>
                      {addr.city}
                      {addr.postalCode ? `, ${addr.postalCode}` : ''}
                    </p>
                    <p>{addr.country}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 text-[11px] text-neutral-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Freight Destination</span>
                  </div>
                </div>
              ))
            )}

            {/* Add Address Action Card */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="border-2 border-dashed border-neutral-300 rounded-3xl p-6 flex flex-col items-center justify-center text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-400 transition-all min-h-[190px] cursor-pointer"
            >
              <div className="w-12 h-12 bg-white border border-neutral-200 rounded-full flex items-center justify-center shadow-xs mb-3 text-neutral-700">
                <Plus className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm">Add New Delivery Address</span>
              <span className="text-xs text-neutral-400 mt-1">For pallet & freight dispatches</span>
            </button>

          </div>

          {!isAddressesLoading && addresses.length === 0 && (
            <div className="p-8 bg-neutral-50 rounded-3xl border border-neutral-200 text-center max-w-md mx-auto">
              <MapPin className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-neutral-900">No Saved Delivery Addresses</h4>
              <p className="text-xs text-neutral-500 mt-1 mb-4">
                Add your warehouse, retail store, or commercial freight dock address to streamline checkout.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-5 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Add Your First Address
              </button>
            </div>
          )}

        </div>
      )}

      {/* Add Address Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-neutral-900 mb-1">Add Delivery Address</h3>
            <p className="text-xs text-neutral-500 mb-6">
              Enter your commercial or residential freight address.
            </p>

            <form onSubmit={handleCreateAddress} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                  Street Address / Dock / Suite *
                </label>
                <input
                  type="text"
                  required
                  value={newAddressLine}
                  onChange={(e) => setNewAddressLine(e.target.value)}
                  placeholder="e.g. 1200 Industrial Parkway, Dock #4"
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="e.g. Dallas"
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                    ZIP / Postal Code
                  </label>
                  <input
                    type="text"
                    value={newPostalCode}
                    onChange={(e) => setNewPostalCode(e.target.value)}
                    placeholder="e.g. 75201"
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">
                  Country *
                </label>
                <input
                  type="text"
                  required
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                  placeholder="e.g. United States"
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none text-sm font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="px-5 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {isSavingAddress && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSavingAddress ? 'Saving Address...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

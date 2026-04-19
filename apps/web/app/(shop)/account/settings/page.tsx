'use client';

import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Plus, Lock } from 'lucide-react';

export default function CustomerSettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
         <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Account Settings</h1>
      </div>

      <div className="flex gap-4 border-b border-neutral-200 mb-6 font-bold text-sm">
         <button onClick={() => setActiveTab('profile')} className={`pb-3 border-b-2 px-1 transition-colors ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}>Profile & Security</button>
         <button onClick={() => setActiveTab('addresses')} className={`pb-3 border-b-2 px-1 transition-colors ${activeTab === 'addresses' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}>Saved Addresses</button>
      </div>

      {activeTab === 'profile' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm">
               <h2 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2"><User className="w-5 h-5 text-neutral-400" /> Personal Info</h2>
               
               <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">First Name</label>
                        <input type="text" defaultValue="Dennis" className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">Last Name</label>
                        <input type="text" defaultValue="Smith" className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm" />
                     </div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</label>
                     <input type="email" defaultValue="customer@example.com" className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm" />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone Number</label>
                     <input type="tel" defaultValue="(555) 123-4567" className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm" />
                  </div>
                  <button type="button" className="mt-4 px-6 py-3 bg-neutral-900 text-white rounded-xl text-sm font-bold hover:bg-neutral-800 transition-colors">
                     Save Changes
                  </button>
               </form>
            </div>

            <div className="bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm">
               <h2 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2"><Lock className="w-5 h-5 text-neutral-400" /> Security</h2>
               
               <form className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">Current Password</label>
                     <input type="password" placeholder="••••••••" className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm" />
                  </div>
                  <div className="h-px w-full bg-neutral-100 my-2"></div>
                  <div>
                     <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">New Password</label>
                     <input type="password" placeholder="New password" className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm" />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1.5">Confirm New Password</label>
                     <input type="password" placeholder="Confirm new password" className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all text-sm" />
                  </div>
                  <button type="button" className="mt-4 px-6 py-3 border border-neutral-300 text-neutral-900 rounded-xl text-sm font-bold hover:bg-neutral-50 transition-colors">
                     Update Password
                  </button>
               </form>
            </div>
         </div>
      )}

      {activeTab === 'addresses' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-white border-2 border-primary rounded-3xl p-6 shadow-sm relative">
               <span className="absolute -top-3 left-6 px-3 py-0.5 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-md">Default Freight Address</span>
               <div className="flex justify-between items-start mb-4 mt-2">
                  <div className="flex items-center gap-2">
                     <MapPin className="w-5 h-5 text-primary" />
                     <h3 className="font-bold text-neutral-900 text-lg">Main Warehouse</h3>
                  </div>
               </div>
               <p className="text-sm text-neutral-600 font-medium whitespace-pre-line leading-relaxed mb-6">
                  Dennis Smith
                  123 Liquidation Ave
                  Bldg A, Dock 4
                  Austin, TX 90210
                  United States
                  (555) 123-4567
               </p>
               <div className="flex gap-3">
                  <button className="text-sm font-bold text-primary hover:underline">Edit</button>
               </div>
            </div>

            <button className="border-2 border-dashed border-neutral-300 rounded-3xl p-6 flex flex-col items-center justify-center text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-400 transition-all min-h-[200px]">
               <div className="w-12 h-12 bg-white border border-neutral-200 rounded-full flex items-center justify-center shadow-sm mb-3">
                  <Plus className="w-6 h-6" />
               </div>
               <span className="font-bold">Add New Address</span>
            </button>

         </div>
      )}

    </div>
  );
}

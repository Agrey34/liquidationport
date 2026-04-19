'use client';

import React, { useState } from 'react';
import { GeneralSettings } from './_components/GeneralSettings';
import { PaymentSettings } from './_components/PaymentSettings';
import { SecuritySettings } from './_components/SecuritySettings';
import { MonitoringPanel } from './_components/MonitoringPanel';
import { NotificationSettings } from './_components/NotificationSettings';
import { ApiKeysPanel } from './_components/ApiKeysPanel';

type TabId = 'general' | 'payments' | 'notifications' | 'security' | 'monitoring' | 'api';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'general', label: 'General', icon: 'fi fi-rr-settings-sliders' },
  { id: 'payments', label: 'Payments', icon: 'fi fi-rr-credit-card' },
  { id: 'notifications', label: 'Notifications', icon: 'fi fi-rr-bell' },
  { id: 'security', label: 'Security', icon: 'fi fi-rr-shield-check' },
  { id: 'monitoring', label: 'Monitoring & Logs', icon: 'fi fi-rr-chart-pie' },
  { id: 'api', label: 'API Keys', icon: 'fi fi-rr-key' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Platform Settings</h2>
          <p className="text-neutral-500 mt-1">Configure global application variables, monitoring, and webhooks.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap text-left ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-md'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  <i className={`${tab.icon} text-lg shrink-0 mt-0.5`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'payments' && <PaymentSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'monitoring' && <MonitoringPanel />}
          {activeTab === 'api' && <ApiKeysPanel />}
        </div>
      </div>
    </div>
  );
}

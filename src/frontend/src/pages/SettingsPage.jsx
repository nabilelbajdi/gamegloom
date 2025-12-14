import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Link2, ChevronRight } from 'lucide-react';
import IntegrationsTab from '../components/settings/IntegrationsTab';

const SettingsPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('integrations');

    if (!user) {
        return (
            <div className="container max-w-4xl mx-auto px-4 py-8 mt-20">
                <div className="flex justify-center items-center h-64">
                    <p className="text-lg text-gray-500">Please log in to access settings.</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'integrations', label: 'Integrations', icon: Link2 },
    ];

    return (
        <div className="min-h-screen bg-black pt-20">
            <div className="container max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Settings</h1>
                    <p className="text-gray-400">Manage your account and connected platforms</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-gray-800 pb-4">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${activeTab === tab.id
                                        ? 'bg-[var(--color-primary)] text-black font-semibold'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                    }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="fade-in">
                    {activeTab === 'integrations' && <IntegrationsTab />}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;

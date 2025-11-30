import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Award, Briefcase, Clock } from 'lucide-react';
import ProfileForm from './components/ProfileForm';
import LicenseUploader from './components/LicenseUploader';
import ServicesManager from './components/ServicesManager';
import WorkingHours from './components/WorkingHours';

const Profile = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'personal';

  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const tabs = [
    { id: 'personal', label: 'المعلومات الشخصية', icon: User },
    { id: 'licenses', label: 'التراخيص والشهادات', icon: Award },
    { id: 'services', label: 'الخدمات والأسعار', icon: Briefcase },
    { id: 'hours', label: 'ساعات العمل', icon: Clock }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          الملف الشخصي
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          إدارة معلوماتك المهنية وإعداداتك
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex flex-wrap -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'personal' && <ProfileForm />}
          {activeTab === 'licenses' && <LicenseUploader />}
          {activeTab === 'services' && <ServicesManager />}
          {activeTab === 'hours' && <WorkingHours />}
        </div>
      </div>
    </div>
  );
};

export default Profile;

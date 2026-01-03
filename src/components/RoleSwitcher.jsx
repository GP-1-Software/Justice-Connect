import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Check, ChevronDown } from 'lucide-react';
import { supabase } from '../supabaseClient';

const RoleSwitcher = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [roles, setRoles] = useState([]);
    const [currentRole, setCurrentRole] = useState('');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setCurrentRole(userData.user_type || 'client');
            fetchRoles(userData.id_number);
        }
    }, []);

    const fetchRoles = async (idNumber) => {
        try {
            if (!idNumber) return;

            const cleanId = idNumber.replace(/[\s-]/g, '');
            const { data, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('id_number', cleanId);

            if (data) {
                setRoles(data.map(r => r.role));
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const handleSwitchRole = async (newRole) => {
        try {
            if (newRole === currentRole) {
                setIsOpen(false);
                return;
            }

            // Fetch user data for the new role
            let table = 'users';
            if (newRole === 'lawyer') table = 'lawyers';
            if (newRole === 'admin' || newRole === 'super_admin') table = 'admins';
            if (newRole === 'court_clerk') table = 'users';

            const { data: newUserData, error } = await supabase
                .from(table)
                .select('*')
                .eq('id_number', user.id_number)
                .single();

            if (error || !newUserData) {
                console.error('Error switching role:', error);
                return;
            }

            // Update localStorage
            const updatedUser = { ...newUserData, user_type: newRole };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Navigate to appropriate dashboard
            if (newRole === 'client') {
                window.location.href = '/client/dashboard';
            } else if (newRole === 'lawyer') {
                window.location.href = '/lawyer/dashboard';
            } else if (newRole === 'admin' || newRole === 'super_admin') {
                window.location.href = '/admin/dashboard';
            } else if (newRole === 'court_clerk') {
                window.location.href = '/court-clerk/dashboard';
            }

            setIsOpen(false);
        } catch (error) {
            console.error('Switch role error:', error);
        }
    };

    if (roles.length <= 1) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
                <Users className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {currentRole === 'client' ? 'عميل' :
                        currentRole === 'lawyer' ? 'محامي' :
                            currentRole === 'court_clerk' ? 'قلم محكمة' :
                                'مسؤول'}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50">
                    {roles.map((role) => (
                        <button
                            key={role}
                            onClick={() => handleSwitchRole(role)}
                            className="w-full px-4 py-2 text-right flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <span className="text-sm text-gray-700 dark:text-gray-200">
                                {role === 'client' ? 'حساب عميل' :
                                    role === 'lawyer' ? 'حساب محامي' :
                                        role === 'court_clerk' ? 'موظف قلم محكمة' :
                                            role === 'admin' ? 'مسؤول' : 'مسؤول عام'}
                            </span>
                            {currentRole === role && <Check className="h-4 w-4 text-blue-600" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RoleSwitcher;

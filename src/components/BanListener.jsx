import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

/**
 * BanListener - Real-time listener for user ban status
 * Automatically logs out user if they get banned
 */
const BanListener = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) return;

        let userData;
        try {
            userData = JSON.parse(user);
        } catch (e) {
            return;
        }

        const userId = userData.user_id || userData.lawyer_id;
        const userType = userData.user_type;

        if (!userId || !userType) return;

        // Determine which table to listen to
        let table = 'users';
        if (userType === 'lawyer') table = 'lawyers';
        if (userType === 'admin' || userType === 'super_admin') table = 'admins';

        // Subscribe to changes on this user's row
        const channel = supabase
            .channel(`ban-listener-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: table,
                    filter: userType === 'lawyer' ? `lawyer_id=eq.${userId}` : `user_id=eq.${userId}`
                },
                (payload) => {
                    const newData = payload.new;

                    // Check if user was banned
                    if (newData.account_status === 'banned') {
                        // Clear user data
                        localStorage.removeItem('user');
                        localStorage.removeItem('token');

                        // Show ban message
                        const banMessage = newData.ban_reason
                            ? `تم تعليق حسابك.\n\nسبب الحظر: ${newData.ban_reason}\n\nللاستفسار يرجى التواصل مع الدعم الفني:\nالبريد الإلكتروني: ali.odeh.pss@gmail.com\nالهاتف: +972-0592891676`
                            : 'تم تعليق حسابك. للاستفسار يرجى التواصل مع الدعم الفني:\nالبريد الإلكتروني: ali.odeh.pss@gmail.com\nالهاتف: +972-0592891676';

                        toast.error(banMessage, {
                            duration: 10000,
                            style: {
                                whiteSpace: 'pre-line',
                                textAlign: 'right',
                                direction: 'rtl'
                            }
                        });

                        // Redirect to login after a short delay
                        setTimeout(() => {
                            navigate('/login');
                        }, 1000);
                    }
                }
            )
            .subscribe();

        // Cleanup on unmount
        return () => {
            channel.unsubscribe();
        };
    }, [navigate]);

    return null; // This component doesn't render anything
};

export default BanListener;

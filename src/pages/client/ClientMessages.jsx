import { useClientAuth } from '../../hooks/useClientAuth';
import Messages from '../../components/shared/Messages';

const ClientMessages = () => {
    const { user } = useClientAuth();

    if (!user) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-70px)]">
                <p>جاري التحميل...</p>
            </div>
        );
    }

    // Use user.id or user.user_id depending on which is available
    const userId = user.id || user.user_id;

    return <Messages userId={userId} userType="client" />;
};

export default ClientMessages;

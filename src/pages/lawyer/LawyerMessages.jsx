import { useLawyerAuth } from '../../hooks/useLawyerAuth';
import Messages from '../../components/shared/Messages';

const LawyerMessages = () => {
    const { lawyer } = useLawyerAuth();

    if (!lawyer) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-70px)]">
                <p>جاري التحميل...</p>
            </div>
        );
    }

    return <Messages userId={lawyer.lawyer_id} userType="lawyer" />;
};

export default LawyerMessages;

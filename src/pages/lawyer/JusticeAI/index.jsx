import JusticeAIChat from '../../../components/common/JusticeAIChat';

/**
 * Lawyer JusticeAI Page
 * Wrapper component that uses the unified JusticeAIChat with lawyer role
 */
export default function LawyerJusticeAI() {
    return <JusticeAIChat userType="lawyer" />;
}

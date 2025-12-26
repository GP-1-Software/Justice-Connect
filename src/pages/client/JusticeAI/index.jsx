import JusticeAIChat from '../../../components/common/JusticeAIChat';

/**
 * Client JusticeAI Page
 * Wrapper component that uses the unified JusticeAIChat with client role
 */
export default function ClientJusticeAI() {
    return <JusticeAIChat userType="client" />;
}

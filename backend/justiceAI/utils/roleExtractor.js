// backend/justiceAI/utils/roleExtractor.js

// مبدئياً: بنرجّع role ثابت لحد ما تربطه مع Auth حقيقي
export function extractUserRole(authHeader) {
    // TODO لاحقاً: فك JWT من Supabase واخذ role منه
    return {
        userId: null,
        role: "guest", // ممكن تخليها "client" أو "lawyer" حسب الحالة
    };
}

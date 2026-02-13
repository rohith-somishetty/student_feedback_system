import { supabaseAdmin } from '../database.js';

// Verify Supabase auth token and attach user to request
export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        // Verify token with Supabase
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        // Get profile data
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return res.status(403).json({ error: 'User profile not found' });
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: profile.role,
            name: profile.name,
            credibility: profile.credibility
        };
        req.accessToken = token;

        next();
    } catch (err) {
        console.error('Auth error:', err);
        return res.status(403).json({ error: 'Authentication failed' });
    }
};

export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

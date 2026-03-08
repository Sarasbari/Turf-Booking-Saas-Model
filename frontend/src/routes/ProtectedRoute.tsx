import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
    children: ReactNode;
    redirectPath?: string;
}

export function ProtectedRoute({ children, redirectPath = '/sign-in' }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="h-screen w-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>;
    }

    if (!user) {
        return <Navigate to={redirectPath} state={{ from: location }} replace />;
    }

    return <>{children}</>;
}

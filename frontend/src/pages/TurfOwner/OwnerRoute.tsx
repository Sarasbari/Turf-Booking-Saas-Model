/**
 * OwnerRoute
 *
 * Protects TurfOwner routes by verifying the user is authenticated
 * and has their Firestore user document `role` set to "owner".
 */

import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { auth, db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

const OwnerRoute: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const location = useLocation();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                try {
                    // Check role in users collection
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));

                    // Also check owners collection as fallback for legacy data
                    const ownerDoc = await getDoc(doc(db, 'owners', currentUser.uid));

                    if ((userDoc.exists() && userDoc.data().role === 'owner') || ownerDoc.exists()) {
                        setIsOwner(true);
                    } else {
                        setIsOwner(false);
                    }
                } catch (err) {
                    console.error('Error checking owner role:', err);
                    setIsOwner(false);
                }
            } else {
                setIsOwner(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-100 border-t-orange-600"></div>
                    <p className="text-sm font-medium text-gray-500">Verifying access...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        // Save intended destination for post-login redirect
        return <Navigate to="/sign-in" state={{ from: location }} replace />;
    }

    if (!isOwner) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Add layout wrapper here if we want sidebar across all owner pages
    return (
        <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
            {/* Sidebar could go here, for now just rendering children */}
            <div className="flex-1">
                <Outlet />
            </div>
        </div>
    );
};

export default OwnerRoute;

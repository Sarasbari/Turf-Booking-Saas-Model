import { useState } from 'react';
import { db } from '../../services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface NotifyMePopupProps {
  turfId: string;
  turfName: string;
  onClose: () => void;
}

export function NotifyMePopup({ turfId, turfName, onClose }: NotifyMePopupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setStatus('loading');
      // Write to Firestore: notifyRequests/{turfId}/emails/{email}
      const emailDocRef = doc(db, 'notifyRequests', turfId, 'emails', email);
      
      await setDoc(emailDocRef, {
        email,
        turfId,
        turfName,
        createdAt: serverTimestamp()
      });

      setStatus('success');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error saving notification request:', error);
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              🔔 Get Notified
            </h3>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {status === 'success' ? (
            <div className="py-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                ✓
              </div>
              <p className="text-gray-900 font-medium text-lg">We'll notify you!</p>
              <p className="text-gray-500 text-sm mt-1">Keep an eye on your inbox.</p>
            </div>
          ) : (
            <>
              <p className="text-gray-600 text-sm mb-6">
                We'll email you when <span className="font-semibold text-gray-900">{turfName}</span> goes live!
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === 'loading'}
                  />
                </div>
                
                {status === 'error' && (
                  <p className="text-red-500 text-sm text-center">Something went wrong. Please try again.</p>
                )}
                
                <button
                  type="submit"
                  disabled={status === 'loading' || !email}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center gap-2"
                >
                  {status === 'loading' ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Notify Me →'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

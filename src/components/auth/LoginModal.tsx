import { GoogleLogin } from '@react-oauth/google';
import { Shield, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LoginModalProps {
    onSuccess: (credentialResponse: any) => void;
    onError: () => void;
    onClose: () => void;
    nonce: string;
    isOpen?: boolean;
}

const LoginModal: React.FC<LoginModalProps> = ({ onSuccess, onError, onClose, nonce, isOpen = true }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Small delay for smooth entrance animation
            const timer = setTimeout(() => setIsVisible(true), 10);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    const handleClose = () => {
        setIsVisible(false);
        // Delay actual close to allow exit animation
        setTimeout(onClose, 200);
    };

    const handleSuccess = (credentialResponse: any) => {
        setIsLoading(true);
        onSuccess(credentialResponse);
    };

    const handleError = () => {
        setIsLoading(false);
        onError();
    };

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out ${
                isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none'
            }`}
            onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
            {/* Modal Container */}
            <div
                className={`relative w-full max-w-md transform transition-all duration-300 ease-out ${
                    isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-8 scale-95 opacity-0'
                }`}
            >
                {/* Background with glassmorphism effect */}
                <div className="absolute inset-0 rounded-2xl bg-white/90 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl" />

                {/* Gradient accent */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 opacity-20 blur-lg" />

                {/* Content */}
                <div className="relative rounded-2xl bg-white/80 p-8 backdrop-blur-xl">
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="absolute top-4 right-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                        aria-label="Close modal"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    {/* Header */}
                    <div className="mb-8 text-center">
                        {/* Icon */}
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                            <Sparkles className="h-8 w-8 text-white" />
                        </div>

                        {/* Title */}
                        <h2 className="mb-2 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-2xl font-bold text-transparent">
                            Selamat Datang
                        </h2>

                        {/* Subtitle */}
                        <p className="mx-auto max-w-sm text-sm leading-relaxed text-gray-600">
                            Masuk dengan akun Google Anda untuk mendapatkan akses penuh ke semua fitur
                        </p>
                    </div>

                    {/* Login Section */}
                    <div className="space-y-6">
                        {/* Security Badge */}
                        <div className="flex items-center justify-center space-x-2 rounded-lg bg-green-50 px-4 py-2 text-sm">
                            <Shield className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-700">Login aman dengan enkripsi end-to-end</span>
                        </div>

                        {/* Google Login Button Container */}
                        <div className="flex justify-center">
                            <div
                                className={`transition-opacity duration-200 ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
                            >
                                <GoogleLogin
                                    nonce={nonce}
                                    onSuccess={handleSuccess}
                                    onError={handleError}
                                    useOneTap={false}
                                    size="large"
                                    width={280}
                                    logo_alignment="left"
                                />
                            </div>
                        </div>

                        {/* Loading State */}
                        {isLoading && (
                            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                                <span>Memproses login...</span>
                            </div>
                        )}

                        {/* Features List */}
                        <div className="mt-8 space-y-3">
                            <p className="text-center text-xs font-semibold tracking-wide text-gray-500 uppercase">
                                Yang akan Anda dapatkan:
                            </p>
                            <div className="grid grid-cols-1 gap-2 text-sm">
                                {[
                                    'Notifikasi push real-time',
                                    'Sinkronisasi data di semua perangkat',
                                    'Pengalaman yang dipersonalisasi',
                                ].map((feature, index) => (
                                    <div key={index} className="flex items-center space-x-3 text-gray-600">
                                        <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Privacy Notice */}
                        <div className="mt-6 rounded-lg bg-gray-50 p-4 text-center">
                            <p className="text-xs leading-relaxed text-gray-500">
                                Dengan masuk, Anda menyetujui{' '}
                                <button className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800">
                                    Kebijakan Privasi
                                </button>{' '}
                                dan{' '}
                                <button className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800">
                                    Syarat Layanan
                                </button>{' '}
                                kami.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;

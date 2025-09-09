import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import { Shield, Sparkles, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface LoginModalProps {
    onSuccess: (credentialResponse: CredentialResponse) => void;
    onError: () => void;
    onClose: () => void;
    nonce: string;
    isOpen?: boolean;
}

const LoginModal: React.FC<LoginModalProps> = ({ onSuccess, onError, onClose, nonce, isOpen = true }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleClose = useCallback(() => {
        setIsVisible(false);
        // Delay actual close to allow exit animation
        setTimeout(onClose, 200);
    }, [onClose]);

    const handleSuccess = useCallback(
        (credentialResponse: CredentialResponse) => {
            setIsLoading(true);
            onSuccess(credentialResponse);
        },
        [onSuccess],
    );

    const handleError = useCallback(() => {
        setIsLoading(false);
        onError();
    }, [onError]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => {
                document.removeEventListener('keydown', handleEscape);
            };
        }
    }, [isOpen, handleClose]);

    // Handle outside click
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleBackdropClick}
        >
            <div className="relative mx-4 w-full max-w-md transform rounded-xl bg-white p-6 transition-all duration-200 ease-in-out dark:bg-gray-800">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    disabled={isLoading}
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Sign in to continue to your account</p>
                </div>

                <div className="mt-6">
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={handleError}
                        nonce={nonce}
                        useOneTap={false}
                        auto_select={false}
                        text="signin_with"
                        shape="pill"
                        theme="outline"
                        size="large"
                        width="100%"
                        logo_alignment="center"
                    />
                </div>

                <div className="mt-6 flex items-center justify-center">
                    <div className="flex items-center">
                        <Sparkles className="mr-1 h-4 w-4 text-yellow-500" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Secure login powered by Google</span>
                    </div>
                </div>

                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 dark:bg-gray-800/80">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginModal;

import { GoogleLogin } from '@react-oauth/google';
import { Shield } from 'lucide-react';
import { useState } from 'react';
import YonLogo from '../yon-logo';

interface LoginCardProps {
    onSuccess: (credentialResponse: any) => void;
    onError: () => void;
    nonce: string;
}

const LoginCard: React.FC<LoginCardProps> = ({ onSuccess, onError, nonce }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleSuccess = (credentialResponse: any) => {
        setIsLoading(true);
        onSuccess(credentialResponse);
    };

    const handleError = () => {
        setIsLoading(false);
        onError();
    };

    return (
        <div className="relative mx-auto mt-20 w-full max-w-md">
            {/* Background dengan glass effect */}
            <div className="absolute inset-0 rounded-2xl bg-white/90 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl" />
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 opacity-20 blur-lg" />

            {/* Content */}
            <div className="relative rounded-2xl bg-white/80 p-8 backdrop-blur-xl">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-6 flex w-full items-center justify-center gap-2">
                        <div className="flex aspect-square size-12">
                            <YonLogo className="fill-primary" />
                        </div>

                        <div className="flex grid text-left text-sm leading-tight">
                            <span className="truncate font-medium">Yonsense</span>
                            <span className="truncate text-xs">Top PWA Starter</span>
                        </div>
                    </div>
                    <h2 className="mb-2 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-2xl font-bold text-transparent">
                        Selamat Datang
                    </h2>
                    <p className="mx-auto max-w-sm text-sm leading-relaxed text-gray-600">
                        Masuk dengan akun Google Anda untuk mendapatkan akses penuh ke semua fitur
                    </p>
                </div>

                {/* Login Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-center space-x-2 rounded-lg bg-green-50 px-4 py-2 text-sm">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-700">Login aman dengan enkripsi end-to-end</span>
                    </div>

                    <div className="flex justify-center">
                        <div
                            className={`transition-opacity duration-200 ${
                                isLoading ? 'pointer-events-none opacity-50' : ''
                            }`}
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

                    {isLoading && (
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                            <span>Memproses login...</span>
                        </div>
                    )}

                    {/* Privacy */}
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
    );
};

export default LoginCard;

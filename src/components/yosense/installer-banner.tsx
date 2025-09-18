'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Download, Smartphone, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const InstallBanner = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const dismissedAt = localStorage.getItem('pwa_dismissed_at');
        if (dismissedAt) {
            const diff = Date.now() - parseInt(dismissedAt, 10);
            if (diff < 24 * 60 * 60 * 1000) return; // 1 hari cooldown
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        window.addEventListener('appinstalled', () => {
            setShowPrompt(false);
            setDeferredPrompt(null);
            localStorage.removeItem('pwa_dismissed_at');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowPrompt(false);
        } else {
            localStorage.setItem('pwa_dismissed_at', Date.now().toString());
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        localStorage.setItem('pwa_dismissed_at', Date.now().toString());
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center p-4">
            {/* Minimal backdrop */}
            <div
                className="bg-background/20 pointer-events-auto absolute inset-0 backdrop-blur-[1px]"
                onClick={handleDismiss}
            />

            {/* Main banner */}
            <div className="animate-in slide-in-from-bottom-8 fade-in pointer-events-auto relative w-full max-w-sm transform transition-all duration-700 ease-out">
                <Card className="bg-background/95 relative overflow-hidden border-0 shadow-lg backdrop-blur-sm">
                    {/* Accent line */}
                    <div className="bg-primary absolute top-0 right-0 left-0 h-[2px]" />

                    {/* Close button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDismiss}
                        className="hover:bg-accent absolute top-4 right-4 h-8 w-8 rounded-none"
                    >
                        <X className="h-4 w-4" />
                    </Button>

                    <CardContent className="px-6 pt-8 pb-6">
                        {/* Header section */}
                        <div className="mb-8">
                            {/* App identifier */}
                            <div className="mb-4 flex items-center gap-3">
                                <div className="bg-primary flex h-12 w-12 items-center justify-center">
                                    <span className="text-primary-foreground font-mono text-xl font-bold">Y</span>
                                </div>
                                <div className="flex-1">
                                    <Badge variant="outline" className="mb-2 font-mono text-[10px] tracking-wider">
                                        PWA READY
                                    </Badge>
                                    <h2 className="text-foreground font-mono text-lg leading-none font-bold tracking-tight">
                                        YONSENSE
                                    </h2>
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                                Install aplikasi untuk akses
                                <br />
                                yang lebih cepat dan efisien
                            </p>
                        </div>

                        {/* Features grid */}
                        <div className="mb-8 grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="text-muted-foreground/60 font-mono text-[10px] font-bold tracking-widest">
                                    BENEFITS
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-accent-foreground h-1 w-1" />
                                        <span className="text-foreground/80 font-mono text-xs">Native experience</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="bg-accent-foreground h-1 w-1" />
                                        <span className="text-foreground/80 font-mono text-xs">Offline access</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-muted-foreground/60 font-mono text-[10px] font-bold tracking-widest">
                                    SIZE
                                </div>
                                <div className="text-foreground font-mono text-2xl leading-none font-bold">~2MB</div>
                                <div className="text-muted-foreground font-mono text-xs">Instant loading</div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="space-y-3">
                            <Button
                                onClick={handleInstall}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 w-full rounded-none font-mono font-bold tracking-wide transition-all duration-200 disabled:opacity-70"
                            >
                                <div className="flex items-center gap-3">
                                    <Download className="h-4 w-4" />
                                    <span>INSTALL APP</span>
                                    <ArrowRight className="h-4 w-4" />
                                </div>
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handleDismiss}
                                className="hover:bg-accent hover:text-accent-foreground h-10 w-full rounded-none font-mono text-sm tracking-wide"
                            >
                                MAYBE LATER
                            </Button>
                        </div>

                        {/* Footer info */}
                        <div className="border-border mt-6 border-t pt-4">
                            <div className="text-muted-foreground/60 flex items-center justify-between font-mono text-[10px] tracking-wider">
                                <span>NO ADS • SECURE</span>
                                <div className="flex items-center gap-1">
                                    <Smartphone className="h-3 w-3" />
                                    <span>MOBILE OPTIMIZED</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default InstallBanner;

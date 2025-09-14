import YonLogo from '@/components/yosense/yon-logo';

export default function Home() {
    return (
        <div className="container mx-auto flex h-screen justify-center">
            <div className="animate flex animate-pulse items-center">
                <div className="flex aspect-square size-12 items-center rounded-lg">
                    <YonLogo className="fill-primary" />
                </div>

                <div className="ml-2 grid flex-col text-left text-sm leading-tight">
                    <span className="truncate font-bold">Yonsense</span>
                    <span className="truncate text-xs">Top PWA Starter</span>
                </div>
            </div>
        </div>
    );
}

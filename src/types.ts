// Types
interface JWTPayload {
    given_name: string;
    family_name: string;
    email: string;
    picture?: string;
    name: string;
}

interface AuthUser {
    id: string;
    email: string;
    [key: string]: any;
}

interface Profile {
    id: string;
    userId: string;
    displayName: string;
    picture: string;
    email: string;
    createdAt: string;
    updatedAt: string;
}

interface AuthContextType {
    login: () => void;
    logout: () => void;
}

interface AuthProviderProps {
    children: React.ReactNode;
}

interface ProfileUpdate {
    displayName?: string;
    picture?: string;
}

import { WebSocket } from 'ws';

export enum CoreEvents {
    USER_REGISTERED = 'core_user_registered',
    USER_DELETED = 'core_user_deleted',
    USER_LOGIN = 'core_user_login'
}

export interface CreateEventData {
    id: string;
    name: string;
    public?: boolean;
}

export interface RegisterEventData {
    id: string;
}

export interface SubmitEventData {
    id: string;
    data: any;
}

export interface RegisterUserData {
    username: string;
    password: string;
}

export interface Message<T> {
    type: "create" | "register" | "submit" | "register_user" | "login_user" | "message";
    data: T;
    tokens?: {
        accessToken: string;
        refreshToken: string;
    };
}

export interface EventData {
    name: string;
    creator: WebSocket | null;
    clients: Set<WebSocket>;
    public: boolean;
}

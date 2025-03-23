import { useSearchParams } from "react-router";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { usePost } from "@/hooks/use-post";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LoginFormValues {
    username: string;
    password: string;
}

interface LoginResponse {
    type: string;
    username: string;
    user_id: string;
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
    expiry: {
        accessToken: number;
        refreshToken: number;
    }
}

const loginSchema = z.object({
    username: z.string().min(1, "Username est requis"),
    password: z.string().min(1, "Password est requis"),
});


const ExternalLogin: React.FC = () => {
    const [searchParams] = useSearchParams();

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    const { mutate: login, data } = usePost<LoginFormValues, LoginResponse>({
        url: "/api/auth/login",
        onSuccess: () => {
            if (!data || !data.tokens) return;
            const accessToken = data.tokens.accessToken;
            const refreshToken = data.tokens.refreshToken;

            const userId = data.user_id;

            const accessExpiry = data.expiry.accessToken;
            const refreshExpiry = data.expiry.refreshToken;

            const redirectToParam = searchParams.get('redirect_to');
            const redirectTo = redirectToParam ? decodeURIComponent(redirectToParam) : "";
            window.location.href = `${redirectTo}/login?access_token=${accessToken}&refresh_token=${refreshToken}&access_expiry=${accessExpiry}&refresh_expiry=${refreshExpiry}&user_id=${userId}`;
        },
        onError: () => {
        },
    });


    const handleSubmit = (values: LoginFormValues) => {
        login(values);
    };

    return (
        <section className="flex flex-row items-center justify-evenly min-h-screen p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter username" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="Enter password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full">
                                Se connecter
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </section>
    );
};

export default ExternalLogin;

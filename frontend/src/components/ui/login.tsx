import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { usePost } from "@/hooks/use-post";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const loginSchema = z.object({
    username: z.string().min(1, "Username est requis"),
    password: z.string().min(1, "Password est requis"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
    const [message, setMessage] = useState<string>('');

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    const { mutate: login, isLoading } = usePost<LoginFormValues, unknown>({
        url: "/api/auth/login",
        onSuccess: () => {
            setMessage("Login réussi !");
            toast.success("Login réussi !");
        },
        onError: () => {
            setMessage("Login échoué.");
            toast.error("Login échoué.");
        },
    });

    const onSubmit = (values: LoginFormValues) => {
        login(values);
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Connexion en cours..." : "Se connecter"}
                        </Button>
                    </form>
                </Form>
                {message && <p className="mt-4 text-center">{message}</p>}
            </CardContent>
        </Card>
    );
};

export default Login;

import React from 'react';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { useGet } from "@/hooks/use-get"
import { usePost } from "@/hooks/use-post"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const userSchema = z.object({
    username: z.string().min(3, {
        message: "Username must be at least 3 characters.",
    }),
    password: z.string().min(6, {
        message: "Password must be at least 6 characters.",
    }),
})

type UserFormValues = z.infer<typeof userSchema>

interface User {
    username: string
    password?: string
}

const Register: React.FC = () => {
    const {
        refetch: refetchUsers,
    } = useGet<User[]>({
        url: "/api/auth/accounts",
    })

    const { mutate: registerUser, isLoading: isRegistering } = usePost<UserFormValues, User>({
        url: "/api/auth/register",
        onSuccess: () => {
            form.reset()
            refetchUsers()
            toast.success("User added successfully")
        },
        onError: (error) => {
            toast.error(error.message)
        },
    })

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    })

    const onSubmit = async (values: UserFormValues) => {
        try {
            await registerUser(values)
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">Register</CardTitle>
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

                        <Button type="submit" className="w-full" disabled={isRegistering}>
                            {isRegistering ? "Adding..." : "Add User"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

export default Register;
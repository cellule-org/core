"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"


import { useGet } from "@/hooks/use-get"
import { usePost } from "@/hooks/use-post"

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

export default function UserAccounts() {
  const {
    data: users = [],
    isLoading: isLoadingUsers,
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
    <section className="flex flex-row items-center justify-between min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">User Accounts</CardTitle>
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
      <Card className="w-full max-w-md mt-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <p>Loading users...</p>
          ) : (
            <ul className="space-y-2">
              {users.map((user) => (
                <li key={user.username} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                  <span>{user.username}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  )
}


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGet } from "@/hooks/use-get"

interface User {
    username: string
    password?: string
}

export default function UserAccounts() {
    const {
        data: users = [],
        isLoading: isLoadingUsers,
    } = useGet<User[]>({
        url: "/api/auth/accounts",
    })

    return (
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
    )
}
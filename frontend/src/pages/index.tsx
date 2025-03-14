import Login from "@/components/ui/login";
import Register from "@/components/ui/register";
import UserAccounts from "@/components/ui/user-list";

export default function Index() {
  return (
    <section className="flex flex-row items-center justify-evenly min-h-screen p-4">
      <Register />
      <Login />
      <UserAccounts />
    </section>
  )
}


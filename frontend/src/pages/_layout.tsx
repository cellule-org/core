import { Toaster } from "@/components/ui/sonner"
import { ReactNode } from "react"

export default function RootLayout({ children }: { children: ReactNode }) {
    console.log("RootLayout")
    return (
        <>
            <main>{children}</main>
            <Toaster />
        </>
    )
}

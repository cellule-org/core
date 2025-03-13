import { useState, useEffect } from 'react'

interface UseGetOptions<T> {
    url: string
    initialData?: T
    enabled?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
}

export function useGet<T>({
    url,
    initialData,
    enabled = true,
    onSuccess,
    onError
}: UseGetOptions<T>) {
    const [data, setData] = useState<T | undefined>(initialData)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<Error | null>(null)

    const fetchData = async () => {
        if (!enabled) return

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch(url)

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const result = await response.json()
            setData(result)
            onSuccess?.(result)
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))
            setError(error)
            onError?.(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [url, enabled])

    return {
        data,
        isLoading,
        error,
        refetch: fetchData
    }
}

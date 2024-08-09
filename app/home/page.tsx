'use client'

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessLevel } from "@prisma/client";

export default function HOMEPAGE() {
    const {status, data} = useSession();
    const router = useRouter();
    const [accessLevels, setAccessLevels] = useState<AccessLevel[]>([]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchAccessLevels();
        } else if (status === 'unauthenticated') {
            console.log('User is not authenticated, redirecting to login...');
            router.push('/login');
        }
    }, [status, data]);

    const fetchAccessLevels = async () => {
        try {
            const response : any = await fetch('/api/accessLevels', {
                cache: 'no-cache'
            }).then(response => response.json());

            setAccessLevels(response.accessLevel);
        } catch (error) {
            console.error('Failed to fetch access levels:', error);
        }
    }

    return (
        <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl mt-20">
                    <h1 className="text-2xl font-bold text-center">Choose the file you want to edit!</h1>
                    <div className="mt-14 flex justify-center flex-wrap gap-8">
                        {accessLevels.map((accessLevel) => {
                            if (accessLevel.page.toLowerCase() == 'main') {
                                return (
                                    <button className="border rounded-lg p-4 text-lg bg-slate-100 hover:bg-gray-400" onClick={() => router.push("http://localhost:3000/main-list")}>
                                        Main Price List
                                    </button>
                                )
                            }


                            return (
                                <button className="border rounded-lg p-4 text-lg bg-slate-100 hover:bg-gray-400" onClick={() => router.push("http://localhost:3000/countries/" + accessLevel.page)}>
                                    Prices for {accessLevel.page}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </>
    )
}
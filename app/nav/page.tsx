'use client'

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AccessLevel } from "@prisma/client";

export default function Nav() {

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
        <div className="flex justify-center items-center h-20 bg-gray-800 text-white">
            <div className="flex justify-between gap-6">
                <div>
                    <Link className="hover:text-white/50" href={`http://localhost:3000/home`}>
                        Home
                    </Link>
                </div>
                {accessLevels && accessLevels.length > 0 && accessLevels.map((accessLevel) => {
                    if (accessLevel.page.toLowerCase() == 'main') {
                        return (
                            <div>
                                <Link className="hover:text-white/50" href={`http://localhost:3000/main-list`}>
                                    Main Price List
                                </Link>
                            </div> 
                        )
                    }

                    return (
                        <div>
                            <Link className="hover:text-white/50" href={`http://localhost:3000/countries/${accessLevel.page}`}>
                                Prices for {accessLevel.page}
                            </Link>
                        </div>
                    )
                })}
            </div>
        </div>
    )

}
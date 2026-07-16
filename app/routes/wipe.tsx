import { useEffect } from "react";
import { useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

export default function Wipe() {
    const { kv } = usePuterStore();
    const navigate = useNavigate();
    
    useEffect(() => {
        kv.flush().then(() => navigate('/'));
    }, [kv, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-2xl text-gray-500 font-semibold animate-pulse">
                Wiping data...
            </div>
        </div>
    );
}

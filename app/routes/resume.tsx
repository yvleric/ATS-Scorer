import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import Navbar from "~/components/Navbar";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";

export default function ResumeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { kv, fs } = usePuterStore();
    const [resume, setResume] = useState<Resume | null>(null);
    const [error, setError] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            try {
                const data = await kv.get(id);
                if (data) {
                    const parsed = JSON.parse(data) as Resume;
                    setResume(parsed);
                    const blob = await fs.read(parsed.imagePath);
                    if (blob) setResumeUrl(URL.createObjectURL(blob));
                } else {
                    setError('Resume not found');
                }
            } catch (err) {
                setError('Failed to load resume');
                console.error(err);
            }
        }
        load();
    }, [id, kv, fs]);

    if (error) return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />
            <div className="p-8 text-center text-red-500 font-bold text-xl">{error}</div>
        </main>
    );

    if (!resume) return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />
            <div className="p-8 text-center text-xl mt-20">Loading results...</div>
        </main>
    );

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                        <h2 className="text-2xl font-bold">{resume.companyName || 'Unknown Company'}</h2>
                        <h3 className="text-gray-500 text-lg">{resume.jobTitle || 'Unknown Job Title'}</h3>
                    </div>
                    {resumeUrl && (
                        <div className="gradient-border">
                            <img src={resumeUrl} alt="Resume" className="w-full rounded-xl object-contain bg-white" />
                        </div>
                    )}
                </div>
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <ATS score={resume.feedback.ATS.score} suggestions={resume.feedback.ATS.tips} />
                    <Summary feedback={resume.feedback} />
                    <Details feedback={resume.feedback} />
                </div>
            </div>
        </main>
    )
}

import { type FormEvent, useState } from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import { convertPdfToImage } from '~/lib/pdf2img';
import { useNavigate, type NavigateFunction } from 'react-router';
import { usePuterStore } from '~/lib/puter';
import { prepareInstructions } from '../../constants';
import { generateUUID } from '~/lib/utils';

const Upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate: NavigateFunction = useNavigate();
    const [isProcessing, setProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect: (file: File | null) => void = (file: File | null) => {
        setFile(file);
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File }) => {
        setProcessing(true);
        setStatusText('Uploading the file...');

        const uploadedFile = await fs.upload([file]);
        if (!uploadedFile) {
            setStatusText('Error: Failed to upload file');
            return;
        }

        setStatusText('Converting to image...');
        const imageFile = await convertPdfToImage(file);
        if (!imageFile.file) {
            setStatusText('Error: Failed to convert PDF to image');
            return;
        }
        setStatusText('Uploading the image...');
        const finalImageFile = await fs.upload([imageFile.file]);
        if (finalImageFile && finalImageFile.path) {
            setStatusText('Analyzing your resume with AI...');
            const message = prepareInstructions({ jobTitle, jobDescription });
            const response = await ai.feedback(finalImageFile.path, message);
            if (response && response.message && response.message.content) {
                let content = response.message.content as string;
                if (Array.isArray(content)) {
                    content = content.map(c => typeof c === 'string' ? c : c.text || '').join('\n');
                }
                
                try {
                    const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
                    const feedback = JSON.parse(jsonStr);
                    
                    const id = generateUUID();
                    const newResume: Resume = {
                        id,
                        companyName,
                        jobTitle,
                        imagePath: finalImageFile.path,
                        resumePath: uploadedFile.path,
                        feedback
                    };
                    
                    await kv.set(id, JSON.stringify(newResume));
                    navigate(`/resume/${id}`);
                } catch(e) {
                    setStatusText('Error: Failed to parse AI response');
                    console.error(e, content);
                    setProcessing(false);
                }
            } else {
                setStatusText('Error: Failed to analyze resume');
                setProcessing(false);
            }
        } else {
            setStatusText('Error: Failed to upload image to Puter');
            setProcessing(false);
        }
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if (!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        if (!file) return;

        handleAnalyze({ companyName, jobTitle, jobDescription, file });
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />

            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart feedback for your dream job</h1>
                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>
                            <img src="/images/resume-scan.gif" className="w-full max-w-md" />
                        </>
                    ) : (
                        <h2>Drop your resume for an ATS score and improvement tips</h2>
                    )}
                    {!isProcessing && (
                        <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8 w-full max-w-2xl mx-auto">
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input type="text" name="company-name" placeholder="Company Name" id="company-name" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input type="text" name="job-title" placeholder="Job Title" id="job-title" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea rows={5} name="job-description" placeholder="Job Description" id="job-description" />
                            </div>
                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect} />
                            </div>


                            <button className="primary-button" type="submit">
                                Analyze Resume
                            </button>
                        </form>
                    )}
                </div>
            </section >
        </main >
    );
};

export default Upload;
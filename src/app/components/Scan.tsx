'use client';
import React, { ReactNode, useState, useRef } from 'react';
interface ScanProps {
    content: ReactNode;
}

export default function Scan(props: ScanProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream>();
    const [photoData, setPhotoData] = useState<string>();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const linkRef = useRef<HTMLAnchorElement>(null);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            alert('无法访问摄像头: ' + err);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        canvasRef.current.getContext('2d')?.drawImage(videoRef.current, 0, 0);
        
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setPhotoData(dataUrl);
        
        if (linkRef.current) {
            linkRef.current.download = 'photo.jpg';
            linkRef.current.href = dataUrl;
            linkRef.current.click();
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-w-[400px] aspect-video bg-gray-100 rounded-lg"
            />
            
            {!stream ? (
                <button 
                    onClick={startCamera}
                    className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
                >
                    {props.content}
                </button>
            ) : (
                <div className="flex gap-4">
                    <button
                        onClick={capturePhoto}
                        className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-green-600 text-white gap-2 hover:bg-green-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
                    >
                        拍照
                    </button>
                    <button
                        onClick={() => setStream(undefined)}
                        className="rounded-full border border-solid border-gray-300 transition-colors flex items-center justify-center bg-red-600 text-white gap-2 hover:bg-red-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
                    >
                        关闭
                    </button>
                </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
            <a ref={linkRef} className="hidden" />
        </div>
    );
}
'use client';
import React, { ReactNode, useState, useRef, useEffect } from 'react';
import PhotoEditor from './PhotoEditor';
interface ScanProps {
    content: ReactNode;
}

export default function Scan(props: ScanProps) {

    // 初始化vConsole
    useEffect(() => {
        const setupVConsole = async () => {
            // 增加开发环境判断日志
            console.log('当前环境:', process.env.NODE_ENV);

            if (process.env.NODE_ENV === 'development') {
                try {
                    const VConsole = (await import('vconsole')).default;
                    new VConsole({
                        onReady: () => console.log('vConsole 初始化完成'),
                        onClearLog: () => console.log('日志被清除')
                    });
                    // 增加测试日志
                    console.log('vConsole 已激活');
                } catch (e) {
                    console.error('vConsole 加载失败:', e);
                }
            }
        };
        setupVConsole();
    }, []);

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
        handleCapture(dataUrl);

        if (linkRef.current) {
            linkRef.current.download = 'photo.jpg';
            linkRef.current.href = dataUrl;
            linkRef.current.click();
        }
    };

    // 在组件卸载时关闭摄像头
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    // 在现有代码中添加状态和编辑处理逻辑
    const [capturedImage, setCapturedImage] = React.useState<string>("");
    const [isEditing, setIsEditing] = React.useState(false);

    // 拍照后
    const handleCapture = (imageSrc: string) => {
      setCapturedImage(imageSrc);
      setIsEditing(true);
    };

    // 保存编辑后的图片
    const handleSaveEditedImage = (editedImage: string) => {
      // TODO 处理保存逻辑
      setIsEditing(false);
    };

    return (
        <div className="flex flex-col gap-4 p-4">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-w-full md:max-w-[400px] aspect-video bg-gray-100 rounded-lg"
            />

            {isEditing && (
                <PhotoEditor
                    image={capturedImage}
                    onSave={handleSaveEditedImage}
                    onCancel={() => setIsEditing(false)}
                />
            )}

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
                        className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-green-600 text-white gap-2 hover:bg-green-700 font-medium text-base md:text-lg h-12 md:h-14 px-5 md:px-6"
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
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

    // 新增摄像头方向状态
    const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("environment");
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream>();
    const [testingOn, setTestingOn] = useState<boolean>();
    const [photoData, setPhotoData] = useState<string>();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const linkRef = useRef<HTMLAnchorElement>(null);
    // 新增摄像头状态
    const [isCameraOn, setIsCameraOn] = useState(false);

    // 修改后的摄像头启动逻辑

    // 修改后的摄像头启动逻辑
    const startCamera = async (facingMode: "user" | "environment" = cameraFacingMode) => {
        try {
            // 先停止已有摄像头
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            setStream(mediaStream);
            setIsCameraOn(true);
            if (videoRef.current) {
                console.log('media stream:', mediaStream);
                videoRef.current.srcObject = mediaStream;
                // 添加静音属性解决自动播放限制
                videoRef.current.muted = true;
                videoRef.current.play();
                // 添加视频加载完成处理
                videoRef.current.onloadedmetadata = async () => {
                    try {
                        await videoRef.current?.play();
                        console.log('视频开始播放');
                    } catch (error) {
                        console.error('视频播放失败:', error);
                    }
                };
            }
        } catch (err) {
            console.error('摄像头访问错误:', err);
            // 夸克浏览器需要使用HTTPS协议访问摄像头，否则可能会报错，导致加载不了摄像头
            alert('无法访问摄像头: ' + (err as Error).message);
        }
    };

    // 新增切换摄像头方法
    const switchCamera = async () => {
        const newFacingMode = cameraFacingMode === "environment" ? "user" : "environment";
        setCameraFacingMode(newFacingMode);
        await startCamera(newFacingMode);
    };

    // 新增关闭摄像头方法
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(undefined);
            setIsCameraOn(false);

            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }
    };

    const onToggleCamera = () => {
        if (isCameraOn) {
            stopCamera();
        } else {
            startCamera();
        }
    }

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        canvasRef.current.getContext('2d')?.drawImage(videoRef.current, 0, 0);

        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setPhotoData(dataUrl);
        handleCapture(dataUrl);

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

        // // TODO 这里为什么要跳页面? 点击了也不能下载当前图片
        // if (linkRef.current) {
        //     linkRef.current.download = 'photo.jpg';
        //     linkRef.current.href = editedImage;
        //     linkRef.current.click();
        // }
    };

    // 开始测试
    const startTesting = () => {
        setTestingOn(true);
    };

    return (
        <div className="flex flex-col gap-4 p-4">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-w-full md:max-w-[400px] aspect-video bg-gray-100 rounded-lg"
                style={{ transform: cameraFacingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />

            {isEditing && (
                <PhotoEditor
                    image={capturedImage}
                    onSave={handleSaveEditedImage}
                    onCancel={() => setIsEditing(false)}
                />
            )}

            {!testingOn ? (
                <button
                    onClick={startTesting}
                    className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
                >
                    {props.content}
                </button>
            ) : (
                <div className="flex gap-4 flex-col">
                    <div className="flex gap-4">
                        {stream && <button
                            onClick={capturePhoto}
                            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-green-600 text-white gap-2 hover:bg-green-700 font-medium text-base md:text-lg h-12 md:h-14 px-5 md:px-6"
                        >
                            拍照
                        </button>}

                        <button
                            onClick={onToggleCamera}
                            className="rounded-full border border-solid border-gray-300 transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
                        >
                            {isCameraOn ? '关闭摄像头' : '打开摄像头'}
                        </button>

                        {stream && <button
                            onClick={switchCamera}
                            className="rounded-full border border-solid border-gray-300 transition-colors flex items-center justify-center bg-purple-600 text-white gap-2 hover:bg-purple-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
                        >
                            {cameraFacingMode === 'environment' ? '切换前置摄像头' : '切换后置摄像头'}
                        </button>}
                    </div>
                    <button
                        onClick={() => {
                            stopCamera();
                            setTestingOn(false);
                        }}
                        className="rounded-full border border-solid border-gray-300 transition-colors flex items-center justify-center bg-red-600 text-white gap-2 hover:bg-red-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
                    >
                        完全退出
                    </button>
                </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
            <a ref={linkRef} className="hidden" />
        </div>
    );
}
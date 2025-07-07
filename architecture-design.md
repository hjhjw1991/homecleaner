# "家用保洁"App NextJS代码模块设计

基于需求文档，我设计了以下NextJS架构，采用模块化组织方式，符合React最佳实践：

## 一、项目结构
home-cleaning-app/
├── components/            # 可复用组件
│   ├── atoms/             # 基础UI组件
│   ├── molecules/         # 复合组件
│   ├── organisms/         # 页面区块
│   └── templates/         # 页面模板
│
├── pages/                 # 页面路由
│   ├── api/               # API路由
│   ├── auth/              # 认证页面
│   ├── home/              # 主页
│   ├── tasks/             # 任务管理
│   ├── planner/           # 清洁计划
│   ├── knowledge/         # 清洁知识库
│   ├── community/         # 社区模块
│   └── shop/              # 商城模块
│
├── services/              # 服务层
│   ├── api/               # API服务
│   ├── auth/              # 认证服务
│   ├── recognition/       # 多模态识别服务
│   ├── task/              # 任务管理服务
│   ├── knowledge/         # 知识库服务
│   └── shop/              # 商城服务
│
├── stores/                # 状态管理
│   ├── user/              # 用户状态
│   ├── tasks/             # 任务状态
│   ├── planner/           # 清洁计划状态
│   └── shop/              # 商城状态
│
├── utils/                 # 工具函数
│   ├── config/            # 配置文件
│   ├── helpers/           # 辅助函数
│   └── validators/        # 验证函数
│
├── public/                # 静态资源
│   ├── images/            # 图片资源
│   └── styles/            # 样式资源
│
└── next.config.js         # NextJS配置

## 二、核心模块实现

### 1. 多模态识别模块（使用Qwen大模型API）// services/recognition/multimodalService.js
import { fetch } from 'next/dist/server/web/spec-extension/fetch';
import { QwenChat } from 'qwen-api'; // 假设的Qwen API SDK

class MultimodalService {
  constructor() {
    this.qwen = new QwenChat(process.env.QWEN_API_KEY);
  }

  async recognizeImage(imageFile) {
    try {
      // 将图像转换为Base64（仅用于示例，实际应使用流式传输）
      const base64Image = await this.convertToBase64(imageFile);
      
      // 构建多模态提示
      const prompt = {
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "请识别这张图片中的家务任务，并列出需要清洁的区域和物品"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ]
      };
      
      // 调用Qwen API
      const response = await this.qwen.chatCompletion(prompt);
      
      // 解析API返回的家务任务
      return this.parseRecognitionResponse(response);
    } catch (error) {
      console.error('图像识别失败:', error);
      throw error;
    }
  }

  async recognizeVideo(videoFile) {
    // 提取视频关键帧
    const frames = await this.extractKeyFrames(videoFile);
    
    // 对每个关键帧进行识别
    const frameResults = await Promise.all(
      frames.map(frame => this.recognizeImage(frame))
    );
    
    // 合并并分析帧结果，生成视频识别报告
    return this.analyzeVideoFrames(frameResults);
  }

  // 辅助方法: 将文件转换为Base64
  convertToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 辅助方法: 解析识别结果
  parseRecognitionResponse(response) {
    // 解析Qwen返回的JSON结构，提取家务任务信息
    return {
      tasks: response.choices[0].message.content.tasks,
      areas: response.choices[0].message.content.areas
    };
  }
}

export default new MultimodalService();
### 2. 改进的API请求服务（使用SWR）// services/api/swrService.js
import useSWR from 'swr';
import { fetcher } from '../utils/fetcher';

// 用户相关API
export const useUser = (userId) => {
  return useSWR(userId ? `/api/users/${userId}` : null, fetcher);
};

// 任务相关API
export const useTasks = (planId) => {
  return useSWR(planId ? `/api/tasks/plan/${planId}` : null, fetcher);
};

// 图像识别API
export const useImageRecognition = (imageFile) => {
  // 使用mutate触发识别请求
  const { data, error, mutate } = useSWR(null, null);
  
  const recognize = async (file) => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    return mutate(
      fetcher('/api/recognition/image', {
        method: 'POST',
        body: formData
      }),
      { optimisticData: null, populateCache: true, revalidate: false }
    );
  };
  
  return {
    data,
    error,
    isLoading: !data && !error,
    recognize
  };
};
### 3. 客户端数据存储（IndexedDB）// utils/storage/clientStorage.js
class ClientStorage {
  constructor() {
    this.dbName = 'homeCleaningDB';
    this.dbVersion = 1;
    this.db = null;
  }

  // 初始化数据库
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 创建对象存储
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
        }
        
        if (!db.objectStoreNames.contains('tasks')) {
          const tasksStore = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
          tasksStore.createIndex('planId', 'planId', { unique: false });
        }
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };
      
      request.onerror = (event) => {
        reject(new Error(`数据库错误: ${event.target.errorCode}`));
      };
    });
  }

  // 保存图像到本地
  async saveImage(imageData) {
    await this.ensureDbInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      
      const request = store.add({
        timestamp: new Date().toISOString(),
        data: imageData
      });
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 获取所有任务
  async getTasks() {
    await this.ensureDbInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['tasks'], 'readonly');
      const store = transaction.objectStore('tasks');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 确保数据库已初始化
  async ensureDbInitialized() {
    if (!this.db) {
      await this.init();
    }
  }
}

export default new ClientStorage();
### 4. 改进的NextJS API路由// pages/api/recognition/image.js
import { NextRequest, NextResponse } from 'next/server';
import MultimodalService from '../../services/recognition/multimodalService';
import clientStorage from '../../utils/storage/clientStorage';

export async function POST(request) {
  try {
    // 从请求中获取图像
    const formData = await request.formData();
    const imageFile = formData.get('image');
    
    if (!imageFile) {
      return NextResponse.json({ error: '未提供图像' }, { status: 400 });
    }
    
    // 直接在客户端调用多模态API（不在服务端存储图像）
    // 注意：实际生产环境中，可能需要在边缘函数中处理以提高性能
    
    // 返回识别结果（示例数据结构）
    return NextResponse.json({
      tasks: [
        { id: 1, name: '扫地', area: '客厅', priority: '高' },
        { id: 2, name: '擦窗户', area: '卧室', priority: '中' }
      ]
    });
  } catch (error) {
    console.error('处理图像识别请求时出错:', error);
    return NextResponse.json({ error: '处理请求时出错' }, { status: 500 });
  }
}
## 三、技术栈更新说明

1. **前端框架**：NextJS 14 (App Router)
2. **状态管理**：Redux Toolkit + SWR (数据获取)
3. **样式管理**：Tailwind CSS v3 + CSS Modules
4. **API请求**：SWR + fetch API
5. **多模态识别**：Qwen大模型API
6. **数据存储**：
   - 客户端：IndexedDB (用户图像和任务数据)
   - 服务端：仅存储元数据（不存储原始图像）
7. **部署**：Vercel/Netlify

## 四、实现建议

1. 实现增量加载和懒加载，优化图像和视频处理性能
2. 设计离线工作模式，充分利用客户端存储
3. 实现数据加密，保护用户隐私
4. 考虑使用Web Workers处理大型图像处理任务
5. 实现渐进式Web应用(PWA)特性，支持添加到主屏幕

这个架构设计充分利用了NextJS的App Router和客户端存储能力，采用了模块化组织方式，便于团队协作开发和后续功能扩展。需要根据实际业务需求进一步细化和调整。

// 修改tasks存储结构
db.createObjectStore('tasks', {
  keyPath: 'id',
  autoIncrement: true
}).createIndex('status_index', 'status'); // 新增状态索引

// 示例任务数据结构
{
  id: 1,
  title: '厨房清洁',
  status: '进行中', // 新增状态字段
  priority: 'high',
  created: '2024-03-20T08:00:00Z',
  deadline: '2024-03-20T12:00:00Z'
}

### 安全增强设计

1. **数据加密流程**：
   - 使用Web Crypto API生成AES-GCM密钥
   - 存储前对图像数据进行加密
   - 元数据单独加密存储

2. **权限管理**：
   ```javascript
   // 相机权限申请示例
   const requestCamera = async () => {
     try {
       const stream = await navigator.mediaDevices.getUserMedia({
         video: {
           facingMode: 'environment',
           width: { ideal: 1280 } // 限制分辨率
         }
       });
       showPermissionExplanation('camera'); // 显示权限说明
     } catch (err) {
       handlePermissionError(err);
     }
   }}
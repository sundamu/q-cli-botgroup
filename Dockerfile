FROM node:18-alpine as builder

# 设置工作目录
WORKDIR /app

# 复制后端代码并安装依赖
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# 复制前端代码并安装依赖
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# 复制所有源代码
COPY backend ./backend
COPY frontend ./frontend

# 构建前端
RUN cd frontend && npm run build

# 最终镜像
FROM node:18-alpine

WORKDIR /app

# 安装 http-server
RUN npm install -g http-server

# 复制后端代码和依赖
COPY --from=builder /app/backend ./backend

# 复制前端构建文件
COPY --from=builder /app/frontend/build ./frontend/build

# 设置环境变量
ENV NODE_ENV=production
ENV HOST=0.0.0.0

# 暴露端口
EXPOSE 3000 3001

# 直接在 CMD 中启动前端和后端服务，确保监听在所有网络接口上
CMD sh -c "cd /app/backend && HOST=0.0.0.0 node src/server.js & cd /app && exec http-server frontend/build -p 3000 --cors -a 0.0.0.0"

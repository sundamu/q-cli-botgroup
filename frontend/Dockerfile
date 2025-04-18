FROM node:18-alpine as builder

# 设置工作目录
WORKDIR /app

# 复制前端代码并安装依赖
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# 复制所有源代码
COPY frontend ./frontend

# 构建前端
RUN cd frontend && npm run build

# 最终镜像
FROM node:18-alpine

WORKDIR /app

# 安装 http-server
RUN npm install -g http-server

# 复制前端构建文件
COPY --from=builder /app/frontend/build ./frontend/build

# 暴露端口
EXPOSE 3000

CMD ["http-server", "frontend/build", "-p", "3000"]

FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制后端代码并安装依赖
COPY backend/package*.json ./
RUN npm install

# 复制所有源代码
COPY backend/ ./

# 暴露端口
EXPOSE 3001

CMD ["node", "src/server.js"]

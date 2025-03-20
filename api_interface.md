# BotGroup 前后端接口定义

## 认证接口

### 登录
- **端点**: `/api/auth/login`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "password": "用户输入的密码"
  }
  ```
- **响应**:
  - 成功 (200):
    ```json
    {
      "success": true,
      "token": "认证令牌"
    }
    ```
  - 失败 (401):
    ```json
    {
      "success": false,
      "message": "密码错误"
    }
    ```

## WebSocket 连接

### 建立连接
- **端点**: `/ws`
- **查询参数**: `?token=认证令牌`
- **事件**:
  - `connect`: 连接成功
  - `connect_error`: 连接失败，可能是认证问题

## 消息接口

### 发送消息
- **事件名**: `send_message`
- **数据格式**:
  ```json
  {
    "message": "用户输入的消息",
    "sessionId": "当前会话ID"
  }
  ```

### 接收消息
- **事件名**: `receive_message`
- **数据格式**:
  ```json
  {
    "modelId": "模型标识符(deepseek/nova)",
    "message": "模型生成的消息片段",
    "isComplete": false,
    "sessionId": "当前会话ID",
    "order": 1  // 模型响应顺序：DeepSeek=1, Nova=2
  }
  ```
  注：`isComplete`为`false`表示这是流式响应的一部分，为`true`表示该模型的响应已完成

### 模型响应完成
- **事件名**: `model_complete`
- **数据格式**:
  ```json
  {
    "modelId": "完成响应的模型标识符",
    "sessionId": "当前会话ID",
    "order": 1  // 模型响应顺序
  }
  ```
  注：当一个模型完成响应后发送此事件，后端会开始调用下一个模型

### 所有响应完成
- **事件名**: `all_responses_complete`
- **数据格式**:
  ```json
  {
    "sessionId": "当前会话ID"
  }
  ```
  注：当所有两个模型都完成响应后发送此事件

## 会话管理接口

### 创建新会话
- **端点**: `/api/sessions/create`
- **方法**: `POST`
- **请求头**: `Authorization: Bearer 认证令牌`
- **响应**:
  ```json
  {
    "sessionId": "新创建的会话ID"
  }
  ```

### 获取会话列表
- **端点**: `/api/sessions`
- **方法**: `GET`
- **请求头**: `Authorization: Bearer 认证令牌`
- **响应**:
  ```json
  {
    "sessions": [
      {
        "id": "会话ID",
        "createdAt": "创建时间"
      }
    ]
  }
  ```

### 获取会话历史
- **端点**: `/api/sessions/{sessionId}/history`
- **方法**: `GET`
- **请求头**: `Authorization: Bearer 认证令牌`
- **响应**:
  ```json
  {
    "history": [
      {
        "role": "user",
        "content": "用户消息"
      },
      {
        "role": "assistant",
        "modelId": "deepseek",
        "content": "DeepSeek模型响应"
      },
      {
        "role": "assistant",
        "modelId": "nova",
        "content": "Nova模型响应"
      }
    ]
  }
  ```

## 数据结构

### 会话对象
```json
{
  "id": "会话唯一标识符",
  "createdAt": "创建时间",
  "messages": [
    {
      "role": "user/assistant",
      "modelId": "仅当role为assistant时需要，标识模型",
      "content": "消息内容"
    }
  ]
}
```

### 模型配置
```json
{
  "deepseek": {
    "modelId": "AWS Bedrock上DeepSeek模型的ID",
    "parameters": {
      "temperature": 0.7,
      "maxTokens": 1000
    }
  },
  "nova": {
    "modelId": "AWS Bedrock上Nova模型的ID",
    "parameters": {
      "temperature": 0.7,
      "maxTokens": 1000
    }
  }
}
```

## 错误处理

所有API错误响应格式如下：
```json
{
  "success": false,
  "error": {
    "code": "错误代码",
    "message": "错误描述"
  }
}
```

常见错误代码：
- `auth_failed`: 认证失败
- `invalid_session`: 会话ID无效
- `model_error`: 模型调用错误
- `rate_limited`: 请求频率超限

## 实现注意事项

1. **流式响应实现**：
   - 后端使用AWS Bedrock SDK的流式响应API
   - 通过WebSocket将每个模型的响应片段实时推送给前端
   - 前端接收到片段后实时更新UI

2. **串行响应机制**：
   - 后端按固定顺序串行调用两个模型：先DeepSeek，再Nova
   - 每个模型完成响应后，才开始调用下一个模型
   - 前端为每个模型预留显示区域
   - 每个模型的响应独立显示

3. **上下文共享**：
   - 后端维护完整的对话历史
   - 每次调用模型时，传入完整的对话历史作为上下文
   - 后续模型的上下文包含前面模型的响应
   - 例如：Nova模型的上下文包含DeepSeek的响应

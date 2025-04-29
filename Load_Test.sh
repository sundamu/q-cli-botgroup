#!/bin/bash

# 简单的前端应用并发压力测试脚本

# 默认参数
URL=""
CONCURRENT=400
REQUESTS=200000
TIMEOUT=5

# 显示使用方法
show_usage() {
  echo "用法: $0 [选项]"
  echo "选项:"
  echo "  -u, --url URL       前端应用URL (必需)"
  echo "  -c, --concurrent N  并发连接数 (默认: 10)"
  echo "  -n, --requests N    总请求数 (默认: 100)"
  echo "  -t, --timeout N     超时时间(秒) (默认: 5)"
  echo "  -h, --help          显示帮助信息"
  echo ""
  echo "示例:"
  echo "  $0 -u http://botgroup-alb-1285915247.us-east-1.elb.amazonaws.com/ -c 20 -n 200"
  exit 1
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
  case $1 in
    -u|--url)
      URL="$2"
      shift 2
      ;;
    -c|--concurrent)
      CONCURRENT="$2"
      shift 2
      ;;
    -n|--requests)
      REQUESTS="$2"
      shift 2
      ;;
    -t|--timeout)
      TIMEOUT="$2"
      shift 2
      ;;
    -h|--help)
      show_usage
      ;;
    *)
      echo "未知选项: $1"
      show_usage
      ;;
  esac
done

# 检查必需参数
if [ -z "$URL" ]; then
  echo "错误: 必须提供URL参数"
  show_usage
fi

# 检查是否安装了必要的工具
if ! command -v curl &> /dev/null; then
  echo "错误: 需要安装curl"
  exit 1
fi

echo "开始测试前端应用: $URL"
echo "并发连接数: $CONCURRENT"
echo "总请求数: $REQUESTS"
echo "超时时间: $TIMEOUT 秒"
echo "-----------------------------------"

# 创建临时文件存储结果
TEMP_FILE=$(mktemp)

# 使用curl进行测试
echo "测试中，请稍候..."
curl -s -o /dev/null -w "%{http_code}\n" \
  --connect-timeout $TIMEOUT \
  --max-time $((TIMEOUT * 2)) \
  -H "Accept: text/html" \
  "$URL" > $TEMP_FILE 2>&1

# 检查初始连接
INITIAL_STATUS=$(cat $TEMP_FILE)
if [[ $INITIAL_STATUS == "200" ]]; then
  echo "初始连接成功，HTTP状态码: 200"
else
  echo "初始连接失败，HTTP状态码: $INITIAL_STATUS"
  exit 1
fi

# 清空临时文件
> $TEMP_FILE

# 开始时间
START_TIME=$(date +%s)

# 并发测试函数
run_test() {
  local i=$1
  local result=$(curl -s -o /dev/null -w "%{http_code},%{time_total},%{size_download}\n" \
    --connect-timeout $TIMEOUT \
    --max-time $((TIMEOUT * 2)) \
    -H "Accept: text/html" \
    "$URL")
  
  echo "$i,$result" >> $TEMP_FILE
}

# 启动并发测试
echo "启动 $CONCURRENT 个并发连接，总共 $REQUESTS 个请求..."

for ((i=1; i<=$REQUESTS; i++)); do
  # 控制并发数
  while [[ $(jobs -r | wc -l) -ge $CONCURRENT ]]; do
    sleep 0.1
  done
  
  # 启动后台任务
  run_test $i &
  
  # 显示进度
  if [[ $((i % 10)) -eq 0 || $i -eq $REQUESTS ]]; then
    echo -ne "已完成: $i/$REQUESTS ($(( i * 100 / REQUESTS ))%)\r"
  fi
done

# 等待所有后台任务完成
wait

# 结束时间
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo -e "\n-----------------------------------"
echo "测试完成!"
echo "总耗时: $DURATION 秒"

# 分析结果
TOTAL=$(cat $TEMP_FILE | wc -l)
SUCCESS=$(grep -c ",200," $TEMP_FILE)
FAILED=$((TOTAL - SUCCESS))
SUCCESS_RATE=$(echo "scale=2; $SUCCESS * 100 / $TOTAL" | bc)

# 计算平均响应时间
AVG_TIME=$(awk -F',' '{sum+=$3} END {print sum/NR}' $TEMP_FILE)
# 计算平均下载大小
AVG_SIZE=$(awk -F',' '{sum+=$4} END {print sum/NR}' $TEMP_FILE)
# 计算每秒请求数
RPS=$(echo "scale=2; $TOTAL / $DURATION" | bc)

echo "总请求数: $TOTAL"
echo "成功请求: $SUCCESS (${SUCCESS_RATE}%)"
echo "失败请求: $FAILED"
echo "平均响应时间: ${AVG_TIME}秒"
echo "平均下载大小: ${AVG_SIZE}字节"
echo "每秒请求数(RPS): $RPS"

# 清理临时文件
rm -f $TEMP_FILE

echo "-----------------------------------"
echo "测试报告已生成"

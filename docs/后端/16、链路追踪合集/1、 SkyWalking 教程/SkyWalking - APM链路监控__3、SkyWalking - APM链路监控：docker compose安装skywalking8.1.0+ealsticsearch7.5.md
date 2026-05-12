# 3、SkyWalking - APM链路监控：docker compose安装skywalking8.1.0+ealsticsearch7.5
- 来源：https://ddkk.com/zhuanlan/linktrack/skywalking/17.html
- 分类：链路追踪
- 分组：SkyWalking - APM链路监控
## 环境准备

**1、** 准备一台Centos7虚拟机，分配内存4G（必须，否则启动报错）；

**2、** 安装docker及compose；

**3、** 如果compose不是1.27.0，需升级；

```bash
 curl -L https://get.daocloud.io/docker/compose/releases/download/1.27.0/docker-compose-uname -s-uname -m >` /usr/local/bin/docker-compose
 docker-compose -v
```

## 部署步骤

**1、** 创建目录；

```bash
mkdir -p /usr/local/skywalking/
cd /usr/local/skywalking/
```

**1、** 编写compose文件；

```bash
vim docker-compose.yml
# 添加如下内容
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.5.0
    container_name: elasticsearch
    restart: always
    ports:
      - 9200:9200
    healthcheck:
      test: ["CMD-SHELL", "curl --silent --fail localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    environment:
      - discovery.type=single-node
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - TZ=Asia/Shanghai
    ulimits:
      memlock:
        soft: -1
        hard: -1
  oap:
    image: apache/skywalking-oap-server:8.1.0-es7
    container_name: oap
    depends_on:
      - elasticsearch
    links:
      - elasticsearch
    restart: always
    ports:
      - 11800:11800
      - 12800:12800
    healthcheck:
      test: ["CMD-SHELL", "/skywalking/bin/swctl"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    environment:
      TZ: Asia/Shanghai
      SW_STORAGE: elasticsearch7
      SW_STORAGE_ES_CLUSTER_NODES: elasticsearch:9200
  ui:
    image: apache/skywalking-ui:8.1.0
    container_name: ui
    depends_on:
      - oap
    links:
      - oap
    restart: always
    ports:
      - 8080:8080
    environment:
      TZ: Asia/Shanghai
      SW_OAP_ADDRESS: oap:12800
```

**1、** 启动；

```bash
# 启动
docker-compose up -d 
# 查看日志 无报错启动成功
docker-compose logs -f 
```

**1、** 访问首页（ip+8080）；

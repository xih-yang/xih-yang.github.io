# 03、Docker 实战：配置阿里云镜像加速
- 来源：https://ddkk.com/zhuanlan/container/docker/4/3.html
- 分类：容器服务
- 分组：教程目录
### step-1 登录阿里云找到容器服务

### step-2 找到镜像加速地址

### step-3 配置使用

```java
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://kqiqirhh.mirror.aliyuncs.com"]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

# 06、Kubernetes 实战 - Centos7.6使用Ansible安装K8S（测试单节点）
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/1/6.html
- 分类：容器服务
- 分组：教程目录
## 说明

基于开源项目：https://github.com/easzlab/kubeasz

本次安装使用一个主节点一个工作节点

## 环境要求

- 至少2台 2核2G 的服务器
- Cent OS 7.6及以上
- ping通互联网

## 环境准备

**1、** 设置主机名；

```sh
# 各虚拟机设置主机名
hostnamectl set-hostname k8s-master001
hostnamectl set-hostname k8s-node001
# 查看修改
hostnamectl status
# 修改Hosts
vim /etc/hosts
# 添加如下内容
192.168.58.170 k8s-mamter001
192.168.58.171 k8s-node001
# 复制hosts至其他虚拟机
scp /etc/hosts root@k8s-node001:/etc/hosts
```

**1、** 调整系统时区（每个节点都执行）；

```sh
# 设置系统时区为 中国/上海
timedatectl set-timezone Asia/Shanghai
# 将当前的 UTC 时间写入硬件时钟
timedatectl set-local-rtc 0
# 重启依赖于系统时间的服务
systemctl restart rsyslog
systemctl restart crond
```

**1、** 查看并升级内核（每个节点都执行）；

```sh
# 载入公钥
rpm --import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org
# 安装ELRepo
rpm -Uvh http://www.elrepo.org/elrepo-release-7.0-3.el7.elrepo.noarch.rpm
# 载入elrepo-kernel元数据
yum --disablerepo=\* --enablerepo=elrepo-kernel repolist
# 查看可用的rpm包
yum --disablerepo=\* --enablerepo=elrepo-kernel list kernel*
# 安装长期支持版本的kernel
yum --disablerepo=\* --enablerepo=elrepo-kernel install -y kernel-lt.x86_64
# 删除旧版本工具包
yum remove kernel-tools-libs.x86_64 kernel-tools.x86_64 -y
# 安装新版本工具包
yum --disablerepo=\* --enablerepo=elrepo-kernel install -y kernel-lt-tools.x86_64
#查看默认启动顺序
awk -F\' '$1=="menuentry " {
     print $2}' /etc/grub2.cfg  
CentOS Linux (4.4.183-1.el7.elrepo.x86_64) 7 (Core)  
CentOS Linux (3.10.0-327.10.1.el7.x86_64) 7 (Core)  
CentOS Linux (0-rescue-c52097a1078c403da03b8eddeac5080b) 7 (Core)
#默认启动的顺序是从0开始，新内核是从头插入（目前位置在0，而4.4.4的是在1），所以需要选择0。
grub2-set-default 0  
#重启并检查
reboot
```

**1、** 每个节点安装依赖工具（每个节点都执行）；

```sh
# 安装epel源
yum install epel-release -y
# 更新yum
yum update
# 安装python
yum install python -y
```

## 安装K8S

**1、** 主节点安装及准备ansible；

```sh
# CentOS 7
yum install git python-pip -y
# pip安装ansible(国内如果安装太慢可以直接用pip阿里云加速)
pip install pip --upgrade -i https://mirrors.aliyun.com/pypi/simple/
pip install ansible==2.6.18 netaddr==0.7.19 -i https://mirrors.aliyun.com/pypi/simple/
```

**1、** 配置免密登录；

```sh
# 传统 RSA 算法
ssh-keygen -t rsa -b 2048 -N '' -f ~/.ssh/id_rsa
ssh-copy-id $IPs$IPs为所有节点地址包括自身，按照提示输入yes 和root密码
```

**1、** 下载安装所需二进制文件；

```sh
# 下载工具脚本easzup，举例使用kubeasz版本2.0.2
export release=2.0.2
curl -C- -fLO --retry 3 https://github.com/easzlab/kubeasz/releases/download/${release}/easzup
chmod +x ./easzup
# 使用工具脚本下载
./easzup -D
```

上述脚本运行成功后，所有文件（kubeasz代码、二进制、离线镜像）均已 整理好放入目录/etc/ansible

- /etc/ansible 包含 kubeasz 版本为 `$`{release} 的发布代码
- /etc/ansible/bin 包含 k8s/etcd/docker/cni 等二进制文件
- /etc/ansible/down 包含集群安装时需要的离线容器镜像
- /etc/ansible/down/packages 包含集群安装时需要的系统基础软件

**1、** 配置集群参数；

```sh
cd /etc/ansible && cp example/hosts.multi-node hosts
vim hosts
# 修改ETCD节点
[etcd]
192.168.58.170 NODE_NAME=etcd1
# master node(s)
[kube-master]
192.168.58.170
# work node(s)
[kube-node]
192.168.58.171
# 验证配置是否正确
ansible all -m ping
```

**1、** 安装；

```sh
# 分步安装
ansible-playbook 01.prepare.yml
ansible-playbook 02.etcd.yml
ansible-playbook 03.docker.yml
ansible-playbook 04.kube-master.yml
ansible-playbook 05.kube-node.yml
ansible-playbook 06.network.yml
ansible-playbook 07.cluster-addon.yml
# 一步安装
#ansible-playbook 90.setup.yml
```

**1、** 访问控制台；

```sh
# 安装完成后 查询节点信息
kubectl get nodes
# 查询dashboard端口
kubectl get svc -n kube-system | grep dashboard
# 获取访问令牌
kubectl -n kube-system describe secret $(kubectl -n kube-system get secret | grep admin-user | awk '{print $1}')
```

使用IP+图中端口访问（https://192.168.58.170:37204），输入访问令牌，跳转至主页面

## 安装Kuboard（可选，开源更强大的管理平台）

```sh
# 安装 Kuboard
kubectl apply -f https://kuboard.cn/install-script/kuboard.yaml
kubectl apply -f https://addons.kuboard.cn/metrics-server/0.3.6/metrics-server.yaml
# 查看 Kuboard 运行状态 ，STATUS为RUNNING时安装完成
kubectl get pods -l k8s.eip.work/name=kuboard -n kube-system
# 访问地址
http://任意一个Worker节点的IP地址:32567/
# 查询令牌  首页输入即可查询出来的字符串即可
echo $(kubectl -n kube-system get secret $(kubectl -n kube-system get secret | grep kuboard-user | awk '{print $1}') -o go-template='{
     {.data.token}}' | base64 -d)
```

## 添加工作节点

```sh
	场景：环境搭建完成后，有其他工作节点需加入。
```

**1、** 克隆一台虚拟机，按照文档环境准备步骤配置基础环境；

**2、** 主节点执行；

```sh
# 配置免密登录
ssh-copy-id 192.168.58.172
# 新增工作节点 执行完即可
easzctl add-node 192.168.58.172
```

**1、** 查看控制台；

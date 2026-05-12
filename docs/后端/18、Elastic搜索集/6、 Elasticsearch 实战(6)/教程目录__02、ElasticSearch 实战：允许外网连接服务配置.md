# 02、ElasticSearch 实战：允许外网连接服务配置
- 来源：https://ddkk.com/zhuanlan/search/elasticsearch/6/2.html
- 分类：搜索引擎
- 分组：教程目录
上一篇文章的配置，只能在本机使用，但是要想为集群或者其他的机器连接，则需要做以下配置：

## 一、修改/opt/elasticsearch-6.4.0/config/elasticsearch.yml文件

把 network.host 和 http.port 前面的# 备注去掉 然后Host改成你的机器的IP即可

修改后，保存退出

## 二、为防止bootstrap checks failed报错，进行以下修改

### 1>编辑 /etc/security/limits.conf，追加以下内容；

* soft nofile 65536

* hard nofile 131072

* soft nproc 4096

* hard nproc 4096

追加后，保存退出

此文件修改后需要重新登录用户，才会生效

### 2>编辑 /etc/sysctl.conf，追加以下内容：

vm.max_map_count=655360

保存后，执行：

# sysctl -p

## 三、关闭防火墙，并禁止开机启动

# systemctl stop firewalld.service

# systemctl disable firewalld.service

## 四、重启机器

执行命令 # reboot 重启机器

使用es用户登录，再次启动elasticsearch，启动完成后

使用外部浏览器请求 http://192.168.56.3:9200

出现以上内容，配置成功。

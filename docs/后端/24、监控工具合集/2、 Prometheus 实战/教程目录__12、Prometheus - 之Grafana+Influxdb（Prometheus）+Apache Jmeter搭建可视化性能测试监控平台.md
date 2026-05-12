# 12、Prometheus - 之Grafana+Influxdb（Prometheus）+Apache Jmeter搭建可视化性能测试监控平台
- 来源：https://ddkk.com/zhuanlan/monitoring/prometheus/12.html
- 分类：监控工具
- 分组：教程目录
此性能测试监控平台，架构可以是：

- Grafana+Influxdb+Jmeter
- Grafana+Prometheus+Jmeter

Influxdb和Prometheus在这里都是时序性数据库

在测试环境中，压测数据对存储和持久化的要求不高，所以这里的组件可以都通过docker-compose.yml文件或docker容器的方式进行安装，这样更加简明高效，不用逐个二进制的方式去安装服务。

docker、docker-compose的部署流程这里不过多赘述。

## 通过docker-compose部署

通过docker-compose部署grafana和Influxdb的docker-compose文件如下：

```sh
version: '3.1'
services:
 influxdb:
   image: influxdb:latest
   container_name: influxdb
   ports:
     - "8083:8083"
     - "8086:8086"
     - "8090:8090"
   environment:
     - INFLUXDB_DB=influxdb
     - INFLUXDB_ADMIN_USER=${INFLUXDB_USERNAME}
     - INFLUXDB_ADMIN_PASSWORD=${INFLUXDB_PASSWORD}
   volumes:
     - influxdb-storage:/var/lib/influxdb
 grafana:
   image: grafana/grafana:latest
   container_name: grafana
   ports:
     - "3000:3000"
   environment:
     - GF_SECURITY_ADMIN_USER=${GRAFANA_USERNAME}
     - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
   depends_on:
     - influxdb
   user: "0"
   volumes:
     - grafana-storage:/var/lib/grafana
     - ./grafana-provisioning/:/etc/grafana/provisioning
volumes:
  influxdb-storage:
  chronograf-storage:
  grafana-storage:
```

设置环境文件.env，设置influxdb和grafana的用户名和密码：

```sh
cat .env 
INFLUXDB_USERNAME=admin
INFLUXDB_PASSWORD=influxdb
GRAFANA_USERNAME=admin
GRAFANA_PASSWORD=grafana
```

运行docker-compose，安装influxdb和grafana，容器正常启动后如图：

```sh
# 启动容器
docker-compose up 
```

注意：如果docker-ce没有正常安装，则执行`docker-compose up -d`会提示iptables的报错：

```sh
Failed to program FILTER chain: iptables failed: iptables --wait -I FORWARD -o br-fe155984ff4c -j DOCKER: iptables v1.4.21: Couldn't load target DOCKER':No such file or directory
```

这个错误信息表明iptables无法加载目标DOCKER，因为没有找到该文件或目录。这通常是由于缺少所需的iptables插件或模块引起的。确保系统上已正确安装了Docker和iptables，且版本兼容。

还可以尝试更新iptables和Docker的版本，以解决这个问题。

grafana访问方式：[http://172.16.108.119:3000](http://172.16.108.119:3000)

初始登录用户为：admin

初始登录密码为：grafana

登录到grafana主页后，创建新的Data Source：

配置Database，选择InfluxDB：

填写IP地址及8086端口：

输入InfluxDB信息，user和password按照env文件中设定的自行修改：

**grafana dashboard导入Jmeter模板**

到dashboard去下载：[https://grafana.com/grafana/dashboards](https://grafana.com/grafana/dashboards)

或者直接访问grafana：[https://grafana.com/grafana/dashboards/5496](https://grafana.com/grafana/dashboards/5496)

复制该模板的ID 或者URL

到我们登录的grafana主页去粘贴

可以进行命名，填写之前建好的DataSource名字，设置发送时间，保存即可。

转到刚刚建好的主页，如上图，右上角可以设置：

## 通过Docker Images安装

**安装Influxdb**

```sh
# 搜索influxdb
docker search influxdb
# 拉取influxdb镜像
docker pull influxdb
# 查看镜像images
docker images
# 运行influxdb容器
docker run --name my_influxdb -p 8086:8086 influxdb:1.8-alpine 
# 查看运行的容器container
docker ps -a
# 进入容器
docker exec -it 容器ID /bin/bash
influx
# 创建数据库jmeterDB
show databases;
create database jmeterdb;
```

my_influxdb容器运行成功

**安装grafana**

```sh
# 搜索grafana
docker search grafana
# 拉取grafana镜像
docker pull grafana/grafana
# 运行容器
docker run --name my_grafana -p 3000:3000 grafana/grafana
# 查看状态
docker ps -a
# 退出来再次启动即可
docker start ContainerID
```

接下来就是使用http://172.16.108.119:3000去登陆grafana并进行配置了。

步骤如上文docker-compose的方式。

## Prometheus（测试在本地配置）

需要在Jmeter下装一个插件，用于监听。

[https://search.maven.org/remotecontent?filepath=com/github/johrstrom/jmeter-prometheus-plugin/0.6.0/jmeter-prometheus-plugin-0.6.0.jar](https://search.maven.org/remotecontent?filepath=com/github/johrstrom/jmeter-prometheus-plugin/0.6.0/jmeter-prometheus-plugin-0.6.0.jar)

下载jmeter-prometheus-plugin-0.6.0.jar之后放到Jmeter/lib/ext下,重启Jmeter即可。

更多设置参考这篇文章： [https://qainsights.com/jmeter-prometheus-and-grafana-integration/](https://qainsights.com/jmeter-prometheus-and-grafana-integration/)

## 总结

搭建其实不难，一个配置文件就搞定，但是想要更好地应用到实践中则需要对Grafana Dashboard做更多的优化和设置。

Grafana+Prometheus+Jmeter这种方式不过就是换一个DataBase，将InfluxDB换成Prometheus，理念大体一样，很细微的差别。

Grafana+Prometheus/influxDB模式可以用到其他地方的监控，也是个不错的选择。

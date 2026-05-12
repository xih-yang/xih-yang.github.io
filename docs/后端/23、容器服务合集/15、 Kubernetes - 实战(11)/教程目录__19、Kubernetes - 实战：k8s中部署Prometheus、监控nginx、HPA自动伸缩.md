# 19、Kubernetes - 实战：k8s中部署Prometheus、监控nginx、HPA自动伸缩
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/11/19.html
- 分类：容器服务
- 分组：教程目录
## 1、什么是Prometheus？

普罗米修斯是一个云计算基础基金项目，它是一个系统和服务监控系统。它以给定的时间间隔从配置的目标收集度量，评估规则表达式，显示结果，并在观察到指定条件时触发警报。

普罗米修斯与其他度量（metrics）和监控系统的区别在于：

- 多维数据模型（由度量名称和键/值维度集定义的时间序列）
- PromQL是一种强大而灵活的查询语言，可以利用这种维度
- 不依赖分布式存储；单服务器节点是自治的
- 用于时间序列采集的HTTP pull模型
- 通过批处理作业的中间网关支持推送时间序列
- 通过服务发现或静态配置发现目标
- 图形和仪表板支持的多种模式
- 支持分层和水平联合

运行流程如下，prometheus根据配置定时去拉取各个节点的数据，默认使用的拉取方式是pull，也可以使用pushgateway提供的push方式获取各个监控节点的数据。将获取到的数据存入TSDB，一款时序型数据库。此时prometheus已经获取到了监控数据，可以使用内置的PromQL进行查询。它的报警功能使用Alertmanager提供，Alertmanager是prometheus的告警管理和发送报警的一个组件。prometheus原生的图标功能过于简单，可将prometheus数据接入grafana，由grafana进行统一管理。

Prometheus资源地址：[https://github.com/coreos/prometheus-operator/](https://github.com/coreos/prometheus-operator/)

## 2、k8s中部署Prometheus监控

首先查找prometheus-oprator并拉取部署文件

解压prometheus-oprator包

仓库中创建新项目，kubeapps

提前下载相关镜像并上传到仓库

进入解压得到的目录，可以看到有三个组件，

- kube-state-metrics：直接采集的数据集群无法使用，kube-state-metrics负责从prometheus的数据格式转换为k8s集群可以识别的格式。
- prometheus-node-exporter安装在被监控端，负责采集多种数据
- grafana可以产生图像化监控

修改主配置value.yaml文件

打开三个ingress，设定域名和路径

并修改八个镜像路径到自己的仓库路径，

添加登陆密码

接下来分别修改子配置文件的value.yaml文件

进入grafana子目录，修改value.yaml文件

修改五个镜像路径到自己的仓库路径

并打开ingress服务，设置域名

进入kube-state-metrics子目录，修改value.yaml文件

修改一个镜像路径到自己的仓库路径

进入prometheus-node-exporter子目录，修改value.yaml文件，发现不用修改

创建命名空间

指定ns安装prometheus-operator

查看pod和svc全部正常启动

控制器也正常

查看ingress也正常开启

给真机添加解析

网页输入prometheus.westos.org访问，进入

grafana.westos.org也可以访问，输入密码

grafana的图形化展示比原本的Prometheus做的好，配置默认的Prometheus

测试

添加Prometheus

看到了图形界面

## 3、prometheus监控nginx

使用helm图形化界面安装nginx

进入nginx，使用9.4.1版本

打开Prometheus监控

修改YAML文件，添加仓库信息

指定ns

最后可以看到修改的地方

部署成功

网页访问上面展示的url，成功访问

查看开放了9113端口监控

设备发现没有nginx，原因是未添加对应的标签release=prometheus-operator

查看nginx没有标签release=prometheus-operator，其他有

给nginx添加标签

现在服务发现就有nginx了

点击graph，选择访问流量指标，添加图

如图

## 4、基于prometheus监控nginx的HPA自动伸缩

之前学习了根据核心指标（cpu和mem），hpa控制副本的数量。如果想根据其他指标（比如nginx的访问量）控制的话，需要要用到自定义指标的HPA，需要提供社区标准的Custom Metric API，一般用户使用Prometheus-Adapter来提供Custom Metric API，其主要功能是将接受到custom metric api转换成普罗的请求，从普罗中查询数据返回给API Server。简单说，prometheus-adapter负责转换数据

搜索并拉取prometheus-adapter插件

解压tar包，进入

编辑values.yaml文件，修改镜像路径，修改服务的url

上面url的编写可以查看指定ns下的svc

保险起见，进入一个容器，看url能否正确解析

创建ns，指定ns安装

安装完成后，使用提示语句，可以看到有变量出现

再详细指定ns，指定pod，指定监控指标，可以成功看到

使用python语句更清晰明了

编写hpa-nginx.yaml 文件

```java
apiVersion: autoscaling/v2beta2
kind: HorizontalPodAutoscaler
metadata:
  name: hpa-example
spec:
  maxReplicas: 10			%最少1个副本
  minReplicas: 1			%最多10个副本
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nginx
  metrics:
  - type: Pods
    pods:
      metric:
        name: nginx_http_requests		%监控类型为nginx的访问流量
      target:
        type: AverageValue				%hpa变化的依据是平均值是否在10附近
        averageValue: 10				
```

应用hpa-nginx.yaml文件

查看hpa

接下来使用hey压力测试，把hey放到/usr/local/bin可执行

运行压力测试

```java
chmod +x hey		%赋予可执行权限
hey -n 10000 -c 5 -q 5 http://172.25.11.12/index.html	%总运行次数一万次，每秒五次访问，同时并发五个，即每秒25次访问
```

`-w`动态查看hpa，可以看到集群根据压力大小进行动态添加副本，副本数从1到2，从2到3

# 09、Consul：使用intention进行访问控制
- 来源：https://ddkk.com/zhuanlan/registered/consul/d-1/9.html
- 分类：注册中心
- 分组：Consul 教程（版本 A）
这篇文章将继续结合前面的示例进行说明，介绍一下如何使用intention进行访问控制。

## 事前准备

### 使用socat启动一个用于验证的服务

可以使用socat，也可以使用其他的任何服务均可，只要可以验证操作即可，执行如下命令在8181端口提供一个基于socat的可以进行结果回显的服务。

> 执行命令：socat -v tcp-l:8181,fork exec:"/bin/cat"

### 配置文件

```sh
liumiaocn:consul.d liumiao$ cat socat.json 
{
    "service":{
        "name":"socat",
        "port":8181,
        "connect":{
            "sidecar_service":{
            }
        }
    }
}
liumiaocn:consul.d liumiao$ cat web.json 
{
    "service":{
        "name":"web",
        "port":8181,
        "connect":{
            "sidecar_service":{
                "proxy":{
                    "upstreams":[
                        {
                            "destination_name":"socat",
                            "local_bind_port":9191
                        }
                    ]
                }
            }
        }
    }
}
liumiaocn:consul.d liumiao$
```

### 启动Consul并注册服务

执行如下命令启动并注册服务

> 执行命令：consul agent -dev -enable-script-checks -config-dir=.

### 连接socat服务

执行如下命令连接socat服务

> 执行命令：consul connect proxy -sidecar-for socat

### 连接web服务

执行如下命令连接web服务

> 执行命令：consul connect proxy -sidecar-for web

## 状态确认

此时整体状态可以通过Consul web UI进行确认

另外，此时Intention并没有设定

通过nc访问9191，可以确认到socat回显服务

```sh
liumiaocn:~ liumiao$ nc localhost 9191
hello, greetings from 9191 before intention setting
hello, greetings from 9191 before intention setting
```

## 创建intention

设定deny的intention，可以通过web UI也可以通过命令行方式，此处直接使用命令行方式进行，执行日志如下所示：

```sh
liumiaocn:~ liumiao$ consul intention create -deny web socat
Created: web => socat (deny)
liumiaocn:~ liumiao$
```

从web UI上也可以看到结果

此时再使用nc进行连接会发现无法进行，执行日志如下所示：

```sh
liumiaocn:~ liumiao$ nc localhost 9191
liumiaocn:~ liumiao$ 
```

## 删除intention

使用如下命令删除intention：

> 执行命令：consul intention delete web socat

执行日志如下所示：

```sh
liumiaocn:~ liumiao$ consul intention delete web socat
Intention deleted.
liumiaocn:~ liumiao$
```

使用nc也可以进行socat服务的确认了

```sh
liumiaocn:~ liumiao$ nc localhost 9191
hello, this is greetings message after deleting intention
hello, this is greetings message after deleting intention
```

> 版权声明：「DDKK.COM 弟弟快看，程序员编程资料站」本站文章，版权归原作者所有

> 来源：https://blog.csdn.net/liumiaocn/category_9752887.html

# 19、Kubernetes - 实战：ServiceMesh之使用Ingress Nginx暴露Kubernetes上的gRPC服务
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/19.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

Ingress Nginx支持gRPC服务的暴露，低于0.21的版本使用如下的annotation支持gRPC：

```java
nginx.ingress.kubernetes.io/grpc-backend: "true"
```

**0、** 21版本以上使用如下annotation支持gRPC：；

```java
nginx.ingress.kubernetes.io/backend-protocol: "GRPC"
```

本文基于Ingress Ngixn版本0.30.0(quay.io/kubernetes-ingress-controller/nginx-ingress-controller:0.30.0)进行部署和测试

## 二、部署gRPC服务

### 2.1 服务端代码和镜像构建

**server.go**

```java
package main
import (
	"context"
	"fmt"
	"os/signal"
	"log"
	"net"
	"os"
	"github.com/javiramos1/grpcapi"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)
type grpcServer struct{}
func (*grpcServer) GrpcService(ctx context.Context, req *grpcapi.GrpcRequest) (*grpcapi.GrpcResponse, error) {
	fmt.Printf("grpcServer %v\n", req)
	name, _ := os.Hostname()
	input := req.GetInput()
	result := "Got input " + input + " server host: " + name
	res := &grpcapi.GrpcResponse{
		Response: result,
	}
	return res, nil
}
func main() {
	fmt.Println("Starting Server...")
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	hostname := os.Getenv("SVC_HOST_NAME")
	if len(hostname) <= 0 {
		hostname = "0.0.0.0"
	}
	port := os.Getenv("SVC_PORT")
	if len(port) <= 0 {
		port = "50051"
	}
	lis, err := net.Listen("tcp", hostname+":"+port)
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}
	opts := []grpc.ServerOption{}
	s := grpc.NewServer(opts...)
	grpcapi.RegisterGrpcServiceServer(s, &grpcServer{})
	// reflection service on gRPC server.
	reflection.Register(s)
	go func() {
		fmt.Println("Server running on ", (hostname + ":" + port))
		if err := s.Serve(lis); err != nil {
			log.Fatalf("failed to serve: %v", err)
		}
	}()
	// Wait for Control C to exit
	ch := make(chan os.Signal, 1)
	signal.Notify(ch, os.Interrupt)
	// Block until a signal is received
	<-ch
	fmt.Println("Stopping the server")
	s.Stop()
	fmt.Println("Closing the listener")
	lis.Close()
	fmt.Println("Server Shutdown")
}
```

**Dockerfile**

```java
FROM iron/go
WORKDIR /app
ADD grpc_server /app/
CMD [ "./grpc_server" ]
```

**构建binary和镜像：**

```java
CGO_ENABLED=0 GOOS=linux go build -o grpc_server -ldflags "-s -w -X 'main.build=$(git rev-parse --short HEAD)' -X 'main.buildDate=$(date --rfc-3339=seconds)'" -a -installsuffix cgo server.go
docker build -t myregistry.com/grpc_server .
docker push myregistry.comgrpc_server
```

**2、** 2部署gRPC服务；

```java
apiVersion: v1
kind: Service
metadata:
  name: grpcserver
spec:
  ports:
  - port: 50051
    protocol: TCP
    targetPort: 50051
  selector:
    run: grpcserver
---
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    run: grpcserver
  name: grpcserver
spec:
  replicas: 2
  selector:
    matchLabels:
      run: grpcserver
  template:
    metadata:
      labels:
        run: grpcserver
    spec:
      containers:
      - image: myregistry.com/grpc_server:latest
        name: grpcserver
        ports:
        - containerPort: 50051
```

包含两个replica和一个cluster service：

## 三、通过Ingress Nginx暴露gRPC服务

参考文档：

[https://kubernetes.github.io/ingress-nginx/examples/grpc/](https://kubernetes.github.io/ingress-nginx/examples/grpc/)

### 3.1 Ingress Nginx暴露gRPC服务的TLS要求

Ingress Nginx暴露gRPC服务的时候，暂时只支持TLS(HTTPS)的方式，而不能通过普通HTTP方式，所以我们要配置TLS secret

**生成key**

```java
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout sslforingress.key -out sslforingress.pem -subj "/CN=grpc.test.com"
```

**生成secret**

```java
kubectl create secret tls grpcserver-secret  --cert sslforingress.pem --key sslforingress.key -n grpcserver
```

### 3.2 部署Ingress

暴露的地址是 **grpc.test.com:443**

```java
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/backend-protocol: "GRPC"
  name: grpcserver
  namespace: grpcserver
spec:
  rules:
    - host: grpc.test.com
      http:
        paths:
          - backend:
              serviceName: grpcserver
              servicePort: 50051
  tls:
# This secret must exist beforehand
# The cert must also contain the subj-name grpc.test.com
# https://github.com/kubernetes/ingress-nginx/blob/master/docs/examples/PREREQUISITES.md#tls-certificates
    - secretName: grpcserver-secret
      hosts:
        - grpc.test.com
```

nginx.conf生成的内容：

```java
        start server grpc.test.com                                   
        server {                                                                                     
                server_name grpc.test.com ;                                                            
                listen 80  ;                                                                                               
                listen [::]:80  ;                                                                                          
                listen 443  ssl http2 ;                                                                                    
                listen [::]:443  ssl http2 ;                                                                               
                set $proxy_upstream_name "-";                                                                              
                ssl_certificate_by_lua_block {                                                                             
                        certificate.call()                                                                                 
                }
                location / {                                                  
                        set $namespace      "grpcserver";             
                        set $ingress_name   "grpcserver";                                      
                        set $service_name   "grpcserver";                   
                        set $service_port   "50051";                                                 
                        set $location_path  "/";                                                
        ... ...
                        Allow websocket connections                                                
                        grpc_set_header                        Upgrade           $http_upgrade;      
                        grpc_set_header                        Connection        $connection_upgrade;
                        grpc_set_header X-Request-ID           $req_id;            
                        grpc_set_header X-Real-IP              $remote_addr;       
                        grpc_set_header X-Forwarded-For        $remote_addr;       
                        grpc_set_header X-Forwarded-Host       $best_http_host;        
                        grpc_set_header X-Forwarded-Port       $pass_port;             
                        grpc_set_header X-Forwarded-Proto      $pass_access_scheme;                  
                        grpc_set_header X-Scheme               $pass_access_scheme;                  
                        Pass the original X-Forwarded-For                                          
                        grpc_set_header X-Original-Forwarded-For $http_x_forwarded_for;              
                        mitigate HTTPoxy Vulnerability                                             
                        https://www.nginx.com/blog/mitigating-the-httpoxy-vulnerability-with-nginx/
                        grpc_set_header Proxy                  "";    
                        Custom headers to proxied server           
        ... ...
                }                                            
        }                                                            
        end server grpc.test.com                
```

## 四、通过Ingress Nginx访问gRPC服务

### 4.1 安装grpcurl

[https://github.com/fullstorydev/grpcurl](https://github.com/fullstorydev/grpcurl)

```java
go get github.com/fullstorydev/grpcurl
go install github.com/fullstorydev/grpcurl/cmd/grpcurl
```

运行之后在go的PATH里面会有grpcurl的binary，将grpcurl拷贝到/usr/local/bin

### 4.2 通过grpcurl访问Kubernetes的gRPC服务

查看服务暴露的gRPC方法：

```java
grpcurl -insecure grpc.test.com:443 list
greet.GrpcService
grpc.reflection.v1alpha.ServerReflection
```

调用服务：

```java
[root@k8s-node-01 ~]# grpcurl  -insecure grpc.test.com:443 greet.GrpcService/grpcService
{
  "response": "Got input  server host: grpcserver-5bfd56f94b-bc6fg"
}
[root@k8s-node-01 ~]# grpcurl  -insecure grpc.test.com:443 greet.GrpcService/grpcService
{
  "response": "Got input  server host: grpcserver-5bfd56f94b-w7frq"
}
```

可以看到服务在两个节点之间轮转

## 五、通过API访问Ingress Nginx暴露的gRPC服务

### 5.1 访问基于TLS的gRPC服务

建立连接的时候加上如下代码，可以忽略SSL证书的有效性：

> config := &tls.Config{
>
> InsecureSkipVerify: true,
>
> }
>
> cc, err := grpc.Dial(hostname+":"+port, grpc.WithTransportCredentials(credentials.NewTLS(config)))

### 5.2 通过短连接访问gRPC服务

**client_short_connection.go**

```java
package main
import (
	"context"
	"fmt"
	"log"
	"os"
	"github.com/javiramos1/grpcapi"
	"google.golang.org/grpc"
        "google.golang.org/grpc/credentials"
        "crypto/tls"
)
func main() {
	fmt.Println("Starting client...")
	hostname := os.Getenv("SVC_HOST_NAME")
	if len(hostname) <= 0 {
		hostname = "0.0.0.0"
	}
	port := os.Getenv("SVC_PORT")
	if len(port) <= 0 {
		port = "50051"
	}
	config := &tls.Config{
    		InsecureSkipVerify: true,
	}
	cc, err := grpc.Dial(hostname+":"+port, grpc.WithTransportCredentials(credentials.NewTLS(config)))
	if err != nil {
		log.Fatalf("could not connect: %v", err)
	}
	defer cc.Close()
	c := grpcapi.NewGrpcServiceClient(cc)
	fmt.Printf("Created client: %f", c)
		callService(c)
}
func callService(c grpcapi.GrpcServiceClient) {
	fmt.Println("callService...")
	req := &grpcapi.GrpcRequest{
		Input: "test",
	}
	res, err := c.GrpcService(context.Background(), req)
	if err != nil {
		log.Fatalf("error while calling gRPC: %v", err)
	}
	log.Printf("Response from Service: %v", res.Response)
}
```

编译：

```java
CGO_ENABLED=0 GOOS=linux go build -o grpc_client_short_connection -ldflags "-s -w -X 'main.build=$(git rev-parse --short HEAD)' -X 'main.buildDate=$(date --rfc-3339=seconds)'" -a -installsuffix cgo client.go
```

运行：

```java
export SVC_HOST_NAME=grpc.test.com
export SVC_PORT=443
while true; do ./grpc_client_short_connection; sleep 1;done
2020/05/12 13:21:39 Response from Service: Got input test server host: grpcserver-5bfd56f94b-w7frq
2020/05/12 13:21:40 Response from Service: Got input test server host: grpcserver-5bfd56f94b-bc6fg
2020/05/12 13:21:41 Response from Service: Got input test server host: grpcserver-5bfd56f94b-bc6fg
2020/05/12 13:21:42 Response from Service: Got input test server host: grpcserver-5bfd56f94b-w7frq
2020/05/12 13:21:43 Response from Service: Got input test server host: grpcserver-5bfd56f94b-w7frq
2020/05/12 13:21:44 Response from Service: Got input test server host: grpcserver-5bfd56f94b-bc6fg
2020/05/12 13:21:45 Response from Service: Got input test server host: grpcserver-5bfd56f94b-w7frq
2020/05/12 13:21:46 Response from Service: Got input test server host: grpcserver-5bfd56f94b-w7frq
2020/05/12 13:21:47 Response from Service: Got input test server host: grpcserver-5bfd56f94b-w7frq
2020/05/12 13:21:48 Response from Service: Got input test server host: grpcserver-5bfd56f94b-bc6fg
2020/05/12 13:21:49 Response from Service: Got input test server host: grpcserver-5bfd56f94b-bc6fg
2020/05/12 13:21:50 Response from Service: Got input test server host: grpcserver-5bfd56f94b-bc6fg
```

同时可以看到系统存在大量端口被短连接占用之后等待关闭：

```java
netstat -anp | grep 443 -w
tcp        0      0 172.3.0.11:41984        172.2.2.11:443          TIME_WAIT   -                   
tcp        0      0 172.3.0.11:41948        172.2.2.11:443          TIME_WAIT   -                   
tcp        0      0 172.3.0.11:41910        172.2.2.11:443          TIME_WAIT   -                   
tcp        0      0 172.3.0.11:41974        172.2.2.11:443          TIME_WAIT   -                   
tcp        0      0 172.3.0.11:41934        172.2.2.11:443          TIME_WAIT   -                   
tcp        0      0 172.3.0.11:41970        172.2.2.11:443          TIME_WAIT   -                   
tcp        0      0 172.3.0.11:41928        172.2.2.11:443          TIME_WAIT   -                   
tcp        0      0 172.3.0.11:41912        172.2.2.11:443          TIME_WAIT   -                   
tcp        0      0 172.3.0.11:41940        172.2.2.11:443          TIME_WAIT   -                   
tcp        0      0 172.3.0.11:41942        172.2.2.11:443          TIME_WAIT   -                   
tcp        0      0 172.3.0.11:41976        172.2.2.11:443          TIME_WAIT   -                   
tcp        0      0 172.3.0.11:41994        172.2.2.11:443          TIME_WAIT   -                   
tcp        0      0 172.3.0.11:41980        172.2.2.11:443          TIME_WAIT   -                   
tcp        0      0 172.3.0.11:41988        172.2.2.11:443          TIME_WAIT   -                   
tcp        0      0 172.3.0.11:41998        172.2.2.11:443          TIME_WAIT   -                   
tcp        0      0 172.3.0.11:41916        172.2.2.11:443          TIME_WAIT   -                   
tcp        0      0 172.3.0.11:41978        172.2.2.11:443          TIME_WAIT   -                   
tcp        0      0 172.3.0.11:41924        172.2.2.11:443          TIME_WAIT   -                   
tcp        0      0 172.3.0.11:41922        172.2.2.11:443          TIME_WAIT   -                   
tcp        0      0 172.3.0.11:41996        172.2.2.11:443          TIME_WAIT   -                   
tcp        0      0 172.3.0.11:41986        172.2.2.11:443          TIME_WAIT   -                   
tcp        0      0 172.3.0.11:41962        172.2.2.11:443          TIME_WAIT   -                   
tcp        0      0 172.3.0.11:41906        172.2.2.11:443          TIME_WAIT   -                   
tcp        0      0 172.3.0.11:41960        172.2.2.11:443          TIME_WAIT   -       
```

### 5.3 通过长连接访问gRPC服务

**client_longlive_connection.go**

```java
package main
import (
	"context"
	"fmt"
	"log"
	"os"
        "time"
	"github.com/javiramos1/grpcapi"
	"google.golang.org/grpc"
        "google.golang.org/grpc/credentials"
        "crypto/tls"
)
func main() {
	fmt.Println("Starting client...")
	hostname := os.Getenv("SVC_HOST_NAME")
	if len(hostname) <= 0 {
		hostname = "0.0.0.0"
	}
	port := os.Getenv("SVC_PORT")
	if len(port) <= 0 {
		port = "50051"
	}
	config := &tls.Config{
    		InsecureSkipVerify: true,
	}
	cc, err := grpc.Dial(hostname+":"+port, grpc.WithTransportCredentials(credentials.NewTLS(config)))
	if err != nil {
		log.Fatalf("could not connect: %v", err)
	}
	defer cc.Close()
	c := grpcapi.NewGrpcServiceClient(cc)
	fmt.Printf("Created client: %f", c)
        for i := 1; i <= 100; i++ {
		callService(c)
      		time.Sleep(2000 * time.Millisecond)
        }
}
func callService(c grpcapi.GrpcServiceClient) {
	fmt.Println("callService...")
	req := &grpcapi.GrpcRequest{
		Input: "test",
	}
	res, err := c.GrpcService(context.Background(), req)
	if err != nil {
		log.Fatalf("error while calling gRPC: %v", err)
	}
	log.Printf("Response from Service: %v", res.Response)
}
```

编译并运行：

```java
CGO_ENABLED=0 GOOS=linux go build -o grpc_client_longlive_connection -ldflags "-s -w -X 'main.build=$(git rev-parse --short HEAD)' -X 'main.buildDate=$(date --rfc-3339=seconds)'" -a -installsuffix cgo client.go
export SVC_HOST_NAME=grpc.test.com
export SVC_PORT=443
./grpc_client_longlive 
2020/05/12 13:40:06 Response from Service: Got input test server host: grpcserver-5bfd56f94b-bc6fg
callService...
2020/05/12 13:40:08 Response from Service: Got input test server host: grpcserver-5bfd56f94b-w7frq
callService...
2020/05/12 13:40:10 Response from Service: Got input test server host: grpcserver-5bfd56f94b-bc6fg
callService...
2020/05/12 13:40:12 Response from Service: Got input test server host: grpcserver-5bfd56f94b-w7frq
callService...
2020/05/12 13:40:14 Response from Service: Got input test server host: grpcserver-5bfd56f94b-bc6fg
callService...
2020/05/12 13:40:16 Response from Service: Got input test server host: grpcserver-5bfd56f94b-w7frq
callService...
2020/05/12 13:40:18 Response from Service: Got input test server host: grpcserver-5bfd56f94b-bc6fg
callService...
2020/05/12 13:40:20 Response from Service: Got input test server host: grpcserver-5bfd56f94b-w7frq
callService...
2020/05/12 13:40:22 Response from Service: Got input test server host: grpcserver-5bfd56f94b-bc6fg
callService...
2020/05/12 13:40:24 Response from Service: Got input test server host: grpcserver-5bfd56f94b-w7frq
```

整个运行过程中只有一个到443端口的长连接：

这说明客户端到Ingress Nginx建立了gRPC长连接，而Ingress Nginx解码了七层gRPC数据包并进行负载均衡到gRPC 服务的两个replica POD

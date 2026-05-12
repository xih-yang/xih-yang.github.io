# 04、Kubernetes - 实战：在Kubernetes运行带Desktop的Ubuntu容器
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/4/4.html
- 分类：容器服务
- 分组：教程目录
## 一、前言

在文章[《二：在Kubernetes使用kubevirt运行管理Ubuntu/Windows桌面操作系统》](/zhuanlan/container/kubernetes/4/2.html)中，我们部署来虚拟机并提供桌面来向Kubernetes的用户提供带桌面的运行环境，这种用受Kubernetets管理虚拟机来部署桌面的方式一方面对于Kubernetets节点的虚拟化提出要去，另外方面，也是比较重的解决方案。本文介绍通过容器运行Ubuntu Desktop并通过Kubernetets进行部署提供桌面运行环境的方案。

## 二、获取代码

获取带桌面的ubuntu docker镜像代码

```java
git clone https://github.com/fcwu/docker-ubuntu-vnc-desktop.git
cd docker-ubuntu-vnc-desktop-master/
```

获取依赖软件

```java
wget https://github.com/krallin/tini/releases/download/v0.18.0/tini
wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-64bit-static.tar.xz
```

获取noVNC和websockify

```java
cd web/static
git clone https://github.com/novnc/noVNC.git
git clone https://github.com/novnc/websockify.git
```

## 三、构建镜像并运行docker

### 3.1 修正Dockerfile

> ################################################################################
>
> # base system
>
> ################################################################################
>
> FROM ubuntu:16.04
>
> #ARG localbuild
>
> #RUN echo "LOCALBUILD=$localbuild"
>
> #RUN rm -rf /var/lib/apt/lists/partial
>
> #RUN if [ "x$localbuild" != "x" ]; then sed -i 's#http://archive.ubuntu.com/#http://tw.archive.ubuntu.com/#' /etc/apt/sources.list; fi
>
> RUN \
>
> sh -c "echo 'deb http://download.opensuse.org/repositories/home:/Horst3180/xUbuntu_16.04/ /' >> /etc/apt/sources.list.d/arc-theme.list"
>
> # && add-apt-repository ppa:fcwu-tw/apps x11vnc
>
> # built-in packages
>
> RUN apt-get update \
>
> && apt-get install -y --no-install-recommends apt-utils software-properties-common curl apache2-utils \
>
> && apt-get update \
>
> && apt-get install -y --no-install-recommends --allow-unauthenticated \
>
> supervisor nginx sudo vim-tiny net-tools zenity xz-utils \
>
> dbus-x11 x11-utils alsa-utils \
>
> mesa-utils libgl1-mesa-dri \
>
> lxde xvfb x11vnc \
>
> gtk2-engines-murrine gnome-themes-standard gtk2-engines-pixbuf gtk2-engines-murrine arc-theme \
>
> firefox chromium-browser \
>
> ttf-ubuntu-font-family ttf-wqy-zenhei apt-utils \
>
> && add-apt-repository -r ppa:fcwu-tw/apps \
>
> && apt-get autoclean \
>
> && apt-get autoremove \
>
> && rm -rf /var/lib/apt/lists/*
>
> # Additional packages require ~600MB
>
> # libreoffice pinta language-pack-zh-hant language-pack-gnome-zh-hant firefox-locale-zh-hant libreoffice-l10n-zh-tw
>
> # tini for subreap
>
> ARG TINI_VERSION=v0.18.0
>
> #ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /bin/tini
>
> RUN \
>
> curl https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini -o /bin/tini && \
>
> chmod +x /bin/tini
>
> # ffmpeg
>
> #RUN mkdir -p /usr/local/ffmpeg \
>
> # && curl -sSL https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-64bit-static.tar.xz | tar xJvf - -C /usr/local/ffmpeg/ --strip 1
>
> ADD ffmpeg-release-64bit-static.tar.xz /usr/local/ffmpeg
>
> #RUN mkdir -p /usr/local/ffmpeg && \
>
> #curl -o ffmpeg-release-64bit-static.tar.xz https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-64bit-static.tar.xz && \
>
> # tar xJvf /tmp/ffmpeg-release-64bit-static.tar.xz - -C /usr/local/ffmpeg/ --strip 1
>
> # python library
>
> COPY image/usr/local/lib/web/backend/requirements.txt /tmp/
>
> RUN apt-get update \
>
> && dpkg-query -W -f='${Package}\n' > /tmp/a.txt \
>
> && apt-get install -y python-pip python-dev build-essential \
>
> && pip install setuptools wheel && pip install -r /tmp/requirements.txt \
>
> && dpkg-query -W -f='${Package}\n' > /tmp/b.txt \
>
> && apt-get remove -y `diff --changed-group-format='%>' --unchanged-group-format='' /tmp/a.txt /tmp/b.txt | xargs` \
>
> && apt-get autoclean -y \
>
> && apt-get autoremove -y \
>
> && rm -rf /var/lib/apt/lists/* \
>
> && rm -rf /var/cache/apt/* /tmp/a.txt /tmp/b.txt
>
> ################################################################################
>
> # builder
>
> ################################################################################
>
> #FROM ubuntu:16.04 as builder
>
> #ARG localbuild
>
> #RUN if [ "x$localbuild" != "x" ]; then sed -i 's#http://archive.ubuntu.com/#http://tw.archive.ubuntu.com/#' /etc/apt/sources.list; fi
>
> RUN apt-get update \
>
> && apt-get install -y --no-install-recommends curl ca-certificates
>
> # nodejs
>
> #RUN rm -rf /var/lib/apt/lists/partia && curl -sL https://deb.nodesource.com/setup_8.x | bash - \
>
> # && apt-cache policy nodejs && apt-get install -y nodejs
>
> RUN rm -rf /var/lib/apt/lists/* && rm -rf /var/lib/apt/lists/partia && apt-get clean
>
> #RUN echo "deb http://deb.nodesource.com/node_11.x xenial main" >> /etc/apt/sources.list.d/node.list
>
> #RUN echo "deb-src http://deb.nodesource.com/node_11.x xenial main" >> /etc/apt/sources.list.d/node.list
>
> RUN curl -s https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add -
>
> RUN curl -sL http://deb.nodesource.com/setup_8.x | bash -
>
> #RUN curl -s http://download.opensuse.org/repositories/home:/Horst3180/xUbuntu_16.04/Release.key | apt-key add -
>
> RUN rm -rf /var/lib/apt/lists/* && rm -rf /var/lib/apt/lists/partia && apt-get clean
>
> RUN apt-get update
>
> RUN apt-get install -y nodejs
>
> # yarn
>
> #RUN curl -s http://download.opensuse.org/repositories/home:/Horst3180/xUbuntu_16.04/Release.key | apt-key add -
>
> RUN apt-get install -y apt-transport-https
>
> #RUN rm -rf /var/lib/apt/lists/partial
>
> #RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \
>
> RUN curl -o pubkey.gpg https://dl.yarnpkg.com/debian/pubkey.gpg && apt-key add pubkey.gpg \
>
> && echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
>
> && apt-get update \
>
> && apt-get install -y yarn
>
> #RUN rm -rf /var/lib/apt/lists/partia && curl -sL https://deb.nodesource.com/setup_8.x | bash - \ # && apt-cache policy nodejs && apt-get install -y nodejs
>
> # build frontend
>
> #RUN echo
>
> COPY web /src/web
>
> RUN nodejs -v && cd /src/web \
>
> && yarn \
>
> && npm run build
>
> ################################################################################
>
> # merge
>
> ################################################################################
>
> #FROM system
>
> #COPY --from=builder /src/web/dist/ /usr/local/lib/web/frontend/
>
> RUN mkdir -p /usr/local/lib/web && cp -a /src/web/dist /usr/local/lib/web/frontend
>
> #&& cp -ar /src/web/static/* /usr/local/lib/web/frontend/static/
>
> #RUN cp -a /usr/local/lib/web/frontend/static/noVNC /usr/local/lib/web/frontend/static/novnc
>
> COPY image /
>
> ADD tini /bin/
>
> RUN chmod a+x /bin/tini
>
> EXPOSE 80
>
> WORKDIR /root
>
> ENV HOME=/home/ubuntu \
>
> SHELL=/bin/bash
>
> HEALTHCHECK --interval=30s --timeout=5s CMD curl --fail http://127.0.0.1:6079/api/health
>
> ENTRYPOINT ["/startup.sh”]

### 3.2 构建镜像

```java
docker build -t ubuntu_desktop_base -f Dockerfile .
```

### 3.3 运行容器并且访问VNC桌面

```java
docker run -dt --rm -p 8080:80 ubuntu_desktop_base 
```

access: [http://172.3.0.3:8080/](http://172.3.0.3:8080/#/)

## 四、在Kubernetes部署

参考：[https://github.com/ConSol/docker-headless-vnc-container](https://github.com/ConSol/docker-headless-vnc-container)

deployment.yaml文件

```java
apiVersion: apps/v1beta1
kind: Deployment
metadata:
  name: headless-vnc
  labels:
    application: headless-vnc
spec:
  1 Pods should exist at all times.
  replicas: 1
  template:
    metadata:
      labels:
        application: headless-vnc
    spec:
      terminationGracePeriodSeconds: 5
      containers:
      - name: headless-vnc
        image: consol/centos-xfce-vnc
        imagePullPolicy: Always
        args:
          make normal UI startup to connect via: oc rsh <pod-name> bash
         - '--tail-log'
        checks that vnc server is up and running
        livenessProbe:
          tcpSocket:
            port: 5901
          initialDelaySeconds: 1
          timeoutSeconds: 1
        checks if http-vnc connection is working
        readinessProbe:
          httpGet:
            path: /
            port: 6901
            scheme: HTTP
          initialDelaySeconds: 1
          timeoutSeconds: 1
```

service.yaml

```java
apiVersion: v1
kind: Service
metadata:
  labels:
    application: headless-vnc
  name: headless-vnc
spec:
  externalName: headless-vnc
  ports:
  - name: http-port-tcp
    protocol: TCP
    port: 6901
    targetPort: 6901
    nodePort: 32001
  - name: vnc-port-tcp
    protocol: TCP
    port: 5901
    targetPort: 5901
    nodePort: 32002
  selector:
    application: headless-vnc
  type: NodePort
# Use type loadbalancer if needed
#  type: LoadBalancer
```

进行部署

```java
kubectl apply -f  kubernetes/kubernetes.headless-vnc.example.deployment.yaml
[root@k8s-node-01 docker-headless-vnc-container]# kubectl get pods --output=wide -n docker-gui
NAME                            READY     STATUS    RESTARTS   AGE       IP               NODE          NOMINATED NODE
headless-vnc-57d7d99b74-drbrf   1/1       Running   0          6m        10.244.127.245   k8s-node-04   <none>
```

通过nodePort进行访问

```java
http://172.2.2.14:32001/?password=vncpassword
```

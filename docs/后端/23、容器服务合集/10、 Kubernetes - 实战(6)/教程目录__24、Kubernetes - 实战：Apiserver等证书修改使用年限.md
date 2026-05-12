# 24、Kubernetes - 实战：Apiserver等证书修改使用年限
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/6/24.html
- 分类：容器服务
- 分组：教程目录
## Kubernetes证书使用年限修改方法

**Kubernetes的apiservice.crt证书默认只有一年的使用期限，查看方法：**

```java
cd /etc/kubernetes/pki
[root@Centos8 pki]# openssl x509 -in apiserver.crt -text -noout
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number: 8195991627692645852 (0x71be02f60eb21ddc)
        Signature Algorithm: sha256WithRSAEncryption
        Issuer: CN = kubernetes
        Validity
            Not Before: Apr 11 10:52:03 2020 GMT
            Not After : Apr 11 10:52:03 2021 GMT
...
```

> 可以看到，默认的证书到2021年就会过期。

## 但是，并不是Kubernetes内所有的证书期限都是一年，比如下边的ca.crt：

```java
[root@Centos8 pki]# openssl x509 -in ca.crt -text -noout
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number: 0 (0x0)
        Signature Algorithm: sha256WithRSAEncryption
        Issuer: CN = kubernetes
        Validity
            Not Before: Apr 11 10:52:03 2020 GMT
            Not After : Apr  9 10:52:03 2030 GMT
...
```

> 此证书的期限就是10年。

**Kubernetes集群版本在更新时，就会自动更新apiserver.crt证书的使用期限，这可能也是k8s官方设置这一年期限的原因 —— 为了让使用者跟上版本更新的步伐。**

**但是有一些公司就会选取一个稳定版本一直使用下去，这就会使用本节所介绍的内容：如何修改证书的使用年限。**

## 证书修改流程

由于k8s是基于kubeadm安装的，所以只需修改kubeadm源码中的证书期限即可。 kubeadm是采用go语言编写，所以我们要现在本机安装go语言环境，然后将对应版本的kubeadm源码进行修改，修改后重新编译，再用新编译的kubeadm生成新证书即可。

## 1、安装go环境

```java
## 下载
cd /data
wget https://studygolang.com/dl/golang/go1.15.4.linux-amd64.tar.gz
## 解压
tar zxvf go1.15.4.linux-amd64.tar.gz -C /usr/local/
## 添加环境变量
vim /etc/bashrc
...
export PATH=$PATH:/usr/local/go/bin
...
## 刷新
source /etc/bashrc
## 检查环境变量
echo $PATH
/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/root/bin:/usr/local/go/bin
## 检查go版本
[root@Centos8 ~]# go version 
go version go1.15.4 linux/amd64
```

## 2、下载kubernetes项目源码

```java
## 下载
[root@Centos8 ~]# git clone https://github.com/kubernetes/kubernetes.git
## 查看本地kubeadm版本
[root@Centos8 ~]# kubeadm version 
kubeadm version: &version.Info{Major:"1", Minor:"15", GitVersion:"v1.15.1"
## 将源码切换至v1.15.1版本
cd kubernetes
git checkout -b remotes/origin/release-1.15.1 v1.15.1
```

## 3、修改kubeadm源码包更新证书策略

```java
vim staging/src/k8s.io/client-go/util/cert/cert.go  kubeadm 1.14版本及之前
vim cmd/kubeadm/app/util/pkiutil/pki_helpers.go  kubeadm 1.14之后,版本越高，文件可能不一样，还需具体查看官方文档确认
...
func NewSignedCert(cfg *certutil.Config, key crypto.Signer, caCert *x509.Certificate, caKey crypto.Signer) (*x509.Certificate, error) {
  const duration3650d = time.Hour * 24 * 365 * 10  在此模块下添加此行，即表示10年，如需100年将10改为100即可
## 上边的常量添加好后，修改下边的NotAfter参数
NotAfter:     time.Now().Add(duration3650d).UTC(),
...
## 更改完成后，重新编译kubeadm
[root@Centos8 kubernetes]# make WHAT=cmd/kubeadm GOFLAGS=-v
```

## 4、替换kubeadm命令

```java
## 编译成功后，生成在_output/bin/kubeadm
## 移除旧命令，添加新命令
mv /usr/bin/kubeadm /usr/bin/kubeadm.bak
cp _output/bin/kubeadm /usr/bin/kubeadm && chmod +x /usr/bin/kubeadm
## 备份下pki目录，以防更新失败
[root@Centos8 kubernetes]# cp -a pki pki.old
## 开始使用新kubeadm命令更新证书，--config指定kubeadm-config文件，目录可能不同，根据实际情况更改
[root@Centos8 kubernetes]# kubeadm alpha certs renew all --config=/usr/local/install-k8s/core/kubeadm-config.yaml
certificate embedded in the kubeconfig file for the admin to use and for kubeadm itself renewed
certificate for serving the Kubernetes API renewed
certificate the apiserver uses to access etcd renewed
certificate for the API server to connect to kubelet renewed
certificate embedded in the kubeconfig file for the controller manager to use renewed
certificate for liveness probes to healtcheck etcd renewed
certificate for etcd nodes to communicate with each other renewed
certificate for serving etcd renewed
certificate for the front proxy client renewed
certificate embedded in the kubeconfig file for the scheduler manager to use renewed
```

## 5、检查是否更新成功

```java
[root@Centos8 pki]# openssl x509 -in apiserver.crt -text -noout
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number: 5901742195310036191 (0x51e73342036384df)
        Signature Algorithm: sha256WithRSAEncryption
        Issuer: CN = kubernetes
        Validity
            Not Before: Apr 11 10:52:03 2020 GMT
            Not After : Nov 11 08:01:16 2030 GMT
```

> 可以看到，证书期限已经成功更新到10年

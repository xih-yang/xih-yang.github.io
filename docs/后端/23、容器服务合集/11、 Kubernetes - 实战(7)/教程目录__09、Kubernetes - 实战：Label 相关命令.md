# 09、Kubernetes - 实战：Label 相关命令
- 来源：https://ddkk.com/zhuanlan/container/kubernetes/7/9.html
- 分类：容器服务
- 分组：教程目录
## 一、环境安装

参考

[MiniKube方式部署](/zhuanlan/container/kubernetes/7/3.html)

[KubeAdm方式部署](/zhuanlan/container/kubernetes/7/4.html)

[Kind方式部署](/zhuanlan/container/kubernetes/7/5.html)

## 二、Label的作用

### 1、Label含义

Label其实就一对 key/value ，被关联到对象上，比如Pod,标签的使用我们倾向于能够标示对象的特殊特点，Labels的值对系统本身并没有什么含义，只是对用户才有意义。

同一个资源对象的labels属性的key必须唯一，label可以附加到各种资源对象上，如Node,Pod,Service,RC等。一个资源拥有多个标签，可以实现不同维度的管理。标签(Label)的组成: key=value。Label可以在创建对象时就附加到对象上，也可以在对象创建后通过API进行额外添加或修改。

### 2、Label命名规范

label 必须以字母或数字开头，可以使用字母、数字、连字符、点和下划线，最长63个字符。

### 3、使用Label原因

当相同类型的资源越来越多，对资源划分管理是很有必要，此时就可以使用Label为资源对象 命名，以便于配置，部署等管理工作，提升资源的管理效率。label 作用类似Java包能对不同文件分开管理，让整体更加有条理，有利于维护。

## 三、Label的使用

### 1、查看标签

```java
kubectl get pod nginx -n dev --show-labels
```

### 2、为 Pod 资源打标签

```java
kubectl label pod nginx xxx=ccc -n dev
```

查看标签

kubectl get pod --show-labels -n dev

### 3、为 Pod 资源更新标签

```java
kubectl label pod nginx xxx=ddd -n dev --overwrite
```

### 4、筛选标签

-l参数 指定要筛选的标签

```java
kubectl get pod -n dev -l xxx=ddd --show-labels
```

### 5、删除标签

标签-，如：xxx-

```java
kubectl label pod nginx xxx- -n dev
```

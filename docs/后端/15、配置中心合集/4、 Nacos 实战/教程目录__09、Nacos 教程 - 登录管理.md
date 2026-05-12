# 09、Nacos 教程 - 登录管理
- 来源：https://ddkk.com/zhuanlan/registered/nacos/1/9.html
- 分类：注册中心
- 分组：教程目录
## 前言

Nacos当前版本支持简单的登录功能，默认用户名密码都是nacos。

## 修改默认用户名/密码（仅供了解）

**1、** 生成加密密码；

引入依赖

```java
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-core</artifactId>
    <version>5.5.2</version>
</dependency>
```

nacos的密码采用BCrypt加密方式在每次生成密码时会随机加盐，所以生成密码每次可能不一样。

```java
public static void main(String[] args) {
    System.out.println(new BCryptPasswordEncoder().encode("123456"));
}
```

运行代码，获取结果

**2、** 复制加密的密码，替换到nacos数据库即可；

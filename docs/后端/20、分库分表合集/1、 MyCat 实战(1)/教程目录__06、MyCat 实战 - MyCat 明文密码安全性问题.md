# 06、MyCat 实战 - MyCat 明文密码安全性问题
- 来源：https://ddkk.com/zhuanlan/sharding/mycat/1/6.html
- 分类：分库分表
- 分组：教程目录
在schema.xml 配置文件中，我们在配置 物理库 信息时，会对 url、user、password 等进行配置，但是这里用到的 password 会使用到明文密码。在线上环境中，如果我们使用这种明文密码，显然是不安全的。

针对这种问题，MyCat 为我们提供了解决方案。我们进入 mycat/lib 目录下，此时我们会看到一个 Mycat-server-xxxxxx 开头的jar 包。

通过使用如下命令，便能够完成对密码的加密操作。

> 命令：java -cp Mycat-server-1.6.7.3-release.jar io.mycat.util.DecryptUtil 1:hostM1:root:123456

这里的1 指什么呢？hostM1又是指什么呢？接下来详细简解

**其中 0:user:password是加密字符串，有两种格式：**

**1.dataHost加密格式：**

1:hostM1:root:123456

**注释：**

1代表是dataHost加密

`hostM1是<writeHost host="hostM1"`

root是user="root"

123456是 password=明文密码(123456)

**对应 writeHost 配置：**

```xml
<writeHost host="hostM1" url="localhost:3306" user="root"  
password="BpkNIjF7LfzS1C76HT7B1bJgmGIDtPihqIvHBlC92L1IFqsMfoJEMk1EkxSzjaJstdAp5w=="  **usingDecrypt="1"**>  
<!-- can have multi read hosts -->  
</writeHost>
```

**0.mycat用户登录密码加密格式**

0:root:123456

**注释：**

0代表mycat用户登录密码加密

**对应 user 配置：**

```xml
<user name="root" defaultAccount="true">  
<property name="usingDecrypt">1</property>  
<property name="password">d6D+pOmkuUoY09p4/aivwMsScLa7zfjIwAxvkEhr3v7en06mEXoX==</property>  
<property name="schemas">TESTDB</property>  
</user>
```

**注意！！！**

使用密文，**需要添加 usingDecrypt="1"** ，改属性默认值为0

```xml
<writeHost host="hostM1" url="192.168.204.201:3306" user="root" password="明文密码">  
<!-- can have multi read hosts -->  
<readHost host="hostS1" url="192.168.204.202:3306" user="root" password="密文密码" **usingDecrypt="1"**/>  
</writeHost>
```

**加密后的密码，如下图所示**

接下来，你便可以使用 **加密后的密码** + **usingDecrypt 属性** 来使用密文密码了。

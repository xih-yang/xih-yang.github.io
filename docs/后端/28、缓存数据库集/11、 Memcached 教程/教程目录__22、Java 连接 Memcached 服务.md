# 22、Java 连接 Memcached 服务
- 来源：https://ddkk.com/zhuanlan/db/memcached/22.html
- 分类：缓存数据库
- 分组：教程目录
Memcached 是简单的 key-value 内存缓存系统

JAVA 操作 Memcached 有两大类库:

- **Spymemcached** Spymemcached是 Memcached 的一个流行的Java client库
- **XMemcached** 原淘宝的伯岩/庄晓丹开发的XMemcached，性能表现出色，广泛应用于 Java + Memcached 项目中

我们接下来的范例使用 2.0.13 版本的 **Spymemcached** 包

### 把 Spymemcached 添加 classpath 中

#### 1. 先下载 Spymemcached

本站下载地址

[https://ddkk.com/static/download/spymemcached-2.10.3.jar](https://ddkk.com/static/download/spymemcached-2.10.3.jar)

Google Code jar 包下载地址

[https://storage.googleapis.com/google-code-archive-downloads/v2/code.google.com/spymemcached/spymemcached-2.10.3.jar](https://storage.googleapis.com/google-code-archive-downloads/v2/code.google.com/spymemcached/spymemcached-2.10.3.jar)

> 可能无法下载，原因你懂得

#### 2. 然后将 spymemcached-2.10.3.jar 拖到 classpath 环境变量中

## Memcached 服务

假设你已经安装了 Memcached，如果你没有安装，可以到 Linux(Centos/Ubuntu) Memcached 安装 学习如何安装 Memcached

我们的范例的 Memcached 服务的主机为 127.0.0.1 端口为 11211

### Java 连接 Memcached 范例

```sh
package com.ddkk.demo;
import net.spy.memcached.MemcachedClient;
import java.net.*;
public class MemcachedJavaDemo {
   public static void main(String[] args) {
      try{
         // 创建 Memcached 实例
         MemcachedClient mc = new MemcachedClient(new InetSocketAddress("127.0.0.1", 11211));
         System.out.println("成功连接到 Memcached 服务");
         // 关闭连接
         mc.shutdown();
      }catch(Exception ex){
         System.out.println( ex.getMessage() );
      }
   }
}
```

运行范例输出如下信息

```sh
成功连接到 Memcached 服务
```

### 范例：set 操作

我们使用 java.util.concurrent.Future 来存储命令的返回值

```sh
package com.ddkk.demo;
import java.net.InetSocketAddress;
import java.util.concurrent.Future;
import net.spy.memcached.MemcachedClient;
public class MemcachedJavaDemo {
   public static void main(String[] args) {
      try{
         // 创建 Memcached 实例
         MemcachedClient mc = new MemcachedClient(new InetSocketAddress("127.0.0.1", 11211));
         System.out.println("成功连接到 Memcached 服务");
         // 先清空缓存
         mc.flush();
         // 存储数据
         Future fo = mc.set("site", 1000, "ddkk.com");
         // 查看存储状态
         System.out.println("set 状态:" + fo.get());
         // 输出值
         System.out.println("site value in cache is: " + mc.get("site"));
         // 关闭连接
         mc.shutdown();
      }catch(Exception ex){
         System.out.println( ex.getMessage() );
      }
   }
}
```

运行范例输出如下信息：

```sh
成功连接到 Memcached 服务
set 状态:true
site value in cache is: ddkk.com
```

### add 操作范例

```sh
package com.ddkk.demo;
import java.net.InetSocketAddress;
import java.util.concurrent.Future;
import net.spy.memcached.MemcachedClient;
public class MemcachedJavaDemo {
   public static void main(String[] args) {
      try{
         // 创建 Memcached 实例
         MemcachedClient mc = new MemcachedClient(new InetSocketAddress("127.0.0.1", 11211));
         System.out.println("成功连接到 Memcached 服务");
         // 先清空缓存
         mc.flush();
         // 添加数据
         Future fo = mc.set("site", 1000, "ddkk.com");
         // 打印状态
         System.out.println("set 状态:" + fo.get());
         // 输出
         System.out.println("site value in cache is: " + mc.get("site"));
         // 添加
         fo = mc.add("site", 1000, "souyunku.cn");
         // 打印状态
         System.out.println("add 状态:" + fo.get());
         // 添加新key
         fo = mc.add("age", 1000, "28");
         // 打印状态
         System.out.println("add 状态:" + fo.get());
         // 输出
         System.out.println("age value in cache is: " + mc.get("age"));
         // 关闭连接
         mc.shutdown();
      }catch(Exception ex){
         System.out.println(ex.getMessage());
      }
   }
}
```

运行范例输出如下信息:

```sh
成功连接到 Memcached 服务
set 状态:true
site value in cache is: ddkk.com
add 状态:false
add 状态:true
age value in cache is: 28
```

### replace 操作范例

```sh
package com.ddkk.demo;
import java.net.InetSocketAddress;
import java.util.concurrent.Future;
import net.spy.memcached.MemcachedClient;
public class MemcachedJavaDemo {
   public static void main(String[] args) {
      try{
         // 创建 Memcached 实例
         MemcachedClient mc = new MemcachedClient(new InetSocketAddress("127.0.0.1", 11211));
         System.out.println("成功连接到 Memcached 服务");
         // 先清空缓存
         mc.flush();
         // 添加第一个 key value 对
         Future fo = mc.set("site", 1000, "ddkk.com");
         // 输出执行 add 方法后的状态
         System.out.println("add 状态:" + fo.get());
         // 获取键对应的值
         System.out.println("site value in cache is : " + mc.get("site"));
         // 添加新的 key
         fo = mc.replace("site", 900, "https://ddkk.com/");
         // 输出执行 set 方法后的状态
         System.out.println("replace status:" + fo.get());
         // 获取键对应的值
         System.out.println("site value in cache is: " + mc.get("site"));
         // 关闭连接
         mc.shutdown();
      }catch(Exception ex){
         System.out.println( ex.getMessage() );
      }
   }
}
```

运行范例输出如下信息:

```sh
成功连接到 Memcached 服务
add 状态:true
site value in cache is : ddkk.com
replace status:true
site value in cache is: https://ddkk.com/
```

### append 操作范例

```sh
package com.ddkk.demo;
import java.net.InetSocketAddress;
import java.util.concurrent.Future;
import net.spy.memcached.MemcachedClient;
public class MemcachedJavaDemo {
   public static void main(String[] args) {
      try{
         // 创建 Memcached 实例
         MemcachedClient mc = new MemcachedClient(new InetSocketAddress("127.0.0.1", 11211));
         System.out.println("成功连接到 Memcached 服务");
         // 先清空缓存
         mc.flush();
         // 添加数据
         Future fo = mc.set("greeting", 1000, "你好，世界！");
         // 输出执行 set 方法后的状态
         System.out.println("set status:" + fo.get());
         // 获取键对应的值
         System.out.println("greeting value in cache is: " + mc.get("greeting"));
         // 对存在的key进行数据添加操作
         fo = mc.append("greeting", "你好，教程 ");
         // 输出执行 set 方法后的状态
         System.out.println("append status:" + fo.get());
         // 获取键对应的值
         System.out.println("greeting value in cache - " + mc.get("greeting"));
         // 关闭连接
         mc.shutdown();
      }catch(Exception ex){
         System.out.println(ex.getMessage());
      }
   }
}
```

运行范例输出如下信息

```sh
成功连接到 Memcached 服务
set status:true
greeting value in cache is: 你好，世界！
append status:true
greeting value in cache - 你好，世界！你好，教程 
```

### prepend 操作范例

```sh
package com.ddkk.demo;
import java.net.InetSocketAddress;
import java.util.concurrent.Future;
import net.spy.memcached.MemcachedClient;
public class MemcachedJavaDemo {
   public static void main(String[] args) {
      try{
         // 创建 Memcached 实例
         MemcachedClient mc = new MemcachedClient(new InetSocketAddress("127.0.0.1", 11211));
         System.out.println("成功连接到 Memcached 服务");
         // 先清空缓存
         mc.flush();
         // 添加数据
         Future fo = mc.set("site", 900, "ddkk.com");
         // 输出执行 set 方法后的状态
         System.out.println("set status:" + fo.get());
         // 获取键对应的值
         System.out.println("site value in cache is: " + mc.get("site"));
         // 对存在的key进行数据添加操作
         fo = mc.prepend("site", "https://");
         // 输出执行 set 方法后的状态
         System.out.println("prepend status:" + fo.get());
         // 获取键对应的值
         System.out.println("site value in cache - " + mc.get("site"));
         // 关闭连接
         mc.shutdown();
      }catch(Exception ex){
         System.out.println(ex.getMessage());
      }
   }
}
```

运行范例输出如下信息

```sh
成功连接到 Memcached 服务
set status:true
site value in cache is: ddkk.com
prepend status:true
site value in cache - https://ddkk.com
```

### CAS 操作范例

```sh
package com.ddkk.demo;
import java.net.InetSocketAddress;
import java.util.concurrent.Future;
import net.spy.memcached.CASValue;
import net.spy.memcached.CASResponse;
import net.spy.memcached.MemcachedClient;
public class MemcachedJavaDemo {
   public static void main(String[] args) {
      try{
         // 创建 Memcached 实例
         MemcachedClient mc = new MemcachedClient(new InetSocketAddress("127.0.0.1", 11211));
         System.out.println("成功连接到 Memcached 服务");
         // 先清空缓存
         mc.flush();
         // 添加数据
         Future fo = mc.set("site", 1000, "ddkk.com");
         // 输出执行 set 方法后的状态
         System.out.println("set status:" + fo.get());
         // 使用 get 方法获取数据
         System.out.println("site value in cache - " + mc.get("site"));
         // 通过 gets 方法获取 CAS token（令牌）
         CASValue casValue = mc.gets("site");
         // 输出 CAS token（令牌） 值
         System.out.println("CAS token is: " + casValue);
         // 尝试使用cas方法来更新数据
         CASResponse casresp = mc.cas("site", casValue.getCas(), 900, "https://ddkk.com");
         // 输出 CAS 响应信息
         System.out.println("CAS Response is: " + casresp);
         // 输出值
         System.out.println("site value in cache is:  " + mc.get("site"));
         // 关闭连接
         mc.shutdown();
      }catch(Exception ex){
         System.out.println(ex.getMessage());
      }
   }
}
```

运行范例输出如下信息

```sh
成功连接到 Memcached 服务
set status:true
site value in cache - ddkk.com
CAS token is: {CasValue 13/ddkk.com}
CAS Response is: OK
site value in cache is:  https://ddkk.com
```

### get 操作范例

```sh
package com.ddkk.demo;
import java.net.InetSocketAddress;
import java.util.concurrent.Future;
import net.spy.memcached.MemcachedClient;
public class MemcachedJavaDemo {
   public static void main(String[] args) {
      try{
         // 创建 Memcached 实例
         MemcachedClient mc = new MemcachedClient(new InetSocketAddress("127.0.0.1", 11211));
         System.out.println("成功连接到 Memcached 服务");
         // 先清空缓存
         mc.flush();
         // 添加数据
         Future fo = mc.set("site", 1000, "ddkk.com");
         // 输出执行 set 方法后的状态
         System.out.println("set status:" + fo.get());
         // 使用 get 方法获取数据
         System.out.println("site value in cache is: " + mc.get("site"));
         // 关闭连接
         mc.shutdown();
      }catch(Exception ex){
         System.out.println(ex.getMessage());
      }
   }
}
```

运行范例输出如下信息:

```sh
成功连接到 Memcached 服务
set status:true
site value in cache is: ddkk.com
```

### gets 操作范例

```sh
package com.ddkk.demo;
import java.net.InetSocketAddress;
import java.util.concurrent.Future;
import net.spy.memcached.CASValue;
import net.spy.memcached.CASResponse;
import net.spy.memcached.MemcachedClient;
public class MemcachedJavaDemo {
   public static void main(String[] args) {
      try{
         // 创建 Memcached 实例
         MemcachedClient mc = new MemcachedClient(new InetSocketAddress("127.0.0.1", 11211));
         System.out.println("成功连接到 Memcached 服务");
         // 先清空缓存
         mc.flush();
         // 添加数据
         Future fo = mc.set("site", 1000, "ddkk.com");
         // 输出执行 set 方法后的状态
         System.out.println("set status:" + fo.get());
         // 从缓存中获取键为 DDKK.COM 弟弟快看，程序员编程资料站 的值
         System.out.println("site value in cache is: " + mc.get("site"));
         // 通过 gets 方法获取 CAS token（令牌）
         CASValue casValue = mc.gets("site");
         // 输出 CAS token（令牌） 值
         System.out.println("CAS value in cache is: " + casValue);
         // 关闭连接
         mc.shutdown();
      }catch(Exception ex){
         System.out.println(ex.getMessage());
      }
   }
}
```

运行范例输出如下信息:

```sh
成功连接到 Memcached 服务
set status:true
site value in cache is: ddkk.com
CAS value in cache is: {CasValue 11/ddkk.com}
```

### delete 操作范例

```sh
package com.ddkk.demo;
import java.net.InetSocketAddress;
import java.util.concurrent.Future;
import net.spy.memcached.MemcachedClient;
public class MemcachedJavaDemo {
   public static void main(String[] args) {
      try{
         // 创建 Memcached 实例
         MemcachedClient mc = new MemcachedClient(new InetSocketAddress("127.0.0.1", 11211));
         System.out.println("成功连接到 Memcached 服务");
         // 先清空缓存
         mc.flush();
         // 添加数据
         Future fo = mc.set("site", 1000, "ddkk.com");
         // 输出执行 set 方法后的状态
         System.out.println("set status:" + fo.get());
         // 获取键对应的值
         System.out.println("site value in cache is: " + mc.get("site"));
         // 对存在的key进行数据添加操作
         fo = mc.delete("site");
         // 输出执行 delete 方法后的状态
         System.out.println("delete status:" + fo.get());
         // 获取键对应的值
         System.out.println("site value in cache is: " + mc.get("site"));
         // 关闭连接
         mc.shutdown();
      }catch(Exception ex){
         System.out.println(ex.getMessage());
      }
   }
}
```

运行范例输出如下信息:

```sh
成功连接到 Memcached 服务
set status:true
site value in cache is: ddkk.com
delete status:true
site value in cache is: null
```

### Incr/Decr 操作范例

```sh
package com.ddkk.demo;
import java.net.InetSocketAddress;
import java.util.concurrent.Future;
import net.spy.memcached.MemcachedClient;
public class MemcachedJavaDemo {
   public static void main(String[] args) {
      try{
         // 创建 Memcached 实例
         MemcachedClient mc = new MemcachedClient(new InetSocketAddress("127.0.0.1", 11211));
         System.out.println("成功连接到 Memcached 服务");
         // 先清空缓存
         mc.flush();
         // 添加数字值
         Future fo = mc.set("countdown", 1000, "1000");
         // 输出执行 set 方法后的状态
         System.out.println("set status:" + fo.get());
         // 获取键对应的值
         System.out.println("value in cache is : " + mc.get("countdown"));
         // 自增并输出
         System.out.println("value in cache after increment is: " + mc.incr("countdown", 111));
         // 自减并输出
         System.out.println("value in cache after decrement is " + mc.decr("countdown", 112));
         // 关闭连接
         mc.shutdown();
      }catch(Exception ex)
      {
         System.out.println(ex.getMessage());
      }
   }
}
```

运行范例输出如下信息:

```sh
成功连接到 Memcached 服务
set status:true
value in cache is : 1000
value in cache after increment is: 1111
value in cache after decrement is 999
```

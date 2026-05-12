# 11、JDBC 教程 - SQL注入问题
- 来源：https://ddkk.com/zhuanlan/db/jdbc/2/11.html
- 分类：缓存数据库
- 分组：教程目录
## (一)问题引入

其实上一篇博客写的登录Demo是有**BUG**的

我们输入一个**不存在的用户名**加一个**特殊的密码**，就可以登录成功了

## (二)SQL注入问题

**1、** 输入用户随便，输入密码`a'or'a'='a`就可以登录成功；

**2、** sql：`select*fromuserwhereusername='zzq'andpassword='a'or'a'='a'`；

我们在MySQL执行这条语句试试：

可以看到在**拼接sql**时，有一些sql的**特殊关键字**参与字符串的拼接。会造成**安全性问题**

## (三)解决sql注入问题

使用**PreparedStatement**对象解决

预编译的SQL：参数使用`?`作为占位符

**步骤**：

**1、** 前面的步骤都一样；

**2、** 定义sql：；

`select * from user where username = ? and password = ?;`
**3、** 获取执行sql语句的对象**PreparedStatement**；

`Connection.prepareStatement(String sql)`
**4、** 给`?`赋值；

**方法**：setxxx(参数1,参数2)

其中**参数1**是指？的位置编号，从1开始；**参数2**是？的值

**5、** 执行sql，接收返回的结果，不需要传递sql语句；

**6、** 后面的步骤也跟之前一样；

## (四)Coding

我们对之前的登录案例的Demo Debug

**1、****修改定义的sql**；

```java
//2.定义sql
String sql = "select * from user where username = ? and password = ?";
```

**1、****修改sql的执行对象**；

```java
//3.获取执行sql的对象
pstmt = conn.prepareStatement(sql);
```

**1、****给?赋值**；

```java
//给?赋值
pstmt.setString(1, username);
pstmt.setString(2, password);
```

**1、****修改执行sql**；

```java
//4.执行查询
rs = pstmt.executeQuery();
```

**1、****释放资源**；

**2、****问题解决**；

**注意**：

**1、** 后期都会使用**prepareStatement**来完成所以的**增删改查**操作；

**2、** 因为它可以防止SQL注入，并且效率更高；

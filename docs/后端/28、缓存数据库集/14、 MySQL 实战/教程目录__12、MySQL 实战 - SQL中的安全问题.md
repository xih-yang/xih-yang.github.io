# 12、MySQL 实战 - SQL中的安全问题
- 来源：https://ddkk.com/zhuanlan/db/mysql/2/12.html
- 分类：缓存数据库
- 分组：教程目录
日常开发过程中我们通常只关心SQL语句能否实现预期功能，往往忽略了SQL语句可能会带来的系统漏洞，常遇到的就是SQL注入。

## 一、SQL注入简介

这里不做抽象的解释，可能说完也不会明白，直接用例子来演示SQL注入：

**1. 首先我们创建一张表并插入一条数据来模拟实际情况下接触不到的数据库**

```java
CREATE TABLE users (
　　id int(11) NOT NULL AUTO_INCREMENT,
　　username varchar(64) NOT NULL,
　　password varchar(64) NOT NULL,
　　email varchar(64) NOT NULL,
　　PRIMARY KEY (id),
　　UNIQUE KEY username (username)
　　);
INSERT INTO users (username,password,email)
　　VALUES('test',md5('admin'),'test@admin.com');
```

**2. 登陆界面，提交了用户名和密码后，表单会将数据提交给后台进行验证**

```java
<html>
<head>
<title>Sql注入演示</title>
<meta http-equiv="content-type" content="text/html;charset=utf-8">
</head>
<body >
<form action="validate.php" method="post">
  <fieldset >
    <legend>Sql注入演示</legend>
    <table>
      <tr>
        <td>用户名：</td>
        <td><input type="text" name="username"></td>
      </tr>
      <tr>
        <td>密  码：</td>
        <td><input type="text" name="password"></td>
      </tr>
      <tr>
        <td><input type="submit" value="提交"></td>
        <td><input type="reset" value="重置"></td>
      </tr>
    </table>
  </fieldset>
</form>
</body>
</html>
```

**3.验证模块（PHP语言）**

```java
<?php
       $conn=@mysql_connect("localhost",'root','') or die("数据库连接失败！");;
       mysql_select_db("injection",$conn) or die("您要选择的数据库不存在");
       $name=$_POST['username'];
       $pwd=$_POST['password'];
       $sql="select * from users where username='$name' and password='$pwd'";
       $query=mysql_query($sql);
       $arr=mysql_fetch_array($query);
       if(is_array($arr)){
              header("Location:manager.php");
       }else{
              echo "您的用户名或密码输入有误，<a href=\"Login.php\">请重新登录！</a>";
       }
?>
```

代码分析：如果，用户名和密码都匹配成功的话，将跳转到管理员操作界面(manager.php)，不成功，则给出友好提示信息。

注意到了没有，我们直接将用户提交过来的数据(用户名和密码)直接拿去执行，并没有实现进行特殊字符过滤，这就是SQL注入的基础，待会就能看出这样做的风险有多大。

**4. 注入演示**

当我们在验证界面填写正确的用户名 test 和密码 admin 时，会成功登陆，它执行的SQL语句为：select * from users where username='test' and password=md5('admin') ，显然这条记录在数据库中存在，因此能成功登陆。

当我们在用户名输入框那输入 ’ or 1=1 # ，密码随便输，此时在验证过程中的SQL语句就是：select * from users where username='' or 1=1 # and password=md5('') ，由于#、/*在SQL语句中是注释语句的开头标识，因此，后面的都被注释掉了，从而上面的SQL语句相当于 select * from users where username='' or 1=1，此时我们发现1=1恒成立，而且使用的是or连接，故而这条语句又等价于 select * from users ，显然，不管什么情况下该语句都能成功执行，也就是说我这样输入用户名不用管密码都可以成功登陆，这明显是不对的。

这就大概说明了SQL是怎样进行注入的，你可能觉得不就是多一个登陆嘛，没什么危害，那你可能是还没有看到它的厉害之处。既然我能假登陆，那我也可以通过这样构造SQL来获取你的数据库信息，得到超级管理权权限，进而对你的数据随意更改，这下你知道它的厉害了吧。更详细说明参见[https://www.2cto.com/article/201310/250877.html](https://www.2cto.com/article/201310/250877.html)博客。

## 二、防范措施

#### 2.1 PrepareStatement + Bind-Variable

这种方法只能针对Java、JSP开发的应用。因为PrepareStatement语句是由JDBC驱动来支持的，它仅仅是做了一些替换和转义，MySQL本身只是绑定了变量。

避免SQL注入的原理：sql注入只对sql语句的准备(编译)过程有破坏作用，而PreparedStatement已经准备好了，执行阶段只是把输入串作为数据处理，而不再对sql语句进行解析准备,因此也就避免了sql注入问题。

比如上面用户名传的变量是 ” ’ or 1=1 # “，企图利用构造SQL语句来蒙混过关，但由于使用了PreparedStatement绑定变量，里面的引号被转义，#号被绑定到字符串上，从而它只能作为参数传递给已经预编译好的SQL语句，从而它无法和SQL语句组合后再编译执行，这样就避免了注入攻击。

使用好处：

(1).代码的可读性和可维护性好；

(2).PreparedStatement尽最大可能提高性能；

(3).最重要的一点是极大地提高了安全性；

所以一般能使用这种方法就推荐使用这种方式防范SQL注入。

#### 2.2 使用应用程序提供的转换函数

很多应用程序接口都提供了对特殊字符进行转换的函数，利用他们可以对用户的输入进行转换，防止生成不被期望的语句。

- MySQL C API：使用mysql_real_escape_string() API调用；
- MySQL++：使用escape和quote修饰符；
- PHP：4.3版本之前使用mysql_real_escape_string()函数，PHP5开始使用扩展的MySQLI；
- Perl DBI：使用placeholders或者quote()方法；
- Ruby DBI：使用placeholders或者quote()方法；

#### 2.3 自定义函数进行校验

可以使用自定义的函数对输入进行校验，输入验证的途径可分为以下几种：

- 整理数据使之变得有效；
- 拒绝已知的非法输入；
- 只接受已知的合法输入；

比如可以通过正则表达式来过滤掉非法字符，这样攻击者就无法通过字符的组合来注入SQL，从而防范攻击。可以将非法字符列出，如果有新增的就加入到这里面，还要注意字符的变形，比如它的16进制表示形式等。

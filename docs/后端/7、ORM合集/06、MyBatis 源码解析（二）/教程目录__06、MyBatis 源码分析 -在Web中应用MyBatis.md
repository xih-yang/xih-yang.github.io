# 06、MyBatis 源码分析 -在Web中应用MyBatis
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/7/6.html
- 分类：ORM框架
- 分组：教程目录
## 一、概述与准备工作

- 我们通过一个银行转账的案例来实现在**Web**应用中应用**mybatis**
- 了解 **mybatis** 中三大对象的作用域
- 采用 MVC 的架构模式，应用了 **ThreadLocal** 的线程绑定机制
- 准备工作如下：

🌔1、我们需要提前设计一个简单的表 **t_act**，包含三个属性

直接在**Navicat** 中手动添加两条记录

🌔2、在我们的项目中添加一个新的模块 **mybatis-004-web**

（1）与之前有所不同，此次选择 **Maven Archetype**，然后在**Archetype**处指定**webapp**【快速生成**web**项目】

（2）手动升级 **web.xml** 版本，我直接找到我 **tomcat** 安装文件夹中的 **web.xml** 复制上面的内容:

```java
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="https://jakarta.ee/xml/ns/jakartaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="https://jakarta.ee/xml/ns/jakartaee
                      https://jakarta.ee/xml/ns/jakartaee/web-app_5_0.xsd"
         version="5.0"
         metadata-complete="true">
</web-app>
```

- 此处有一个需要注释的地方：
- 如果 `metadata-complete="true"`，那么仅支持在web.xml文件中去配置
- 如果`metadata-complete="false"`,那么也可以通过注解去配置【面向注解开发】

（3）配置 **pom.xml** 文件，确定打包方式和配置依赖

- 因为是web项目，所以打包方式为 **war** 包，
- 采用**MVC**的架构模式，所以我们需要 **mybatis、mysql、junit、logback、servlet** 的依赖

```java
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.powernode</groupId>
  <artifactId>mybatis-004-web</artifactId>
  <packaging>war</packaging>
  <version>1.0-SNAPSHOT</version>
  <name>mybatis-004-web Maven Webapp</name>
  <url>http://localhost:8080/bank</url>
  <dependencies>
    <!--mybatis依赖-->
    <dependency>
      <groupId>org.mybatis</groupId>
      <artifactId>mybatis</artifactId>
      <version>3.5.10</version>
    </dependency>
    <!--mysql驱动依赖-->
    <dependency>
      <groupId>mysql</groupId>
      <artifactId>mysql-connector-java</artifactId>
      <version>8.0.30</version>
    </dependency>
    <!--junit依赖-->
    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>4.13.2</version>
      <scope>test</scope>
    </dependency>
    <!--logback依赖-->
    <dependency>
      <groupId>ch.qos.logback</groupId>
      <artifactId>logback-classic</artifactId>
      <version>1.2.11</version>
    </dependency>
    <!--servlet依赖-->
    <dependency>
      <groupId>jakarta.servlet</groupId>
      <artifactId>jakarta.servlet-api</artifactId>
      <version>5.0.0</version>
      <scope>provided</scope>
    </dependency>
  </dependencies>
  <build>
    <finalName>mybatis-004-web</finalName>
  </build>
</project>
```

- 这里面也有个需要我们注意的地方：【版本为】
- 如果我们 **tomcat** 的版本是10或以上版本，就不能使用下面的依赖导入 **servlet**

```java
<dependency>
	<groupId>javax.servlet</groupId>
<artifactId>javax.servlet-api</artifactId>
<version>4.0.1</version>
<scope>provided</scope>
</dependency>
```

- 需要替换为以下的依赖:

```java
<dependency>
<groupId>jakarta.servlet</groupId>
<artifactId>jakarta.servlet-api</artifactId>
<version>5.0.0</version>
<scope>provided</scope>
</dependency>
```

（4）配置 **tomcat** 服务器

- 第一步如图所示找到 **tomcat** 服务器
- 去配置我们的 **tomcat**

（5）引入我们的 **xml** 文件

- **mybatis** 的核心配置文件 **mybatis-config.xml**

```java
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
        PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <settings>
        <setting name="logImpl" value="SLF4J"/>
    </settings>
    <environments default="development">
        <environment id="development">
            <transactionManager type="JDBC"/>
            <dataSource type="POOLED">
                <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
                <property name="url" value="jdbc:mysql://localhost:3306/powernode"/>
                <property name="username" value="root"/>
                <property name="password" value="111111"/>
            </dataSource>
        </environment>
    </environments>
    <mappers>
        <mapper resource="AccountMapper.xml"/>
    </mappers>
</configuration>
```

- 数据库操作的映射文件 **AccountMapper.xml**

```java
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="account">
    <select id="selectByActno" resultType="com.powernode.bank.pojo.Account">
        select * from t_act where actno ={
     actno}
    </select>
    <update id="updateByActno">
        update t_act set balance ={
     balance} where actno ={
     actno}
    </update>
</mapper>
```

- 日志的核心文件 **logback.xml**

```java
<?xml version="1.0" encoding="UTF-8"?>
<configuration debug="false">
    <!-- 控制台输出 -->
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
            <!--格式化输出：%d表示日期，%thread表示线程名，%-5level：级别从左显示5个字符宽度%msg：日志消息，%n是换行符-->
            <pattern>%d{
     yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{
     50} - %msg%n</pattern>
        </encoder>
    </appender>
    <!-- 按照每天生成日志文件 -->
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <!--日志文件输出的文件名-->
            <FileNamePattern>${
     LOG_HOME}/TestWeb.log.%d{
     yyyy-MM-dd}.log</FileNamePattern>
            <!--日志文件保留天数-->
            <MaxHistory>30</MaxHistory>
        </rollingPolicy>
        <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
            <!--格式化输出：%d表示日期，%thread表示线程名，%-5level：级别从左显示5个字符宽度%msg：日志消息，%n是换行符-->
            <pattern>%d{
     yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{
     50} - %msg%n</pattern>
        </encoder>
        <!--日志文件最大的大小-->
        <triggeringPolicy class="ch.qos.logback.core.rolling.SizeBasedTriggeringPolicy">
            <MaxFileSize>100MB</MaxFileSize>
        </triggeringPolicy>
    </appender>
    <!--mybatis log configure-->
    <logger name="com.apache.ibatis" level="TRACE"/>
    <logger name="java.sql.Connection" level="DEBUG"/>
    <logger name="java.sql.Statement" level="DEBUG"/>
    <logger name="java.sql.PreparedStatement" level="DEBUG"/>
    <!-- 日志输出级别,logback日志级别包括五个：TRACE < DEBUG < INFO < WARN < ERROR -->
    <root level="DEBUG">
        <appender-ref ref="STDOUT"/>
        <appender-ref ref="FILE"/>
    </root>
</configuration>
```

## 二、构建我们的Bank项目

- 对于web的页面没有使用 jsp，全部使用的都是html类型的文件

🌔 **1、编写我们的web页面**

（1）** index.html** 前端表单页面【数据收集】

```java
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>银行账户转账</title>
</head>
<body>
<!--form表单，用于接收信息-->
<form action = "/bank/transfer" method="post">
    转出账号: <input type="text" name = "fromActno"><br>
    转入账号: <input type="text" name= "toActno"><br>
    转账金额: <input type="text" name = "money"><br>
    <input type = "submit" value="转账">
</form>
</body>
</html>
```

（2）** success.html** 转账成功页面

```java
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>转账报告</title>
</head>
<body>
<h1>转账成功!</h1>
</body>
</html>
```

（3）** error1.html** 余额不足异常

```java
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>转账报告</title>
</head>
<body>
<h1>余额不足!!!</h1>>
</body>
</html>
```

（4）** error.html** 其他异常

```java
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>转账报告</title>
</head>
<body>
<h1>转账失败，未知原因!!!</h1>
</body>
</html>
```

🌔2、创建各种包和文件

- **com.powernode.bank.pojo** >> 普通Java类，用于封装数据库表中的字段
- **com.powernode.bank.service** >> 业务处理层
- **com.powernode.bank.dao** >> 数据库的增删改查
- **com.powernode.bank.web** >> 表示层
- **com.powernode.bank.exception** >> 异常层
- **com.powernode.bank.utils** >> 工具类

（1）在 pojo 包下我们创建一个 **Account** 账户类，包含**id**、账户号和余额

- 普通Java类的含义大抵是：私有属性、构造方法、**get**和**set**方法、**toString**方法【私有属性对应表中的字段】
- 代码如下：

```java
package com.powernode.bank.pojo;
/**
 * @author Bonbons
 * @version 1.0
 */
public class Account {
    private Long id;
    private String actno;
    private Double balance;
    public Account(Long id, String actno, Double balance) {
        this.id = id;
        this.actno = actno;
        this.balance = balance;
    }
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public String getActno() {
        return actno;
    }
    public void setActno(String actno) {
        this.actno = actno;
    }
    public Double getBalance() {
        return balance;
    }
    public void setBalance(Double balance) {
        this.balance = balance;
    }
    @Override
    public String toString() {
        return "Account{" +
                "id=" + id +
                ", actno='" + actno + '\'' +
                ", balance=" + balance +
                '}';
    }
}
```

（2）在 dao 包下，我们创建对数据库操作的接口**AccountDao**，并提供一个实现类**AccountDaoImpl**

- 数据库操作的接口：

```java
package com.powernode.bank.dao;
import com.powernode.bank.pojo.Account;
/**
 * 账户的Dao对象，负责对 t_act 表进行增删改查
 * Dao 中的方法与业务逻辑不存在联系
 * @author Bonbons
 * @version 1.0
 */
public interface AccountDao {
    /**
     * 根据账号查询账户信息
     * @param actno 账户id
     * @return 返回账户的信息
     */
    Account selectByActno(String actno);
    /**
     * 更新账户的信息
     * @param act 被更新的账户
     * @return 返回更新结果(成功/失败)
     */
    int updateActno(Account act);
}
```

- 我们在**dao**包下创建一个**impl**包，在这个包下写接口的实现类 **AccountDaoImpl**

```java
package com.powernode.bank.dao.impl;
import com.powernode.bank.dao.AccountDao;
import com.powernode.bank.pojo.Account;
import com.powernode.bank.utils.SqlSessionUtil;
import org.apache.ibatis.session.SqlSession;
/**
 * @author Bonbons
 * @version 1.0
 */
public class AccountDaoImpl implements AccountDao {
    @Override
    public Account selectByActno(String actno) {
        //开启会话,根据actno查询账户
        SqlSession sqlSession = SqlSessionUtil.openSession();
        Account account = (Account) sqlSession.selectOne("account.selectByActno",actno);
//        关闭会话，返回账户信息
//        sqlSession.close();
        return account;
    }
    @Override
    public int updateActno(Account act) {
        //开启会话
        SqlSession sqlSession = SqlSessionUtil.openSession();
        //修改余额
        int count = sqlSession.update("account.updateByActno", act);
//        提交事务，关闭会话
//        sqlSession.commit();
//        sqlSession.close();
        //返回影响数据库表中记录的条数
        return count;
    }
}
```

- 此处可以发现，我将事务提交、连接关闭的代码块注释掉了，为什么？

如果是查询账户还好说，没啥太大的影响，但是如果是完成转账操作，我们调用方法之后就直接提交事务是不严谨的，如果在此期间出现了异常，那么转账操作也会成功执行。

> 所以我们把事务提交、连接关闭放到了具体事务处理的部分。【通过ThreadLocal将线程与连接对象绑定起来】

- 还有一个注意的点，此处调用的方法要与我们的 **AccountMapepr.xml** 映射文件对应上

（3）在**service**包下，我们来写具体的业务，同样也需要写一个接口和对应的实现类【转账业务】

- **AccountService**接口：【就是对业务的约束】

```java
package com.powernode.bank.service;
import com.powernode.bank.exception.MoneyNotEnoughException;
import com.powernode.bank.exception.TransferException;
/**
 * 负责处理账户相关的业务
 * 在不同层之间需要提供接口
 * @author Bonbons
 * @version 1.0
 */
public interface AccountService {
    /**
     * 账户转账业务[见名知意]
     * @param fromActno 转出账户
     * @param toActno 转入账户
     * @param money 转账金额
     */
    void transfer(String fromActno, String toActno, double money) throws MoneyNotEnoughException, TransferException;
}
```

- 同样创建一个 **impl** 子包，下面创建一个业务的实现类 **AccountServiceImpl**

```java
package com.powernode.bank.service.impl;
import com.powernode.bank.dao.AccountDao;
import com.powernode.bank.dao.impl.AccountDaoImpl;
import com.powernode.bank.exception.MoneyNotEnoughException;
import com.powernode.bank.exception.TransferException;
import com.powernode.bank.pojo.Account;
import com.powernode.bank.service.AccountService;
import com.powernode.bank.utils.SqlSessionUtil;
import org.apache.ibatis.session.SqlSession;
/**
 * @author Bonbons
 * @version 1.0
 */
public class AccountServiceImpl implements AccountService{
    //数据库操作的对象
    private AccountDao accountDao= new AccountDaoImpl();
    @Override
    public void transfer(String fromActno, String toActno, double money) throws MoneyNotEnoughException, TransferException {
        //创建会话对象
        SqlSession sqlSession = SqlSessionUtil.openSession();
        //获取转出账户
        Account fromAct = accountDao.selectByActno(fromActno);
        //判断转出账户的余额是否充足
        if(fromAct.getBalance() < money){
            //余额不足给出提示,要对自己抛出的自定义异常处理，直接抛到调用它的方法
            throw new MoneyNotEnoughException("对不起，余额不足");
        }
        //余额充足，进行转账
        //查询转入账户的信息
        Account toAct = accountDao.selectByActno(toActno);
        //更新内存中转出、转入账户的余额
        fromAct.setBalance(fromAct.getBalance() - money);
        toAct.setBalance(toAct.getBalance() + money);
        //更新数据库中的余额,我们可以通过count查看是否更新成功
        int count = 0;
        count += accountDao.updateActno(fromAct);
        count += accountDao.updateActno(toAct);
        //转账失败
        if(count != 2){
            throw new TransferException("转账异常，未知原因");
        }
        //能执行到这里说明没问题，我们提交事务关闭会话
        sqlSession.commit();
        //特殊的关闭
        SqlSessionUtil.close(sqlSession);
    }
}
```

- 几个注意的点：
- 尽管此处给出的是抛出异常的方式，但是我们在表示层是通过 **html** 页面来显示异常信息的
- 也可看到并不是直接调用 `sqlSession.close();`关闭连接的，而是调用了我们工具类中内置的关闭方法【会在工具类的位置说明】
- 我们获取银行账户的对象，对内存中对象的信息进行修改，最后再通过 update 方法写回数据库表中

（4）在我们的 exception 包下写我们的自定义异常类，此处只包含两个 余额不足和其他转账异常

- 其实内部方法十分简单，就是调用构造方法传递我们想要输出的异常信息
- 余额不足异常类 **MoneyNotEnoughException**

```java
package com.powernode.bank.exception;
/**
 * 余额不足异常
 * 继承了运行时异常
 * @author Bonbons
 * @version 1.0
 */
public class MoneyNotEnoughException extends Exception{
    //提供无参和有参的异常构造方法
    public MoneyNotEnoughException(){
     }
    public MoneyNotEnoughException(String msg){
        super(msg);
    }
}
```

- 其他转账异常类 **TransferException**

```java
package com.powernode.bank.exception;
/**
 * 转账异常
 * @author Bonbons
 * @version 1.0
 */
public class TransferException extends Exception{
    public TransferException(){
     }
    public TransferException(String msg){
        super(msg);
    }
}
```

（5）在 **utils** 包下，是我们的工具类 **SqlSessionUtil** 【创建会话和关闭会话】

```java
package com.powernode.bank.utils;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import java.io.IOException;
/**
 * @author Bonbons
 * @version 1.0
 */
public class SqlSessionUtil {
    private SqlSessionUtil(){
     }
    //定义一个SqlSession
    private static final SqlSessionFactory sqlSessionFactory;
    //在类加载的时候初始化SqlSessionFactory
    static {
        try {
            sqlSessionFactory = new SqlSessionFactoryBuilder().build(Resources.getResourceAsStream("mybatis-config.xml"));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
    //定义一个全局的ThreadLocal,可以保证一个SqlSession对应一个线程
    private static ThreadLocal<SqlSession> local = new ThreadLocal<>();
    //通过一个公有的方法为外部提供会话的对象 >> 确保同一个线程操作的是同一个连接对象
    public static SqlSession openSession(){
        //我们用local去获取会话
        SqlSession sqlSession = local.get();
        //如果当前没有开启的会话就去创建一个，如果get到了就用这个[确保我们操作的是同一个连接对象]
        if(sqlSession == null){
            sqlSession = sqlSessionFactory.openSession();
            //将SqlSession对象绑定到当前线程上
            local.set(sqlSession);
        }
        return sqlSession;
    }
    /**
     * 关闭SqlSession对象并从当前线程中解绑
     * @param sqlSession 会话对象
     */
    public static void close(SqlSession sqlSession){
        if(sqlSession != null){
            sqlSession.close();
            local.remove();
        }
    }
}
```

- 对于**SqlSessionFactoryBuilder**我们仅仅使用它的**build**方法，所以创建完**SqlSessionFactory**对象后就没用了
- 对于**SqlSessionFactory**对应一个数据库，所以在类初始化的时候创建一个就够了，我们采用静态代码块的方式完成
- 对于**SqlSession**我们希望一个线程对应一个，也可以理解为一个线程对应一个业务操作
- 为了避免调用**openSqlSession**()就创建一个连接对象，我们引入 **ThreadLocal** 作为全局变量
- 在调用openSession的时候，如果已经存在连接对象了，我们就将这个连接对象返回
- 如果此时没有会话，我们就利用会话工厂去创建一个会话，并将这个连接对象绑定到当前的线程上
- 这也就是为什么在关闭会话的时候，需要设置一个单独的方法，关闭会话后立即解除绑定

（6）在 **web** 包下，我们创建一个 **AccountServlet** 类作为表示层

```java
package com.powernode.bank.web; /**
 * @author Bonbons
 * @version 1.0
 */
import com.powernode.bank.exception.MoneyNotEnoughException;
import com.powernode.bank.exception.TransferException;
import com.powernode.bank.service.AccountService;
import com.powernode.bank.service.impl.AccountServiceImpl;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
//@WebServlet("/transfer") 未找到资源，可能是注解没有生效，我们去web.xml中配置一下
//在web.xml中将 metadata-complete="false" 代表支持web.xml配置也支持注解配置
//@WebServlet("/transfer")
public class AccountServlet extends HttpServlet {
    //因为其他方法也可能用到业务类的对象，所以设置为全局变量,父类引用执行子类对象[多态]
    AccountService accountService = new AccountServiceImpl(); 
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        //获取表单数据
        String fromActno = request.getParameter("fromActno");
        String toActno = request.getParameter("toActno");
        //通过表单提交过来的数据一定是字符串，所以我们需要将金额转换成Double类型
        double money = Double.parseDouble(request.getParameter("money"));
        //并不处理业务，调用service的转账方法完成转账，在这块属于一个控制器
        try {
            //转账操作可能出现异常，所以需要我们对异常进行捕获
            accountService.transfer(fromActno, toActno, money);
            //调用视图层(View)查看结果
            response.sendRedirect(request.getContextPath() + "/success.html");
        } catch (MoneyNotEnoughException e) {
            //利用页面来实现异常 >> 牛
            response.sendRedirect(request.getContextPath() + "/error1.html");
        } catch (Exception e) {
            response.sendRedirect(request.getContextPath() + "/error2.html");
        }
    }
}
```

## 三、测试我们的项目

🌔 **1、运行tomcat，在网页填写表单**

🌔 **2、查看数据库表在执行操作前后的变换**

（1）执行操作前

（2）执行操作后

## 四、MyBatis三大对象的作用域

- 这个与**Web**项目没啥关系，不过理解这部分也很重要，其实我在前面的**SqlSessionUtil**中就有提及
- 引用 **MyBatis** 的中文官方文档，对此展开详细的论述

**1、SqlSessionFactoryBuilder**

- 这个类可以被实例化、使用和丢弃，一旦创建了 SqlSessionFactory，就不再需要它了。【以保证所有的 XML 解析资源】
- 因此 SqlSessionFactoryBuilder 实例的最佳作用域是方法作用域（也就是局部方法变量）。

**2、SqlSessionFactory**

- **SqlSessionFactory** 一旦被创建就应该在应用的运行期间一直存在，没有任何理由丢弃它或重新创建另一个实例。【不要创建多次】
- 因此 **SqlSessionFactory** 的最佳作用域是应用作用域。【最简单的就是使用单例模式或者静态单例模式】

**3、SqlSession**

- 每个线程都应该有它自己的 **SqlSession** 实例。
- SqlSession 的实例不是线程安全的，因此是不能被共享的，所以它的最佳的作用域是请求或方法作用域。

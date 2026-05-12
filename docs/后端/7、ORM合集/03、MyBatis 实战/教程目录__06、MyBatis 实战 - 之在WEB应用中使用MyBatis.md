# 06、MyBatis 实战 - 之在WEB应用中使用MyBatis
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/6/6.html
- 分类：ORM框架
- 分组：教程目录
## 一、实现功能

```java
通过模拟 银行转账业务，来熟悉对mybatis的使用
```

## 二、环境搭建

### 1、引入依赖

```xml
<dependencies>
        <!--mybatis依赖-->
        <dependency>
            <groupId>org.mybatis</groupId>
            <artifactId>mybatis</artifactId>
            <version>3.5.10</version>
        </dependency>
        <!--数据库驱动-->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>8.0.30</version>
        </dependency>
        <!--引入logback日志框架依赖，这个日志框架实现了slf4j规范-->
        <dependency>
            <groupId>ch.qos.logback</groupId>
            <artifactId>logback-classic</artifactId>
            <version>1.2.11</version>
        </dependency>
        <!--servlet依赖-->
        <dependency>
            <groupId>javax.servlet</groupId>
            <artifactId>javax.servlet-api</artifactId>
            <version>4.0.1</version>
        </dependency>
    </dependencies>
```

### 2、添加mybatis-config.xml核心配置文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
        PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
    <properties resource="jdbc.properties"/>
    <environments default="development">
        <environment id="development">
            <transactionManager type="JDBC"/>
            <dataSource type="POOLED">
                <property name="driver" value="${jdbc.driver}"/>
                <property name="url" value="${jdbc.url}"/>
                <property name="username" value="${jdbc.username}"/>
                <property name="password" value="${jdbc.password}"/>
            </dataSource>
        </environment>
    </environments>
    <mappers>
        <mapper resource="AccountMapper.xml"/>
    </mappers>
</configuration>
```

### 3、添加jdbc.properties文件

```java
jdbc.driver=com.mysql.cj.jdbc.Driver
jdbc.url=jdbc:mysql://localhost:3306/powernode?useUnicode=true&characterEncoding=utf-8
jdbc.username=root
jdbc.password=root
```

### 4、添加日志文件logback.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration debug="false">
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
            <pattern>%d{HH:mm:ss.SSS} %contextName [%thread] %-5level %logger{36} - %msg%n
            </pattern>
        </encoder>
    </appender>
    <logger name="com.apache.ibatis" level="TRACE"/>
    <logger name="java.sql.Connection" level="DEBUG"/>
    <logger name="java.sql.Statement" level="DEBUG"/>
    <logger name="java.sql.PreparedStatement" level="DEBUG"/>
    <root level="DEBUG">
        <appender-ref ref="STDOUT" />
        <appender-ref ref="FILE" />
    </root>
</configuration>
```

### 5、添加AccountMapper.xml文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="account">
</mapper>
```

### 6、添加简单页面文件 index.html

```xml
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>银行转账</title>
</head>
<body>
<form action="/bank/transfer" method="post">
    转出账号：<input type="text" name="fromActno"><br>
    转入账号：<input type="text" name="toActno"><br>
    转账金额：<input type="text" name="money"><br>
    <input type="submit" value="转账"><br>
</form>
</body>
</html>
```

### 7、增加工具类SqlSessionUtil

```java
package com.powernode.bank.util;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import java.io.IOException;
public class SqlSessionUtil {
    private SqlSessionUtil(){
     };
    private static SqlSessionFactory sqlSessionFactory;
    static {
        try {
            sqlSessionFactory = new SqlSessionFactoryBuilder().build(Resources.getResourceAsStream("mybatis-config.xml"));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    /**
     * 获取会话对象，
     * @return
     */
    public static SqlSession openSqlSession(){
        return sqlSessionFactory.openSession();
    }
}
```

### 8、增加实体类 Account

```java
package com.powernode.bank.pojo;
public class Account {
    private Long id ;
    private String actno;
    private Double balance;
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
}
```

### 9、mysql建表 t_act

```java
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
-- ----------------------------
-- Table structure for t_act
-- ----------------------------
DROP TABLE IF EXISTS t_act;
CREATE TABLE t_act  (
  id bigint(0) NOT NULL AUTO_INCREMENT,
  actno varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '账号',
  balance decimal(15, 2) NULL DEFAULT NULL COMMENT '余额',
  PRIMARY KEY (id) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;
-- ----------------------------
-- Records of t_act
-- ----------------------------
INSERT INTO t_act VALUES (1, 'act001', 30002.00);
INSERT INTO t_act VALUES (2, 'act002', 19998.00);
SET FOREIGN_KEY_CHECKS = 1;
```

### 10、展示项目目录结构

## 三、后台代码实现

### 1、创建AccountServlet

```java
package com.powernode.bank.web;
import com.powernode.bank.exceptions.MoneyNotEnoughException;
import com.powernode.bank.exceptions.TransferException;
import com.powernode.bank.service.AccountServiceImpl;
import com.powernode.bank.service.IAccount;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
@WebServlet("/transfer")
public class AccountServlet extends HttpServlet {
    private IAccount accountService = new AccountServiceImpl();
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        //获取表单数据
        String fromActno = request.getParameter("fromActno");
        String toActno = request.getParameter("toActno");
        double money = Double.parseDouble(request.getParameter("money"));
        try {
            //调用service的转账方法完成转账（调用业务层）
            accountService.transfer(fromActno,toActno,money);
            //调用视图层view展示结果
            response.sendRedirect(request.getContextPath() + "/success.html");
        } catch (MoneyNotEnoughException e) {
            response.sendRedirect(request.getContextPath() + "/error1.html");
        } catch (TransferException e) {
            response.sendRedirect(request.getContextPath() + "/error2.html");
        }
    }
}
```

### 2、创建业务接口IAccount

```java
package com.powernode.bank.service;
import com.powernode.bank.exceptions.MoneyNotEnoughException;
import com.powernode.bank.exceptions.TransferException;
/**
 * 账户业务类
 */
public interface IAccount {
    //转账
    void transfer(String fromActno, String toActno, double money) throws MoneyNotEnoughException, TransferException;
}
```

### 3、创建业务接口实现类AccountServiceImpl

```java
package com.powernode.bank.service;
import com.powernode.bank.dao.AccountDao;
import com.powernode.bank.dao.impl.AccountDaoImpl;
import com.powernode.bank.exceptions.MoneyNotEnoughException;
import com.powernode.bank.exceptions.TransferException;
import com.powernode.bank.pojo.Account;
public class AccountServiceImpl implements IAccount {
    private AccountDao accountDao = new AccountDaoImpl();
    @Override
    public void transfer(String fromActno, String toActno, double money) throws MoneyNotEnoughException, TransferException {
        Account fromAct = accountDao.selectByActno(fromActno);
        if(fromAct.getBalance() < money){
            throw new MoneyNotEnoughException("对不起，余额不足");
        }
        //先更新内存中java对象的余额
        Account toAct = accountDao.selectByActno(toActno);
        fromAct.setBalance(fromAct.getBalance() - money);
        toAct.setBalance(toAct.getBalance() + money);
        int count = accountDao.updateByActno(fromAct);
        count += accountDao.updateByActno(toAct);
        if(count != 2){
            throw new TransferException("对不起，转账异常");
        }
    }
}
```

### 4、创建持久层接口AccountDao，以及实现类AccountDaoImpl

```java
package com.powernode.bank.dao;
import com.powernode.bank.pojo.Account;
public interface AccountDao {
    Account selectByActno(String actno);
    int updateByActno(Account act);
}
```

```java
package com.powernode.bank.dao.impl;
import com.powernode.bank.dao.AccountDao;
import com.powernode.bank.pojo.Account;
import com.powernode.bank.util.SqlSessionUtil;
import org.apache.ibatis.session.SqlSession;
public class AccountDaoImpl implements AccountDao {
    @Override
    public Account selectByActno(String actno) {
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        Account account = sqlSession.selectOne("account.selectByActno", actno);
        sqlSession.commit();
        sqlSession.close();
        return account;
    }
    @Override
    public int updateByActno(Account act) {
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        int count = sqlSession.update("account.updateByActno", act);
        sqlSession.commit();
        sqlSession.close();
        return count;
    }
}
```

### 5、增加两个异常类

```java
MoneyNotEnoughException 
```

```java
package com.powernode.bank.exceptions;
/**
 * 余额不足异常
 */
public class MoneyNotEnoughException extends Exception {
    public MoneyNotEnoughException() {
    }
    public MoneyNotEnoughException(String message) {
        super(message);
    }
}
```

```java
TransferException 
```

```java
package com.powernode.bank.exceptions;
/**
 * 转账异常
 */
public class TransferException extends Exception {
    public TransferException() {
    }
    public TransferException(String message) {
        super(message);
    }
}
```

### 6、运行测试页面

```java
转账前
```

```java
转账后
```

## 四、加入事务控制

```java
如果转账过程中，出现了异常，此时代码是有问题的，我们对原有代码进行改造
```

SqlSessionUtil 改造

```java
1、将SqlSession放到ThreadLocal中，确保同一个线程当中，获取到的SqlSession对象是同一个。
2、关闭连接的时候，记得从ThreadLocal中移除当前线程中的SqlSession对象，因为tomcat服务器是支持多线程的。
```

```java
package com.powernode.bank.util;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import java.io.IOException;
public class SqlSessionUtil {
    private SqlSessionUtil(){
     };
    private static SqlSessionFactory sqlSessionFactory;
    static {
        try {
            sqlSessionFactory = new SqlSessionFactoryBuilder().build(Resources.getResourceAsStream("mybatis-config.xml"));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    //全局的，服务器级别的，一个服务器当中定义一个即可
    private static ThreadLocal<SqlSession> threadLocal = new ThreadLocal<>();
    /**
     * 获取会话对象，
     * @return
     */
    public static SqlSession openSqlSession(){
        SqlSession sqlSession = threadLocal.get();
        if(sqlSession == null){
            sqlSession = sqlSessionFactory.openSession();
            threadLocal.set(sqlSession);
        }
        return sqlSession;
    }
    public static void close(SqlSession sqlSession){
        if(sqlSession != null){
            sqlSession.close();
            threadLocal.remove();
        }
    }
}
```

AccountServiceImpl

```java
package com.powernode.bank.service;
import com.powernode.bank.dao.AccountDao;
import com.powernode.bank.dao.impl.AccountDaoImpl;
import com.powernode.bank.exceptions.MoneyNotEnoughException;
import com.powernode.bank.exceptions.TransferException;
import com.powernode.bank.pojo.Account;
import com.powernode.bank.util.SqlSessionUtil;
import org.apache.ibatis.session.SqlSession;
public class AccountServiceImpl implements IAccount {
    private AccountDao accountDao = new AccountDaoImpl();
    @Override
    public void transfer(String fromActno, String toActno, double money) throws MoneyNotEnoughException, TransferException {
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        Account fromAct = accountDao.selectByActno(fromActno);
        if(fromAct.getBalance() < money){
            throw new MoneyNotEnoughException("对不起，余额不足");
        }
        //先更新内存中java对象的余额
        Account toAct = accountDao.selectByActno(toActno);
        fromAct.setBalance(fromAct.getBalance() - money);
        toAct.setBalance(toAct.getBalance() + money);
        int count = accountDao.updateByActno(fromAct);
        count += accountDao.updateByActno(toAct);
        if(count != 2){
            throw new TransferException("对不起，转账异常");
        }
        sqlSession.commit();
        SqlSessionUtil.close(sqlSession);
    }
}
```

AccountDaoImpl 改造

```java
package com.powernode.bank.dao.impl;
import com.powernode.bank.dao.AccountDao;
import com.powernode.bank.pojo.Account;
import com.powernode.bank.util.SqlSessionUtil;
import org.apache.ibatis.session.SqlSession;
public class AccountDaoImpl implements AccountDao {
    @Override
    public Account selectByActno(String actno) {
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        Account account = sqlSession.selectOne("account.selectByActno", actno);
        return account;
    }
    @Override
    public int updateByActno(Account act) {
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        int count = sqlSession.update("account.updateByActno", act);
        return count;
    }
}
```

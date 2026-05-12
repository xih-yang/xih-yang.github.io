# 02、MyBatis - 我的第一个MyBatis程序
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/1/2.html
- 分类：ORM框架
- 分组：教程目录
在MyBatis的第一篇的学习中我们了解了MyBatis是什么和为什么学习MyBatis，本次我们将学习MyBatis的具体使用。

思路：环境搭建——>MyBatis导入——>代码编写——>测试。

## 一、环境搭建

**1、** 建立数据库；

```sql
CREATE DATABASE MyBaties;
CREATE TABLE user(
    id INT(20) NOT NULL PRIMARY KEY,
    username VARCHAR(30) NOT NULL,
    password VARCHAR(30) NOT NULL
);
INSERT INTO user (id,username,password)
VALUES
(10000,'jms1','123456'),
(10001,'jms2','123456'),
(10003,'jms3','123456')
```

**2、** 建立一个maven项目；

这个项目作为父项目。

修改pom.xml导入需要的依赖：mysql驱动、mydatis、junit。

```xml
<dependencies>
  <!-- 导入依赖-->
      <!-- mysql驱动-->
      <!-- https://mvnrepository.com/artifact/mysql/mysql-connector-java -->
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <version>8.0.30</version>
    </dependency>
     <!-- mybatis-->
    <!-- https://mvnrepository.com/artifact/org.mybatis/mybatis -->
    <dependency>
        <groupId>org.mybatis</groupId>
        <artifactId>mybatis</artifactId>
        <version>3.5.10</version>
    </dependency>
     <!-- junit-->
     <!-- https://mvnrepository.com/artifact/junit/junit -->
    <dependency>
        <groupId>junit</groupId>
        <artifactId>junit</artifactId>
        <version>4.13.2</version>
        <scope>test</scope>
    </dependency>
 </dependencies>
```

**3、** 建立一个子模块；

1、编写mybatis的核心配置文件mybatis-config.xml：

这是官网给出的模板：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
  <environments default="development">
    <environment id="development">
      <transactionManager type="JDBC"/>
      <dataSource type="POOLED">
        <property name="driver" value="${driver}"/>
        <property name="url" value="${url}"/>
        <property name="username" value="${username}"/>
        <property name="password" value="${password}"/>
      </dataSource>
    </environment>
  </environments>
  <mappers>
    <mapper resource="org/mybatis/example/BlogMapper.xml"/>
  </mappers>
</configuration>
```

这是我个人的使用：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
  <environments default="development">
    <environment id="development">
      <transactionManager type="JDBC"/>
      <dataSource type="POOLED">
        <property name="driver" value="com.mysql.jdbc.Dirver"/>
        <property name="url" value="jdbc:mysql://localhost:3306/mybaties?useSSL=true&useUnicode=true&characterEncoding=UTF-8"/>
        <property name="username" value="root"/>
        <property name="password" value="123456"/>
      </dataSource>
    </environment>
  </environments>
</configuration>
```

2、编写mybatis工具类MyBatisUtil.class

每个基于 MyBatis 的应用都是以一个 SqlSessionFactory 的实例为核心的。SqlSessionFactory 的实例可以通过 SqlSessionFactoryBuilder 获得。而 SqlSessionFactoryBuilder 则可以从 XML 配置文件或一个预先配置的 Configuration 实例来构建出 SqlSessionFactory 实例。

从XML 文件中构建 SqlSessionFactory 的实例非常简单，建议使用类路径下的资源文件进行配置。 但也可以使用任意的输入流（InputStream）实例，比如用文件路径字符串或 file:// URL 构造的输入流。MyBatis 包含一个名叫 Resources 的工具类，它包含一些实用方法，使得从类路径或其它位置加载资源文件更加容易。

官方文档给出了以下三行代码：

```java
String resource = "org/mybatis/example/mybatis-config.xml";
InputStream inputStream = Resources.getResourceAsStream(resource);
SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
```

我们要做的就是把这三行代码封装到MyBatisUtil.class中：

```java
package com.jms.utils;
import java.io.IOException;
import java.io.InputStream;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
//SqlSessionFactory-->SqlSession
public class MyBatisUtil {
    private static SqlSessionFactory sqlSessionFactory;
    //获取SqlSessionFactory对象
    static {
        try {
            String resource = "mybatis-config.xml";
            InputStream inputStream = Resources.getResourceAsStream(resource);
            sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);    
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    //通过SqlSessionFactory获取SqlSession对象，其中包含了面向数据库执行执行SQL命令所需要的方法
    public static SqlSession getSqlSession() {
        return sqlSessionFactory.openSession();
    }
}
```

官网上也有着不进行核心配置，直接用纯代码进行编写的模式，本文就不做过多赘述，可自行了解。

**3、** 编写代码；

1、首先我们要写一个实体类user.class，这个实体类应该与我们前面数据库建立的user表对应。

```java
package com.jms.pojo;
public class user {
    private int id;
    private String username;
    private String password;
    public user() {
    }
    public user(int id, String username, String password) {
        super();
        this.id = id;
        this.username = username;
        this.password = password;
    }
    public int getId() {
        return id;
    }
    public void setId(int id) {
        this.id = id;
    }
    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }
    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }
    @Override
    public String toString() {
        return "user [id=" + id + ", username=" + username + ", password=" + password + "]";
    }
}
```

2、编写一个Mapper接口UserMapper

```java
package com.jms.dao;
import java.util.List;
import com.jms.pojo.User;
public interface UserMapper {
    List<User> getUsers();
}
```

(3)编写Mapper配置文件UserMapper.xml

一般来说接口都会有实现类，但是这里我们用Mapper配置文件来代替了实现类。

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 命名空间namespace对应Mapper接口 -->
<mapper namespace="com.jms.dao.userMapper">
  <!-- id对应接口中的方法 -->
  <select id="getUsers" resultType="com.jms.pojo.User">
    select * from mybaties.user
  </select>
</mapper>
```

**4、** 注册Mapper；

修改mybatis的核心配置文件mybatis-config.xml，添加以下三行：

```xml
<mappers>
    <mapper resource="com/jms/dao/UserMapper.xml"/>
</mappers>
```

resource对应的是实现接口的Mapper的路径。

**5、** junit测试；

建立测试类UserMapperTest.class

```java
package com.jms.dao;
import java.util.List;
import org.apache.ibatis.session.SqlSession;
import org.junit.Test;
import com.jms.pojo.User;
import com.jms.utils.MyBatisUtil;
public class UserMapperTest {
    @Test
    public void test() {
        //利用工具类获取SqlSession
        SqlSession sqlSession = MyBatisUtil.getSqlSession();
        try {
            //方法一
            //利用SqlSession获取UserMapper接口
            UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
            //调用方法
            List<User> users = userMapper.getUsers();
            //方法二，老方法不推荐用
            List<User> users2 = sqlSession.selectList("com.jms.dao.UserMapper.getUsers");
            System.out.println("这是方法一的结果");
            for(User user: users) {
                System.out.println(user);
            }
            System.out.println("这是方法二的结果");
            for(User user: users2) {
                System.out.println(user);
            }
        } catch(Exception e) {
            e.printStackTrace();
        } finally{
            sqlSession.close();
        }
    }
}
```

上面有两种方法，方法二不推荐。

SqlSession用完后应及时关闭。

测试结果如下：

可以看到成功地查到了数据库中的信息。

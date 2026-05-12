# 01、MyBatis 源码分析 - 前序(一)
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/7/1.html
- 分类：ORM框架
- 分组：教程目录
> Mybatis 作为 Java 中令人熟知的 SSM 框架体系中的 M。是一个强大 的，且相较于 Hibernate 更为灵活的持久层框架。能简化我们在实际开发中和数据库交互的工作量。

## Java 和数据库交互方式的演进

实验环境准备

- JDK8
- Mysql v8.0.16
- Mysql Driver v8.0.22

### 通过原生 JDBC 和数据库进行交互

```java
/* 前期准备：获取数据库连接 */
// 加载驱动(高版本下 mysql 驱动可以忽略)，至于为什么要这么做，和为什么可以忽略
// 如果大家有兴趣，我可以抽空给大家写一篇文章
Class.forName("com.mysql.cj.jdbc.Driver");
// 获取数据库连接
Connection conn = DriverManager.getConnection(url, username, password);
/* 预编译 */
String sql = "select id, name, age, email from user where id = ?";
PreparedStatement ptmt = conn.prepareStatement(sql);
/* 传参，即替换 sql 语句中 '?' 的地方 */
ptmt.setLong(1, 1);
/* 执行 */
ResultSet rs = ptmt.executeQuery();
/* 结果集处理 */
while (rs.next()) {
  User user = new User();
  user.setId(rs.getLong("id"));
  user.setName(rs.getString("name"));
  user.setAge(rs.getInt("age"));
  user.setEmail(rs.getString("email"));
  System.out.println(user);
}
/* 资源回收 */
rs.close();
ptmt.close();
conn.close();
```

控制台打印内容：`User{id=1, name='Jone', age=0, email='test1@baomidou.com'}`

### 使用 Mybatis 和数据库进行交互

编写Mybatis 的配置文件 **mybatis-config.xml**

```xml
<configuration>
  <environments default="development">
    <environment id="development">
      <transactionManager type="JDBC"/>
      <dataSource type="POOLED">
        <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
        <property name="url" value="jdbc:mysql://127.0.0.1:3306/test1"/>
        <property name="username" value="root"/>
        <property name="password" value="123456"/>
      </dataSource>
    </environment>
  </environments>
  <mappers>
    <mapper resource="mapper.com.yinxy.demo/UserMapper.xml" />
  </mappers>
</configuration>
```

编写Mapper 映射接口和对应的 XML 文件

```java
public interface UserMapper {
  User selectById(@Param("userId") Long userId);
}
```

```xml
<mapper namespace="com.yinxy.demo.UserMapper">
  <select id="selectById" resultType="com.yinxy.demo.User">
    SELECT id, name, age, email
    FROM user
    WHERE id ={userId}
  </select>
</mapper>
```

利用Mybatis 和数据库进行交互

```java
// 通过 mybatis 的工具类 Resources 获取配置文件
InputStream inputStream = Resources.getResourceAsStream("mybatis-config.xml");
// 将配置文件交给 SqlSessionFactoryBuilder 以构建 SqlSessionFactory
SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
// 得到 SqlSession
SqlSession sqlSession = sqlSessionFactory.openSession();
// 获取代理后的 UserMapper
UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
// 调用方法打印结果
System.out.println(userMapper.selectById(1L));
```

控制台打印内容：`User{id=1, name='Jone', age=18, email='test1@baomidou.com'}`

小结：通过上面的两种进行比较。在代码上，Mybatis 比原生的 JDBC 看上去更简洁，并且 Mybatis 帮我们把很多冗余和繁琐的步骤给封装起来了，使我们能更快的上手。

> 学习一门框架的源码是一件长久的事情，不是几天、十几天或者看几节视频能学会的。所以前期知识的预热是很重要的，直接上手看源码，可能刚看完一点，过一会就忘了，希望自己持之以恒。如果对文章内容有疑惑，或者有错误的地方望指正。

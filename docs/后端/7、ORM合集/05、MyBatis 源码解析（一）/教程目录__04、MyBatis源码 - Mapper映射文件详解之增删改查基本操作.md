# 04、MyBatis源码 - Mapper映射文件详解之增删改查基本操作
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/5/4.html
- 分类：ORM框架
- 分组：教程目录
### XML 映射器

MyBatis 的真正强大在于它的语句映射，这是它的魔力所在。由于它的异常强大，映射器的 XML 文件就显得相对简单。如果拿它跟具有相同功能的 JDBC 代码进行对比，你会立即发现省掉了将近 95% 的代码。MyBatis 致力于减少使用成本，让用户能更专注于 SQL 代码。

SQL映射文件只有很少的几个顶级元素（按照应被定义的顺序列出）：

- cache – 该命名空间的缓存配置。
- cache-ref – 引用其它命名空间的缓存配置。
- resultMap – 描述如何从数据库结果集中加载对象，是最复杂也是最强大的元素。
- parameterMap – 老式风格的参数映射。此元素已被废弃，并可能在将来被移除！请使用行内参数映射。文档中不会介绍此元素。
- sql – 可被其它语句引用的可重用语句块。
- insert – 映射插入语句。
- update – 映射更新语句。
- delete – 映射删除语句。
- select – 映射查询语句。

#### select

Select元素来定义查询操作。

```xml
<select id="selectOneById" resultType="org.pearl.mybatis.demo.pojo.entity.User" databaseId="mysql">
    select * from base_user where user_id ={id}
</select>
```

select 元素允许你配置很多属性来配置每条语句的行为细节。

```xml
<select
  id="selectPerson"
  parameterType="int"
  parameterMap="deprecated"
  resultType="hashmap"
  resultMap="personResultMap"
  flushCache="false"
  useCache="true"
  timeout="10"
  fetchSize="256"
  statementType="PREPARED"
  resultSetType="FORWARD_ONLY">
```

Select 元素的属性：

属性
描述

id
在命名空间中唯一的标识符，可以被用来引用这条语句。

parameterType
将会传入这条语句的参数的类全限定名或别名。这个属性是可选的，因为 MyBatis 可以通过类型处理器（TypeHandler）推断出具体传入语句的参数，默认值为未设置（unset）。

parameterMap
用于引用外部 parameterMap 的属性，目前已被废弃。请使用行内参数映射和 parameterType 属性 。

resultType
期望从这条语句中返回结果的类全限定名或别名。 注意，如果返回的是集合，那应该设置为集合包含的类型，而不是集合本身的类型。 resultType 和 resultMap 之间只能同时使用一个。

resultMap
对外部 resultMap 的命名引用。结果映射是 MyBatis 最强大的特性，如果你对其理解透彻，许多复杂的映射问题都能迎刃而解。 resultType 和 resultMap 之间只能同时使用一个。

flushCache
将其设置为 true 后，只要语句被调用，都会导致本地缓存和二级缓存被清空，默认值：false。

useCache
将其设置为 true 后，将会导致本条语句的结果被二级缓存缓存起来，默认值：对 select 元素为 true。

timeout
这个设置是在抛出异常之前，驱动程序等待数据库返回请求结果的秒数。默认值为未设置（unset）（依赖数据库驱动）。

fetchSize
这是一个给驱动的建议值，尝试让驱动程序每次批量返回的结果行数等于这个设置值。 默认值为未设置（unset）（依赖驱动）。

statementType
可选 STATEMENT，PREPARED 或 CALLABLE。这会让 MyBatis 分别使用 Statement，PreparedStatement 或 CallableStatement，默认值：PREPARED。

resultSetType
FORWARD_ONLY，SCROLL_SENSITIVE, SCROLL_INSENSITIVE 或 DEFAULT（等价于 unset） 中的一个，默认值为 unset （依赖数据库驱动）。

databaseId
如果配置了数据库厂商标识（databaseIdProvider），MyBatis 会加载所有不带 databaseId 或匹配当前 databaseId 的语句；如果带和不带的语句都有，则不带的会被忽略。

resultOrdered
这个设置仅针对嵌套结果 select 语句：如果为 true，将会假设包含了嵌套结果集或是分组，当返回一个主结果行时，就不会产生对前面结果集的引用。 这就使得在获取嵌套结果集的时候不至于内存不够用。默认值：false。

resultSets
这个设置仅适用于多结果集的情况。它将列出语句执行后返回的结果集并赋予每个结果集一个名称，多个名称之间以逗号分隔。

#### insert, update 和 delete

数据变更语句 insert，update 和 delete 的实现非常接近：

```xml
<insert
  id="insertAuthor"
  parameterType="domain.blog.Author"
  flushCache="true"
  statementType="PREPARED"
  keyProperty=""
  keyColumn=""
  useGeneratedKeys=""
  timeout="20">
<update
  id="updateAuthor"
  parameterType="domain.blog.Author"
  flushCache="true"
  statementType="PREPARED"
  timeout="20">
<delete
  id="deleteAuthor"
  parameterType="domain.blog.Author"
  flushCache="true"
  statementType="PREPARED"
  timeout="20">
```

Insert, Update, Delete 元素的属性：

属性
描述

id
在命名空间中唯一的标识符，可以被用来引用这条语句。

parameterType
将会传入这条语句的参数的类全限定名或别名。这个属性是可选的，因为 MyBatis 可以通过类型处理器（TypeHandler）推断出具体传入语句的参数，默认值为未设置（unset）。

parameterMap
用于引用外部 parameterMap 的属性，目前已被废弃。请使用行内参数映射和 parameterType 属性。

flushCache
将其设置为 true 后，只要语句被调用，都会导致本地缓存和二级缓存被清空，默认值：（对 insert、update 和 delete 语句）true。

timeout
这个设置是在抛出异常之前，驱动程序等待数据库返回请求结果的秒数。默认值为未设置（unset）（依赖数据库驱动）。

statementType
可选 STATEMENT，PREPARED 或 CALLABLE。这会让 MyBatis 分别使用 Statement，PreparedStatement 或 CallableStatement，默认值：PREPARED。

useGeneratedKeys
（仅适用于 insert 和 update）这会令 MyBatis 使用 JDBC 的 getGeneratedKeys 方法来取出由数据库内部生成的主键（比如：像 MySQL 和 SQL Server 这样的关系型数据库管理系统的自动递增字段），默认值：false。

keyProperty
（仅适用于 insert 和 update）指定能够唯一识别对象的属性，MyBatis 会使用 getGeneratedKeys 的返回值或 insert 语句的 selectKey 子元素设置它的值，默认值：未设置（unset）。如果生成列不止一个，可以用逗号分隔多个属性名称。

keyColumn
（仅适用于 insert 和 update）设置生成键值在表中的列名，在某些数据库（像 PostgreSQL）中，当主键列不是表中的第一列的时候，是必须设置的。如果生成列不止一个，可以用逗号分隔多个属性名称。

databaseId
如果配置了数据库厂商标识（databaseIdProvider），MyBatis 会加载所有不带 databaseId 或匹配当前 databaseId 的语句；如果带和不带的语句都有，则不带的会被忽略。

**简单使用案例**：

为了方便调试，在settings中配置日志输出到控制台

```java
 <setting name="logImpl" value="STDOUT_LOGGING" />
```

**1、** 添加接口；

```java
public interface UserMapper {
    User selectOneById(Long id);
    int insertUser(@Param("user") User user);
    int updateUserById(@Param("user")User user);
    int deleteUserById(Long id);
}
```

**1、** 添加SQL映射；

```xml
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.pearl.mybatis.demo.dao.UserMapper">
    <!--插入用户-->
    <insert id="insertUser" parameterType="user">
        INSERT INTO base_user (user_id,user_name,login_name)
        VALUES (#{user.userId},#{user.userName},#{user.loginName})
    </insert>
    <!--根据ID修改用户-->
    <update id="updateUserById" parameterType="user">
        UPDATE base_user  SET
            user_name=#{user.userName },
            login_name={user.loginName}
        WHERE user_id ={user.userId }
    </update>
    <!--根据ID删除用户-->
    <delete id="deleteUserById">
        DELETE FROM base_user WHERE  user_id={id}
    </delete>
    <!--根据ID查询用户-->
    <select id="selectOneById" resultType="user" databaseId="mysql">
    select * from base_user where user_id ={id}
  </select>
</mapper>
```

**1、** 执行SQL；

```java
public class Test003 {
    public static void main(String[] args) throws IOException {
        String resource = "mybatis-config.xml";
        InputStream inputStream = Resources.getResourceAsStream(resource);
        SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
        SqlSession sqlSession = sqlSessionFactory.openSession();
        UserMapper mapper = sqlSession.getMapper(UserMapper.class);
        // 插入
        User user = new User();
        user.setUserId(333333L);
        user.setUserName("liSi");
        user.setLoginName("lilili");
        int result = mapper.insertUser(user);
        System.out.println(result);
        // 修改
        user.setUserId(33L);
        int i1 = mapper.updateUserById(user);
        System.out.println(i1);
        // 删除
        int i = mapper.deleteUserById(44L);
        System.out.println(i);
        // 提交事务
        sqlSession.commit();
        // 关闭会话
        sqlSession.close();
    }
}
```

#### 主键生成方式

对于主键生成，MyBatis提供了多种生成方式。

##### （1）数据库支持自增（getGeneratedKeys）

如果数据库支持自动生成主键的字段（比如 MySQL 和 SQL Server），插入数据时，不需要设置主键，数据库会自己生成，但是要想获取到主键则需要使用useGeneratedKeys属性，(仅适用于 insert 和 update）这会令 MyBatis 使用 JDBC 的 getGeneratedKeys 方法来取出由数据库内部生成的主键。

**案例演示**：

**1、** Insert标签添加属性getGeneratedKeys，并指定keyColumn及keyProperty；

```java
    <!--插入用户-->
    <insert id="insertUser" parameterType="user" useGeneratedKeys="true" keyColumn="user_id" keyProperty="userId">
        INSERT INTO base_user (user_id,user_name,login_name)
        VALUES (#{user.userId},#{user.userName},#{user.loginName})
    </insert>
```

**1、** 执行SQL，并获取数据库自动生成的主键；

#### （2）不支持自动生成主键数据库（selectKey）

对于不支持自动生成主键列的数据库和可能不支持自动生成主键的 JDBC 驱动，可以使用selectKey标签来生成主键。

selectKey 元素描述如下：

```xml
<selectKey
  keyProperty="id"
  resultType="int"
  order="BEFORE"
  statementType="PREPARED">
```

selectKey 元素的属性:

属性
描述

keyProperty
selectKey 语句结果应该被设置到的目标属性。如果生成列不止一个，可以用逗号分隔多个属性名称。

keyColumn
返回结果集中生成列属性的列名。如果生成列不止一个，可以用逗号分隔多个属性名称。

resultType
结果的类型。通常 MyBatis 可以推断出来，但是为了更加准确，写上也不会有什么问题。MyBatis 允许将任何简单类型用作主键的类型，包括字符串。如果生成列不止一个，则可以使用包含期望属性的 Object 或 Map。

order
可以设置为 BEFORE 或 AFTER。如果设置为 BEFORE，那么它首先会生成主键，设置 keyProperty 再执行插入语句。如果设置为 AFTER，那么先执行插入语句，然后是 selectKey 中的语句 - 这和 Oracle 数据库的行为相似，在插入语句内部可能有嵌入索引调用。

statementType
和前面一样，MyBatis 支持 STATEMENT，PREPARED 和 CALLABLE 类型的映射语句，分别代表 Statement, PreparedStatement 和 CallableStatement 类型。

**案例演示**：

**1、** 添加selectKey标签，设置生成ID算法；

```java
    <insert id="insertUser" parameterType="user" useGeneratedKeys="true" keyColumn="user_id" keyProperty="userId">
        <selectKey keyProperty="user.userId" keyColumn="user_id" resultType="long" order="BEFORE" >
            select max(user_id)+1 as user_id from base_user
        </selectKey>
        INSERT INTO base_user (user_id,user_name,login_name)
        VALUES (#{user.userId},#{user.userName},#{user.loginName})
    </insert>
```

**1、** 测试，可以看出是先生成了ID，然后设置到实体类中；

#### sql

sql这个元素可以用来定义可重用的 SQL 代码片段，以便在其它语句中使用。

```java
    <!--定义通用SQL 片段 某个表的某些列-->
    <sql id="commonSql">
        ${alias}.user_id,${alias}.user_name,${alias}.login_name 
    </sql>
```

alias参数可以静态地（在加载的时候）确定下来，并且可以在不同的 include 元素中定义不同的参数值。

```java
    <!--根据ID查询用户-->
    <select id="selectOneById" resultType="user" databaseId="mysql">
    select
        <include refid="commonSql"><property name="alias" value="base_user"/></include>
     from base_user where user_id ={id}
  </select>
```

也可以在 include 元素的 refid 属性或内部语句中使用属性值，例如：

```xml
<sql id="sometable">
  ${prefix}Table
</sql>
<sql id="someinclude">
  from
    <include refid="${include_target}"/>
</sql>
<select id="select" resultType="map">
  select
    field1, field2, field3
  <include refid="someinclude">
    <property name="prefix" value="Some"/>
    <property name="include_target" value="sometable"/>
  </include>
</select>
```

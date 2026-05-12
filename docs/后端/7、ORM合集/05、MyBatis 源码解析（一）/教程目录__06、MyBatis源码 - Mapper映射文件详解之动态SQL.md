# 06、MyBatis源码 - Mapper映射文件详解之动态SQL
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/5/6.html
- 分类：ORM框架
- 分组：教程目录
### 动态 SQL

所谓动态 SQL就是根据用户输入参数等才能确定的语句，根据用户输入参数执行不同的增删改查。

动态SQL 是 MyBatis 的强大特性之一。如果你使用过 JDBC 或其它类似的框架，你应该能理解根据不同条件拼接 SQL 语句有多痛苦，例如拼接时要确保不能忘记添加必要的空格，还要注意去掉列表最后一个列名的逗号。利用动态 SQL，可以彻底摆脱这种痛苦。

使用动态 SQL 并非一件易事，但借助可用于任何 SQL 映射语句中的强大的动态 SQL 语言，MyBatis 显著地提升了这一特性的易用性。

如果你之前用过 JSTL 或任何基于类 XML 语言的文本处理器，你对动态 SQL 元素可能会感觉似曾相识。在 MyBatis 之前的版本中，需要花时间了解大量的元素。借助功能强大的基于 OGNL 的表达式，MyBatis 3 替换了之前的大部分元素，大大精简了元素种类，现在要学习的元素种类比原来的一半还要少。

- if
- choose (when, otherwise)
- trim (where, set)
- foreach

#### if

使用if条件可以对参数进行判断，当结果为真时，再把某个条件拼接到SQL中，可以实现根据参数生成动态SQL的功能。

##### 简单案例

根据用户姓名、登录账号、手机参数，动态的查询用户列表。

**1、** 创建用户查询对象；

```java
@Data
public class UserQuery {
    private String userName;
    // 姓名模糊查询
    private String userName_like;
    private String loginName;
    private String phone;
    private String email;
}
```

**1、** 创建动态SQL；

```java
    // 根据查询参数动态查询用户列表
    List<User> selectDynamicUserList(UserQuery userQuery);
```

```java
    <select id="selectDynamicUserList" resultType="org.pearl.mybatis.demo.pojo.entity.User">
        SELECT
        *
        FROM
        base_user
        WHERE
        <!--test: OGNL表达式，判断参数不为null时，添加if标签中的SQL片段-->
        <if test="userName != null">
            base_user.user_name ={userName}
        </if>
        <if test="loginName != null">
            AND base_user.login_name ={loginName}
        </if>
        <if test="phone != null">
            AND base_user.phone ={phone}
        </if>
    </select>
```

**1、** 执行查询，不同的参数会构建不同的SQL；

```java
        // 动态查询
        UserQuery userQuery=new UserQuery();
        userQuery.setUserName("张巍");
        //userQuery.setLoginName("zhangwei");
        List<User> dynamicUserList = userMapper.selectDynamicUserList(userQuery);
        System.out.println(dynamicUserList);
```

##### OGNL

[官方文档](http://commons.apache.org/proper/commons-ognl/language-guide.html)

对象导航图语言（Object Graph Navigation Language），简称OGNL，是应用于Java中的一个开源的表达式语言（Expression Language），它被集成在Struts2、Mybatis等框架中，作用是对数据进行访问，它拥有类型转换、访问对象方法、操作集合对象等功能。

在MyBatis 中常见的 OGNL 表达式如下：

**取值**：

使用
描述

e.property
访问属性值

e.method(args)
调用对象方法

e1[e2]
访问数组、链表（e2 为序号）或者 Map（e2 为键值）

**逻辑运算**：

使用
描述

e1 or e2
或关系

e1 and e2
与关系

e1 == e2 或者 e1 eq e2
相等

e1 != e2 或者 e1 neq e2
不等

e1 lt e2 ；e1  e2；e1 lte e2；e1 = e2
比较关系

e1 + e2；e1 – e2；e1 * e2；e1 / e2；e1 % e2
运算关系

!e 或者 not e
非，取反

之前的xml可以优化为：

```java
    <select id="selectDynamicUserList" resultType="org.pearl.mybatis.demo.pojo.entity.User">
        SELECT
        *
        FROM
        base_user
        WHERE
        <!--test: OGNL表达式，判断参数不为null时，添加if标签中的SQL片段-->
        <if test="userName != null and userName!= ''">
            base_user.user_name ={userName}
        </if>
        <if test="loginName != null and loginName != ''">
            AND base_user.login_name ={loginName}
        </if>
        <if test="phone != null and phone != ''">
            AND base_user.phone ={phone}
        </if>
    </select>
```

#### choose (when, otherwise)

有时候，我们不想使用所有的条件，而只是想从多个条件中选择一个使用。针对这种情况，MyBatis 提供了 choose 元素，它有点像 Java 中的 switch 语句。

**使用案例**： 传入了ID，就用id查，传入了账号，就只用账号查，没有ID也没有账号，就用电话查

```java
    <select id="selectDynamicUserList" resultType="org.pearl.mybatis.demo.pojo.entity.User">
        SELECT
        *
        FROM
        base_user
        WHERE
        <choose>
            <when test="userId != null and userId!= ''">
                base_user.user_id ={ userId}
            </when>
            <when test="loginName != null and loginName!= ''">
                base_user.login_name ={ loginName}
            </when>
            <otherwise>
                base_user.phone ={ phone}
            </otherwise>
        </choose>
    </select>
```

#### where、trim、set

##### where

之前if标签使用的案例中，会存在某些问题，比如userName为空，WHERE 之后直接拼接AND ，会出现SQL语法错误：

where 元素只会在子元素返回内容的情况下才插入 “WHERE” 子句。而且，若子句的开头为 “AND” 或 “OR”，where 元素也会将它们去除。那么where 就能解决if出现的上述问题。

```java
    <select id="selectDynamicUserList" resultType="org.pearl.mybatis.demo.pojo.entity.User">
        SELECT
        *
        FROM
        base_user
        <!--test: OGNL表达式，判断参数不为null时，添加if标签中的SQL片段-->
        <where>
            <if test="userName != null and userName!= ''">
                base_user.user_name ={userName}
            </if>
            <if test="loginName != null and loginName != ''">
                AND base_user.login_name ={loginName}
            </if>
            <if test="phone != null and phone != ''">
                AND base_user.phone ={phone}
            </if>
        </where>
    </select>
```

##### trim

如果where 元素与你期望的不太一样，你也可以通过自定义 trim 元素来定制 where 元素的功能。

**trim 标签属性**:

属性
功能描述

prefix
前缀属性，若标签内不为空则在 SQL 中添加上前缀

prefixOverrides
前缀覆盖属性，若标签中有多余的前缀，将会被覆盖（其实就是丢弃该前缀）

suffix
后缀属性，若标签内不为空则在 SQL 中添加上后缀

suffixOverrides
后缀覆盖属性，若标签中有多余的后缀，将会被覆盖（其实就是丢弃该后缀）

比如，和 where 元素等价的自定义 trim 元素为：

```xml
<trim prefix="WHERE" prefixOverrides="AND |OR ">
  ...
</trim>
```

上述语句的意思为，如果trim标签下生成的SQL片段不为空，则会添加WHERE关键字，如果存在多余的AND 或者OR怎会被删除。

##### set

用于动态更新语句的类似trim解决方案叫做 set。set 元素可以用于动态包含需要更新的列，忽略其它不更新的列。比如：

```xml
<update id="updateAuthorIfNecessary">
  update Author
    <set>
      <if test="username != null">username=#{username},</if>
      <if test="password != null">password=#{password},</if>
      <if test="email != null">email=#{email},</if>
      <if test="bio != null">bio=#{bio}</if>
    </set>
  where id=#{id}
</update>
```

这个例子中，set 元素会动态地在行首插入 SET 关键字，并会删掉额外的逗号（这些逗号是在使用条件语句给列赋值时引入的）。

来看看与 set 元素等价的自定义 trim 元素吧：

```xml
<trim prefix="SET" suffixOverrides=",">
  ...
</trim>
```

#### foreach

在MyBatis 中，常常会遇到集合类型的参数，虽然我们可以通过 OGNL 表达式来访问集合的某一个元素，但是 OGNL 表达式无法遍历集合。foreach 标签用来遍历数组、列表和 Map 等集合参数，常与 in 关键字搭配使用。

foreach 元素的功能非常强大，它允许你指定一个集合，声明可以在元素体内使用的集合项（item）和索引（index）变量。它也允许你指定开头与结尾的字符串以及集合项迭代之间的分隔符。这个元素也不会错误地添加多余的分隔符。

你可以将任何可迭代对象（如 List、Set 等）、Map 对象或者数组对象作为集合参数传递给 foreach。当使用可迭代对象或者数组时，index 是当前迭代的序号，item 的值是本次迭代获取到的元素。当使用 Map 对象（或者 Map.Entry 对象的集合）时，index 是键，item 是值。

foreach 标签属性：

标签
说明

collection
被遍历集合参数的名称，如 list；

open
遍历开始时插入到 SQL 中的字符串，如 ( ；

close
遍历结束时插入到 SQL 中的字符串，如 ) ；

separator
分割符，在每个元素的后面都会插入分割符；

item
元素值，遍历集合时元素的值；

index
元素序列，遍历集合时元素的序列。

##### （1）遍历List

**1、** 接口；

```java
    // 查询某些机构下的用户
    List<User> selectUserListByOrgId(List<Integer> ids);
```

**1、** xml；

```java
    <select id="selectUserListByOrgId" resultType="org.pearl.mybatis.demo.pojo.entity.User">
        SELECT
        *
        FROM
        base_user
        WHERE base_user.organization_id IN
        <foreach collection="list" open="(" close=")" separator="," item="item" index="index">
           {item}
        </foreach>
    </select>
```

**1、** SQL；

##### （2）遍历数组

如果ids 参数使用 @Param 注解指定了参数名称，则 foreach 标签中的 collection 属性必须为该名称；但若未指定名称，则在 foreach 标签中使用默认数组名称 array。

```java
    <select id="selectUserListByOrgId" resultType="org.pearl.mybatis.demo.pojo.entity.User">
        SELECT
        *
        FROM
        base_user
        WHERE base_user.organization_id IN
        <foreach collection="array" open="(" close=")" separator="," item="item" index="index">
           {item}
        </foreach>
    </select>
```

##### （3）遍历Map

使用 foreach 标签遍历 Map 时，collection 属性值为注解@Param指定的参数名，且 item 是 Map 的键值，index 是键名。由于 key 是字段名称，因此不能使用#{}作为占位符，只能使用`$`{}在字符串中替换。

```java
    // 根据Map查询用户列表
    List<User> selectUserListByMap(@Param("maps") Map<String,Object> maps);
```

```java
    <select id="selectUserListByMap" resultType="org.pearl.mybatis.demo.pojo.entity.User">
        SELECT
        *
        FROM
        base_user
        WHERE
        <foreach collection="maps" item="val" index="key" separator="AND">
            ${key} ={val}
        </foreach>
    </select>
```

##### （4）批量保存

批量保存是一个常用操作，比如Mybatis Plus提供了insertBatch()方法，但是其本质还是循环插入，在Mybatis中，foreach也可用来执行批量保存操作，单条语句一次插入多条数据。

原生SQL：

```java
INSERT INTO base_user ( user_name, login_name ) VALUES
 ( "aaa", "aaaa" ),
 ( "bbb", "bbbb" );
```

Mybatis：

```java
    int insertBatch(List<User> userList);
```

```java
    <insert id="insertBatch">
        INSERT INTO base_user ( user_name, login_name ) VALUES
        <foreach collection="list" item="user" separator=",">
            (#{user.userName},{user.loginName})
        </foreach>
    </insert>
```

注意事项：

- 批量保存如果拆分成多个SQL，使用；分割时，Mysql数据库连接参数需要添加“allowMultiQueries=true”开启多语句执行。
- Oracle时不支持以上使用方式，可以使用begin、end或者中间表或其他方式插入。

#### script

要在带注解的映射器接口类中使用动态 SQL，可以使用 script 元素。但是这种方式确实不太美观，一般不推荐使用，比如:

```java
   @Update({"<script>",
      "update Author",
      "  <set>",
      "    <if test='username != null'>username=#{username},</if>",
      "    <if test='password != null'>password=#{password},</if>",
      "    <if test='email != null'>email=#{email},</if>",
      "    <if test='bio != null'>bio=#{bio}</if>",
      "  </set>",
      "where id=#{id}",
      "</script>"})
    void updateAuthorValues(Author author);
```

#### bind

bind 标签可以使用 OGNL 表达式创建一个变量井将其绑定到上下文中。

**bind属性列表**：

属性
说明

name
绑定到上下文的变量名

value
OGNL 表达式

在进行模糊查询时，使用‘%#{}%会报错，如果使用“`$`{}”拼接字符串，则无法防止 SQL 注入问题。如果使用字符串拼接函数或连接符号，但不同数据库的拼接函数或连接符号不同。bind标签可以绑定%到查询参数中，然后再赋值给name参数，再在SQL中引用此变量。

```xml
<!--使用bind元素进行模糊查询-->
<select id="selectUserByBind" resultType="com.po.MyUser" parameterType= "com.po.MyUser">
    <!-- bind 中的 uname 是 com.po.MyUser 的属性名-->
    <bind name="paran_uname" value="'%' + uname + '%'"/>
        select * from user where uname like{paran_uname}
</select>
```

#### 内置参数（_databaseId、_parameter）

mapper接口除了传过来的参数可以取值判断外，还提供了两个内置参数（_parameter 、_databaseId ）使用。

##### _databaseId

如果配置了databaseIdProvider标签， _databaseId就是代表当前数据库的别名，mysql或者oracle等等。就可以在动态代码中使用名为 “_databaseId” 的变量来为不同的数据库构建特定的语句。

```xml
<insert id="insert">
  <selectKey keyProperty="id" resultType="int" order="BEFORE">
    <if test="_databaseId == 'oracle'">
      select seq_users.nextval from dual
    </if>
    <if test="_databaseId == 'db2'">
      select nextval for seq_users from sysibm.sysdummy1"
    </if>
  </selectKey>
  insert into users values (#{id},{name})
</insert>
```

##### _parameter

_parameter 代表整个参数：

- 单个参数，_parameter 就是这个参数
- 多个参数 会被封装成一个map，_parameter就是代表这个map

```xml
<select id="getEmpByDataBaseId" resultType="emp">
　　<if test="_databaseId=='mysql'">
　　　　select * from employee
　　　　<if test="_parameter!=null">
　　　　　　where last_name=#{_parameter.lastName}
　　　　</if>
　　</if>
　　<if test="_databaseId=='oracle'">
　　　　select * from employees_tbl
　　</if>
</select>
```

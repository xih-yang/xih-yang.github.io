# 05、MyBatis源码 - Mapper映射文件详解之参数处理及结果映射
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/5/5.html
- 分类：ORM框架
- 分组：教程目录
## 参数处理

### 字符串替换

Mybatis 的Mapper.xml语句中parameterType向SQL语句传参有两种方式：#{}和`$`{}。

#### #{}和${}

##### （1）单个基本类型参数

单个的基本类型参数，mybatis不会做特殊处理，直接使用#{参数名}取出参数值。

```java
    User selectOneById(Long id);
```

```java
    <!--根据ID查询用户-->
    <select id="selectOneById" resultType="user" >
    select
        *
     from base_user where user_id ={id}
  </select>
```

##### （2）多个基本类型参数

多个基本类型参数参数时，mybatis会做特殊处理。

**例如以下映射文件**：

```java
    User selectOneById(Long id,String userName);
```

```java
    <select id="selectOneById" resultType="user" >
    select
        *
     from base_user where user_id ={id} and user_name=#{userName}
  </select>
```

多个参数会被封装成一个 SortedMap`` ，比如上述 代码中, 会分装为{ 0：arg0，1：arg1}，那么在xml中使用#{id}和#{userName}，则无法从Map中获取到对应的值，这种情况时，mybatis提供了多种方式获取参数。

**方式1：使用[arg1, arg0, param1, param2]获取**

arg0或者param1表示第一个参数，可以通过设置#{arg0}或者#{param1}获取第一个参数，这种方法不建议使用，sql层表达不直观，且一旦顺序调整容易出错。

```java
    <!--根据ID查询用户-->
    <select id="selectOneById" resultType="user" >
    select
        *
     from base_user where user_id ={
     param1} and user_name=#{
     param2}
  </select>
```

**方式2：使用@Param注解设置参数名**

使用@Param注解指定参数名称解析，使用#{@Param中的value值}即可获取参数

```java
    User selectOneById(@Param("id") Long id,@Param("userName")String userName);
```

```java
    <select id="selectOneById" resultType="user" >
    select
        *
     from base_user where user_id ={id} and user_name=#{userName}
  </select>
```

##### （3）POJO类

参数较多时，超过三个一般建议使用对象封装，比如直接传入entity类，或者封装为Query对象。通过#{属性名}:取出传入的pojo的属性值。

```java
    int insertUser( User user);
```

```java
    <insert id="insertUser">
        INSERT INTO base_user (user_id,user_name,login_name)
        VALUES (#{
     userId},#{
     userName},#{
     loginName})
    </insert>
```

##### （4）Map

也可以传入map，使用#{key}，传入对应的参数，但是不建议这么做，因为一个Map，别人一下子也看不出来塞的些啥。。。

```java
    User selectOneById(Map<String,Object> map);
```

```java
    <select id="selectOneById" resultType="user">
    select
        *
     from base_user where user_id ={id} and user_name=#{userName}
  </select>
```

##### （5）collection集合

如果是Collection (List、set）类型或者是数组，也会特殊处理，也是把传入的list或者数组封装在map中。可以使用collection[0]映射参数，如果是List还可以使用这个list[0]，数组使用array[0]。

```java
   User selectOneById(List<Long> ids);
```

```java
    <select id="selectOneById" resultType="user">
    select
        *
     from base_user where user_id ={
     list[0]}
  </select>
```

**#{}和${}的区别**：

默认情况下，使用 #{} 参数语法时，MyBatis 会创建 PreparedStatement 参数占位符，并通过占位符安全地设置参数（就像使用 ? 一样）。是以预编译的形式，将参数设置到sql语句中，防止sql注入。

${}取出的值直接拼装在sql语句中，会有安全问题。

大多情况下，我们去参数的值都应该去使用#{}，#{}方式能够很大程度防止sql注入。`$`{}方式一般用于传入数据库对象，例如传入表名，一般能用#{}的就别用 `$`{}。

### 参数约束

#{}可以设置参数的一些规则，一般只须简单指定属性名，顶多要为可能为空的列指定 jdbcType，其他的事情交给 MyBatis 自己去推断就行了。

```java
#{property,javaType=int,jdbcType=NUMERIC,typeHandler=MyTypeHandler,numericScale=2,resultMap=departmentResultMap}
```

属性
描述

property
参数

javaType
JAVA数据类型，通常可以根据参数对象的类型确定 javaType，除非该对象是一个 HashMap。这个时候，你需要显式指定 javaType 来确保正确的类型处理器（TypeHandler）被使用。

jdbcType
数据库数据类型，JDBC 要求，如果一个列允许使用 null 值，并且会使用值为 null 的参数，就必须要指定 JDBC 类型（jdbcType）。Mybatis对null都会处理为JDBC中的Other，Mysql会识别，但是Oracle不能识别，此时就需要处理，需要地指定jdbcType 为null。

typeHandler
数据类型处理器

numericScale
对于数值类型，还可以设置 numericScale 指定小数点后保留的位数。

mode
使用存储过程时，存储过程有三种类型的参数，分别为 IN（输入参数），OUT（输出参数），INOUT（输入输出参数）。如果参数的 mode 为 OUT 或 INOUT，将会修改参数对象的属性值，以便作为输出参数返回。

resultMap
如果 mode 为 OUT（或 INOUT），而且 jdbcType 为 CURSOR（也就是 Oracle 的 REFCURSOR），你必须指定一个 resultMap 引用来将结果集 ResultMap 映射到参数的类型上。要注意这里的 javaType 属性是可选的，如果留空并且 jdbcType 是 CURSOR，它会被自动地被设为 ResultMap。

### 参数映射

参数是MyBatis 非常强大的元素。对于大多数简单的使用场景，你都不需要使用复杂的参数，比如：

```java
    <!--根据ID查询用户-->
    <select id="selectOneById" resultType="user" >
    select
        *
     from base_user where user_id ={id}
  </select>
```

上面的这个示例说明了一个非常简单的命名参数映射。鉴于参数类型（parameterType）会被自动设置为 int，这个参数可以随意命名。原始类型或简单数据类型（比如 Integer 和 String）因为没有其它属性，会用它们的值来作为参数。 然而，如果传入一个复杂的对象，行为就会有点不一样了。比如：

```java
    <insert id="insertUser" parameterType="user" useGeneratedKeys="true" keyColumn="user_id" keyProperty="userId">
        INSERT INTO base_user (user_id,user_name,login_name)
        VALUES (#{user.userId},#{user.userName},#{user.loginName})
    </insert>
```

如果User 类型的参数对象传递到了语句中，会查找 id、username 和 password 属性，然后将它们的值传入预处理语句的参数中。

## 结果映射

### resultType

resultType=》返回值类型。使用别名或者全类名，如果返回的是集合，书写为集合中元

素的类型，mybatis会把每条结果封装为一个对象，并放入集合中，不能和resultMap同时使用。

**返回某个实体类对象**：

```java
    <select id="selectOneById" resultType="user">
    select
        *
     from base_user where user_id ={collection[0]}
  </select>
```

**返回集合：**

```java
    <select id="getAllUser" resultType="org.pearl.mybatis.demo.pojo.entity.User">
        SELECT * FROM base_user
    </select>
```

**返回单个Map：**

返回Map时，只需要指定resultType为map即可，返回的map会以数据库字段为key，值为value.

```java
    Map<String,Object> selectOneById(Long id);
```

```java
    <!--根据ID查询用户-->
    <select id="selectOneById" resultType="map">
    select
        *
     from base_user where user_id ={id}
  </select>
```

返回结果

```java
{
     password=$2a$12$/V9KqbnIRWuyzUsfDmADR.urue.m750mgiTsYYR5Ut19U0tsbOd3y, login_name=Angel, gender=0, user_id=1, user_name=Angel-bo, organization_id=1, remark=, state=true, create_date=2018-11-06 06:20:56.0, modify_date=2018-11-06 06:20:56.0}
```

**返回多个Map：**

比如多条数据封装为Map，以主键为key，每条数据对象为value时，只需要使用`@MapKey`指定key即可

```java
    @MapKey(value = "user_id")
    Map<Long,User> getAllUser();
```

```java
    <select id="getAllUser" resultType="map">
        SELECT * FROM base_user
    </select>
```

### resultMap

在原生的JDBC中，映射结果集时，需要判断是有值，然后获取值，再封装到返回对象中。

```java
 Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT user_name, age FROM imooc_goddess");
        //如果有数据，rs.next()返回true
        while(rs.next()){
            System.out.println(rs.getString("user_name")+" 年龄："+rs.getInt("age"));
        }
```

resultMap可以让你从 90% 的 JDBC ResultSets 数据提取代码中解放出来，并在一些情形下允许你进行一些 JDBC 不支持的操作。实际上，在为一些比如连接的复杂语句编写映射代码的时候，一份 resultMap 能够代替实现同等功能的数千行代码。ResultMap 的设计思想是，对简单的语句做到零配置，对于复杂一点的语句，只需要描述语句之间的关系就行了。

#### 自动结果映射

全局setting设置中， autoMappingBehavior默认是PARTIAL，开启自动映射的功能。唯一的要求是列名和javaBean属性名一致。如果autoMappingBehavior设置为null则会取消自动映射。

如果数据库字段命名规范，比如使用字母+_，POJO属性符合驼峰命名法，如A_COLUMN=》aColumn，我们可以开启自动驼峰命名规则映射功能，mapUnderscoreToCamelCase=true。

在这些情况下，MyBatis 会在幕后自动创建一个 ResultMap，再根据属性名来映射列到 JavaBean 的属性上。如果列名和属性名不能匹配上，可以在 SELECT 语句中设置列别名（这是一个基本的 SQL 特性）来完成匹配。

```xml
<select id="selectUsers" resultType="User">
  select
    user_id             as "id",
    user_name           as "userName",
    hashed_password     as "hashedPassword"
  from some_table
  where id ={id}
</select>
```

自动映射配置项

```java
 <setting name="autoMappingBehavior" value="PARTIAL"/>
```

有三种自动映射等级：

- NONE - 禁用自动映射。仅对手动映射的属性进行映射。
- PARTIAL - 对除在内部定义了嵌套结果映射（也就是连接的属性）以外的属性进行映射
- FULL - 自动映射所有属性。

默认值是 PARTIAL，这是有原因的。当对连接查询的结果使用 FULL 时，连接查询会在同一行中获取多个不同实体的数据，因此可能导致非预期的映射。

### 高级结果映射

如果数据库字段和返回结果类无法对应上时，可以使用HashMap接受， 但是HashMap并不是一个很好的领域模型，应该使用 JavaBean 或 POJO（Plain Old Java Objects，普通老式 Java 对象）作为领域模型。

数据库不可能永远是你所想或所需的那个样子。 我们希望每个数据库都具备良好的第三范式或 BCNF 范式，可惜它们并不都是那样。 如果能有一种数据库映射模式，完美适配所有的应用程序，那就太好了，但可惜也没有。 而 ResultMap 就是 MyBatis 对这个问题的答案。使用ResultMap可以自定义结果集映射，实现复杂结果集对象封装。

resultMap高级结果映射将结果联合映射到目标实体中。这里的目标实体通常包含其他实体对象、集合等元素。常用在一对一，一对多、多对一、多对多的关系表中。

**下面是resultMap 元素的概念视图**：

- constructor - 用于在实例化类时，注入结果到构造方法中（当创建实体类时需要传构造参数时使用）
- idArg - ID 参数；标记出作为 ID 的结果可以帮助提高整体性能
- arg - 将被注入到构造方法的一个普通结果
- id – 一个 主键ID 结果；标记出作为 键ID 的结果可以帮助提高整体性能（标示主键id，可以提高性能）
- result – 注入到字段或 JavaBean 属性的普通结果，数据库字段和JavaBean 的对应关系（映射普通字段）
- association – 一个复杂类型的关联；许多结果将包装成这种类型（映射实体类内部包含的其他实体类）
- 嵌套结果映射 – 关联可以是 resultMap 元素，或是对其它结果映射的引用
- collection – 一个复杂类型的集合（映射实体类中包含的集合）
- 嵌套结果映射 – 集合可以是 resultMap 元素，或是对其它结果映射的引用
- discriminator – 使用结果值来决定使用哪个 resultMap（根据判断条件，有选择的映射）
- case – 基于某些值的结果映射

嵌套结果映射 – case 也是一个结果映射，因此具有相同的结构和元素；或者引用其它的结果映射

**ResultMap 的属性列表**：

属性
描述

id
当前命名空间中的一个唯一标识，用于标识一个结果映射。

type
类的完全限定名, 或者一个类型别名（关于内置的类型别名，可以参考上面的表格）。

autoMapping
如果设置这个属性，MyBatis 将会为本结果映射开启或者关闭自动映射。 这个属性会覆盖全局的属性 autoMappingBehavior。默认值：未设置（unset）。

比如连表查询时，结果集没有对应的实体类进行封装，那么只能返回Map，但是Map并不规范也不好使用，一般都会定义PO对象，封装各种复杂类型，用于复杂对象封装。

比如连表查询用户表及角色表，此时返回的对象应该定义如下结构(一对一，实际应该是一对多)：

```java
@Data
@ToString
public class UserInfoPo {
    private Long userId;
    private String userName;
    private String loginName;
    private Integer gender;
    private String phone;
    private String address;
    private Integer organizationId;
    private Boolean state;
    private String email;
    // 角色信息
    private Role role;
}
```

#### （1）级联属性封装结果集

**1、** 创建接口；

```java
    UserInfoPo getUserInfoById(Long userId);
```

**1、** 编写XML，指定resultMap，在resultMap中指定数据库列名和返回对象的映射关系，（column=“role_id”property=“role.roleId”）表示将role_id字段的值，赋值给UserInfoPo对象role属性对象的roleId字段；

```java
      <!--查询某个用户的信息及角色信息-->
    <select id="getUserInfoById" resultMap="userAndRole">
        SELECT
        base_user.* , base_role.*
        FROM
        base_user
        LEFT JOIN base_user_role ON ( base_user.user_id = base_user_role.user_id )
        LEFT JOIN base_role ON (base_user_role.role_id = base_role.role_id )
        WHERE base_user.user_id ={ userId }
    </select>
    <resultMap id="userAndRole" type="org.pearl.mybatis.demo.pojo.po.UserInfoPo">
        <result column="role_id" property="role.roleId"/>
        <result column="role_name" property="role.roleName"/>
    </resultMap>
```

**1、** 执行查询，返回了复杂结果集，并按照resultMap配置的规则进行了映射；

#### （2）association关联对象

可以使用association标签，指定某个属性的关联对象。association 中需要指定result，内部无法自动映射。。。

```java
    <resultMap id="userAndRole" type="org.pearl.mybatis.demo.pojo.po.UserInfoPo" autoMapping="true">
        <id property="userId" column="user_id"/>
        <association property="role" javaType="org.pearl.mybatis.demo.pojo.entity.Role">
            <id column="role_id" property="roleId"/>
            <result column="role_name" property="roleName"/>
        </association>
    </resultMap>
```

#### （3）association关联的嵌套 Select 查询

某些多表关联查询情况下，可以使用分步查询，比如查询用户及用户机构，可以先查询出用户，再根据机构ID查询机构信息，分步操作，这种方式还可以实现懒加载功能。

association嵌套 Select 查询属性：

属性
描述

column
数据库中的列名，或者是列的别名。一般情况下，这和传递给

select
用于加载复杂类型属性的映射语句的 ID，它会从 column 属性指定的列中检索数据，作为参数传递给目标 select 语句。 具体请参考下面的例子。注意：在使用复合主键的时候，你可以使用 column="{prop1=col1,prop2=col2}" 这样的语法来指定多个传递给嵌套 Select 查询语句的列名。这会使得 prop1 和 prop2 作为参数对象，被设置为对应嵌套 Select 语句的参数。

fetchType
可选的。有效值为 lazy 和 eager。 指定属性后，将在映射中忽略全局配置参数 lazyLoadingEnabled，使用属性的值。

**1、** 添加根据机构ID查询机构信息；

实体类：

```java
@Data
public class Organization implements Serializable {
    private static final long serialVersionUID = 1L;
    private Integer organizationId;
    private String organizationName;
    private String organizationRemark;
    private Integer organizationParentId;
    private Integer organizationType;
    private Integer createUserId;
    private Date createDate;
    private Integer modifyUserId;
    private Date modifyDate;
    private Integer state;
    private String showOrganizationName;
}
```

接口及XML

```java
  Organization getOrgById(Long id);
```

```java
    <select id="getOrgById" resultType="org.pearl.mybatis.demo.pojo.entity.Organization">
        SELECT * FROM base_organization WHERE organization_id ={id}
    </select>
```

**1、** 添加分步查询用户信息包含机构信息sql；

实体类：

```java
@Data
@ToString
public class UserInfoPo {
    private Long userId;
    private String userName;
    private String loginName;
    private Integer gender;
    private String phone;
    private String address;
    private Integer organizationId;
    private Boolean state;
    private String email;
/*
    // 角色信息
    private Role role;*/
    // 机构信息
    private Organization organization;
}
```

映射文件

```java
    UserInfoPo getUserInfoById(Long userId);
```

```java
    <select id="getUserInfoById" resultMap="userAndOrg">
      SELECT * FROM base_user WHERE base_user.user_id ={ userId }
    </select>
    <resultMap id="userAndOrg" type="org.pearl.mybatis.demo.pojo.po.UserInfoPo" autoMapping="true">
        <id property="userId" column="user_id"/>
        <!--select：调用目标的方法查询当前属性的值-->
        <!--column:将指定列的值传入目标方法-->
        <association property="organization"
                     javaType="org.pearl.mybatis.demo.pojo.entity.Role"
                     select="org.pearl.mybatis.demo.dao.UserMapper.getOrgById"
                     column="organization_id"/>
    </resultMap>
```

**1、** 查询操作；

MyBatis 能够对分步嵌套查询进行延迟加载，当第二步查询的结果集使用时，才会进行查询操作。

全局配置：

```java
        <setting name="lazyLoadingEnabled" value="true"/>
        <setting name="aggressiveLazyLoading" value="false"/>
```

`fetchType=eager/lazy`可以覆盖全局的延迟加载策略，指定立即加载（eager）或者延迟加载（lazy）。

可以看出设置以后，当嵌套对象（机构）未使用时，只执行了查询用户的SQL。

#### （4）Collection-集合类型

对于一对多查询时，一个用户会对应多个角色，那么查询的结果集对象为：

```java
public class UserInfoPo {
	// other....
    // 角色信息
    private List<Role> roles;
}
```

这种场景需要使用到collection标签：

```java
    UserInfoPo getUserInfoById(Long userId);
```

```java
    <!--查询某个用户的信息及角色信息-->
    <select id="getUserInfoById" resultMap="userAndRole">
        SELECT
        base_user.* , base_role.*
        FROM
        base_user
        LEFT JOIN base_user_role ON ( base_user.user_id = base_user_role.user_id )
        LEFT JOIN base_role ON (base_user_role.role_id = base_role.role_id )
        WHERE base_user.user_id ={ userId }
    </select>
            <resultMap id="userAndRole" type="org.pearl.mybatis.demo.pojo.po.UserInfoPo" autoMapping="true">
            <id property="userId" column="user_id"/>
            <!--collection: 表示集合属性-->
            <!--ofType：表示集合中元素的类型-->
            <collection property="roles" ofType="org.pearl.mybatis.demo.pojo.entity.Role">
                <id property="roleId" column="role_id"/>
                <id column="role_name" property="roleName"/>
            </collection>
        </resultMap>
```

**集合类型分步查询**： 可以把集合查询剥离出来为单独的SQL语句，然后通过collection嵌套进别的查询语句中，也可以实现懒加载。

**1、** 添加集合查询语句，通过用户ID查询出所有的角色信息；

```java
    List<Role> getRolesByUserId(Long id);
```

```java
    <select id="getRolesByUserId" resultType="org.pearl.mybatis.demo.pojo.entity.Role">
            SELECT
	            *
            FROM
	            base_role
	        LEFT JOIN base_user_role ON base_role.role_id = base_user_role.role_id
            WHERE
	            base_user_role.user_id =#{id}
        </select>
```

**1、** 将第一步的查询语句嵌套到用户信息查询的语句中；

```java
        <select id="getUserInfoById" resultMap="userAndRole" >
          SELECT * FROM base_user WHERE base_user.user_id ={ userId }
        </select>
    <resultMap id="userAndRole" type="org.pearl.mybatis.demo.pojo.po.UserInfoPo" autoMapping="true">
        <id property="userId" column="user_id"/>
        <collection property="roles" javaType="java.util.List" select="getRolesByUserId" column="user_id"/>
    </resultMap>
```

**多列值传递**

在分步查询中，嵌套查询语句中，我们只传递了一个参数过column指定，将对应的列的数据

传递过去，我们有时需要传递多列数据。这种情况可以通过使用{key1=column1,key2=column2…}的形式。

```java
           column="{organization_id=id,organization_name=name}"/>
```

#### discriminator 鉴别器

有时候，一个数据库查询可能会返回多个不同的结果集（但总体上还是有一定的联系的）。 鉴别器（discriminator）元素就是被设计来应对这种情况的，另外也能处理其它情况，例如类的继承层次结构。 鉴别器的概念很好理解——它很像 Java 语言中的 switch 语句。

一个鉴别器的定义需要指定 column 和 javaType 属性。column 指定了 MyBatis 查询被比较值的地方。 而 javaType 用来确保使用正确的相等测试（虽然很多情况下字符串的相等测试都可以工作）。

例如：

```xml
<resultMap id="vehicleResult" type="Vehicle">
  <id property="id" column="id" />
  <result property="vin" column="vin"/>
  <result property="year" column="year"/>
  <result property="make" column="make"/>
  <result property="model" column="model"/>
  <result property="color" column="color"/>
  <discriminator javaType="int" column="vehicle_type">
    <case value="1" resultMap="carResult"/>
    <case value="2" resultMap="truckResult"/>
    <case value="3" resultMap="vanResult"/>
    <case value="4" resultMap="suvResult"/>
  </discriminator>
</resultMap>
```

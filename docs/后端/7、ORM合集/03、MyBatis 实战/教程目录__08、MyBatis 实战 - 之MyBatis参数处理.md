# 08、MyBatis 实战 - 之MyBatis参数处理
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/6/8.html
- 分类：ORM框架
- 分组：教程目录
## 一、单个参数且为简单类型参数

```java
代码演示：
StudentMapper 接口
```

```java
public interface StudentMapper {
    /**
     * 当接口中的参数只有一个（单个参数），并且参数类型为简单类型
     */
    List<Student> selectById(Long id);
    List<Student> selectByName(String name);
    List<Student> selectByBirth(Date birth);
    List<Student> selectBySex(Character sex);
  }
```

```java
StudentMapper.xml 
```

```xml
<mapper namespace="com.powernode.mybatis.mapper.StudentMapper">
    <select id="selectById" resultType="Student">
        select * from t_student where id ={id}
    </select>
    <select id="selectByName" resultType="Student">
        select * from t_student where name ={name}
    </select>
    <select id="selectByBirth" resultType="Student">
        select * from t_student where birth ={birth}
    </select>
    <select id="selectBySex" resultType="Student">
        select * from t_student where sex ={sex}
    </select>
</mapper>
```

```java
测试类
```

```java
@Test
    public void testSimple() throws ParseException {
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        StudentMapper mapper = sqlSession.getMapper(StudentMapper.class);
//        List<Student> students = mapper.selectById(1L);
//        List<Student> students = mapper.selectByName("张三");
//        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
//        Date birth = sdf.parse("1990-02-01");
//        List<Student> students = mapper.selectByBirth(birth);
        Character character = Character.valueOf('男');
        List<Student> students = mapper.selectBySex(character);
        students.forEach(e -> System.out.println(e.toString()));
        sqlSession.close();
    }
```

```java
运行结果
```

```java
19:21:28.479 default [main] DEBUG c.p.m.m.StudentMapper.selectBySex - ==>  Preparing: select * from t_student where sex = ?
19:21:28.536 default [main] DEBUG c.p.m.m.StudentMapper.selectBySex - ==> Parameters: 男(String)
19:21:28.589 default [main] DEBUG c.p.m.m.StudentMapper.selectBySex - <==      Total: 1
Student{
     id=1, name='张三', age=20, height=1.81, birth=Thu Feb 01 00:00:00 GMT+08:00 1990, sex=男}
```

```java
补充一下：
1、<select id="selectById" resultType="Student" parameterType="java.lang.Long"> 	
可以不用加parameterType属性，mybatis会底层会自动找到对应的参数类型
2、parameterType属性的作用:
	告诉mybatis框架，我这个方法的参数类型是什么类型。
	mybatis框架自身带有类型自动推断机制，所以大部分情况下parameterType属性都是可以省略不写的。
SQL语句最终是这样的:
select * from t student where id = ? JDBC代码是一定要给?传值的。
怎么传值?ps.setXxx(第几个问号，传什么值);
ps.setLong(1，1L);
ps.setstring(1,"zhangsan");
ps.setDate(1, new Date());
ps.setInt(1，100);
...
mybatis底层到底调用setXxx的哪个方法，取决于parameterType属性的值。
注意:mybatis框架实际上内置了很多别名。可以参考开发手册。
```

## 二、参数为Map集合

```java
代码演示：
StudentMapper 接口
```

```java
public interface StudentMapper {
    /**
     * Map集合参数
     */
    int insertStudentMap(Map<String,Object> map);
}
```

```java
StudentMapper.xml 
```

```xml
<mapper namespace="com.powernode.mybatis.mapper.StudentMapper">
	<insert id="insertStudentMap" parameterType="map">
        insert into t_student values (null,#{name},#{age},#{height},#{birth},#{sex})
    </insert>
</mapper>
```

```java
测试类
```

```java
@Test
    public void testMap(){
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        StudentMapper mapper = sqlSession.getMapper(StudentMapper.class);
        Map<String,Object> map = new HashMap<>();
        map.put("name","小明");
        map.put("age",23);
        map.put("birth",new Date());
        map.put("height",1.7);
        map.put("sex","女");
        int i = mapper.insertStudentMap(map);
        System.out.println(i);
        sqlSession.commit();
        sqlSession.close();
    }
```

## 三、参数为POJO类

```java
代码演示：
StudentMapper 接口
```

```java
public interface StudentMapper {
    /**
     * Pojo 参数
     */
    int insertStudentPojo(Student student);
}
```

```java
StudentMapper.xml 
```

```xml
<mapper namespace="com.powernode.mybatis.mapper.StudentMapper">
	<insert id="insertStudentPojo" parameterType="Student">
        insert into t_student values (null,#{name},#{age},#{height},#{birth},#{sex})
    </insert>
</mapper>
```

```java
测试类
```

```java
@Test
    public void testPojo(){
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        StudentMapper mapper = sqlSession.getMapper(StudentMapper.class);
        Student student = new Student();
        student.setName("小猪");
        student.setAge(16);
        student.setHeight(1.9);
        student.setSex('女');
        student.setBirth(new Date());
        int i = mapper.insertStudentPojo(student);
        System.out.println(i);
        sqlSession.commit();
        sqlSession.close();
    }
```

## 四、多个参数

```java
根据name和sex查询Student信息。
如果是多个参数的话，mybatis框架底层是怎么做的呢?
mybatis框架会自动创建一个Map集合。并且Map集合是以这种方式存储参数的:
map.put("arg0",name); map.put("arg1",sex);
map.put("param1", name); map.put("param2", sex);
三种写法
<select id="selectByNameAndSex" resultType="student">
		select * from t student where name ={arge} and sex={arg1}
		select *from t student where name =#{param1} and sex=#{param2}
 		select * from t_student where name ={arg0} and sex ={param2}
</select>
代码演示：
StudentMapper 接口
```

```java
public interface StudentMapper {
    /**
     * 多个 参数：
     *  mybatis会自动创建一个map集合，
     */
    List<Student> selectByNameAndSex(String name,Character sex);
}
```

```java
StudentMapper.xml 
```

```xml
<mapper namespace="com.powernode.mybatis.mapper.StudentMapper">
	<select id="selectByNameAndSex" resultType="Student">
        select * from t_student where name ={arg0} and sex ={arg1}
    </select>
</mapper>
```

```java
注意：这个arg0，arg1是mybatis底层框架自动生成的，必须怎么写
测试类
```

```java
@Test
    public void testPojo(){
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        StudentMapper mapper = sqlSession.getMapper(StudentMapper.class);
        Student student = new Student();
        student.setName("小猪");
        student.setAge(16);
        student.setHeight(1.9);
        student.setSex('女');
        student.setBirth(new Date());
        int i = mapper.insertStudentPojo(student);
        System.out.println(i);
        sqlSession.commit();
        sqlSession.close();
    }
```

```java
运行结果
```

```java
19:34:05.620 default [main] DEBUG c.p.m.m.S.selectByNameAndSex - ==>  Preparing: select * from t_student where name = ? and sex = ?
19:34:05.704 default [main] DEBUG c.p.m.m.S.selectByNameAndSex - ==> Parameters: 小美(String), 女(String)
19:34:05.756 default [main] DEBUG c.p.m.m.S.selectByNameAndSex - <==      Total: 1
Student{
     id=4, name='小美', age=16, height=1.9, birth=Sun Oct 23 00:00:00 GMT+08:00 2022, sex=女}
```

## 五、@Param注解

```java
如果不想使用mybatis底层默认的参数，那么可以使用@Param注解来解决
代码演示：
	StudentMapper 接口
```

```java
public interface StudentMapper {
    /**
     * 使用param注解，指定 多个 参数的名字
     */
    List<Student> selectByNameAndSex2(@Param("name") String name, @Param("sex") Character sex);
}
```

```java
StudentMapper.xml 
```

```xml
<mapper namespace="com.powernode.mybatis.mapper.StudentMapper">
	<select id="selectByNameAndSex2" resultType="Student">
        select * from t_student where name ={name} and sex ={sex}
    </select>
</mapper>
```

```java
注意：这个arg0，arg1是mybatis底层框架自动生成的，必须这么写
测试类
```

```java
@Test
    public void testParams(){
        SqlSession sqlSession = SqlSessionUtil.openSqlSession();
        StudentMapper mapper = sqlSession.getMapper(StudentMapper.class);
        List<Student> students = mapper.selectByNameAndSex("小美", '女');
        students.forEach(e-> System.out.println(e.toString()));
        sqlSession.close();
    }
```

```java
运行结果
```

```java
19:34:05.620 default [main] DEBUG c.p.m.m.S.selectByNameAndSex - ==>  Preparing: select * from t_student where name = ? and sex = ?
19:34:05.704 default [main] DEBUG c.p.m.m.S.selectByNameAndSex - ==> Parameters: 小美(String), 女(String)
19:34:05.756 default [main] DEBUG c.p.m.m.S.selectByNameAndSex - <==      Total: 1
Student{
     id=4, name='小美', age=16, height=1.9, birth=Sun Oct 23 00:00:00 GMT+08:00 2022, sex=女}
```

## 六、补充知识点：结果映射

resultMap 元素是 MyBatis 中最重要最强大的元素。它可以让你从 90% 的 JDBC ResultSets 数据提取代码中解放出来，并在一些情形下允许你进行一些 JDBC 不支持的操作。实际上，在为一些比如连接的复杂语句编写映射代码的时候，一份 resultMap 能够代替实现同等功能的数千行代码。ResultMap 的设计思想是，对简单的语句做到零配置，对于复杂一点的语句，只需要描述语句之间的关系就行了。

之前你已经见过简单映射语句的示例，它们没有显式指定 resultMap。比如：

```xml
<select id="selectUsers" resultType="map">
  select id, username, hashedPassword
  from some_table
  where id ={
     id}
</select>
```

上述语句只是简单地将所有的列映射到 HashMap 的键上，这由 resultType 属性指定。虽然在大部分情况下都够用，但是 HashMap 并不是一个很好的领域模型。你的程序更可能会使用 JavaBean 或 POJO（Plain Old Java Objects，普通老式 Java 对象）作为领域模型。MyBatis 对两者都提供了支持。看看下面这个 JavaBean：

```java
package com.someapp.model;
public class User {
  private int id;
  private String username;
  private String hashedPassword;
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
  public String getHashedPassword() {
    return hashedPassword;
  }
  public void setHashedPassword(String hashedPassword) {
    this.hashedPassword = hashedPassword;
  }
}
```

基于JavaBean 的规范，上面这个类有 3 个属性：id，username 和 hashedPassword。这些属性会对应到 select 语句中的列名。这样的一个 JavaBean 可以被映射到 ResultSet，就像映射到 HashMap 一样简单。

```xml
<select id="selectUsers" resultType="com.someapp.model.User">
  select id, username, hashedPassword
  from some_table
  where id ={
     id}
</select>
```

类型别名是你的好帮手。使用它们，你就可以不用输入类的全限定名了。比如：

```xml
<!-- mybatis-config.xml 中 -->
<typeAlias type="com.someapp.model.User" alias="User"/>
<!-- SQL 映射 XML 中 -->
<select id="selectUsers" resultType="User">
  select id, username, hashedPassword
  from some_table
  where id ={
     id}
</select>
```

在这些情况下，MyBatis 会在幕后自动创建一个 ResultMap，再根据属性名来映射列到 JavaBean 的属性上。如果列名和属性名不能匹配上，可以在 SELECT 语句中设置列别名（这是一个基本的 SQL 特性）来完成匹配。比如：

```xml
<select id="selectUsers" resultType="User">
  select
    user_id             as "id",
    user_name           as "userName",
    hashed_password     as "hashedPassword"
  from some_table
  where id ={
     id}
</select>
```

在学习了上面的知识后，你会发现上面的例子没有一个需要显式配置 ResultMap，这就是 ResultMap 的优秀之处——你完全可以不用显式地配置它们。 虽然上面的例子不用显式配置 ResultMap。 但为了讲解，我们来看看如果在刚刚的示例中，显式使用外部的 resultMap 会怎样，这也是解决列名不匹配的另外一种方式。

```xml
<resultMap id="userResultMap" type="User">
  <id property="id" column="user_id" />
  <result property="username" column="user_name"/>
  <result property="password" column="hashed_password"/>
</resultMap>
```

然后在引用它的语句中设置 resultMap 属性就行了（注意我们去掉了 resultType 属性）。比如:

```xml
<select id="selectUsers" resultMap="userResultMap">
  select user_id, user_name, hashed_password
  from some_table
  where id ={
     id}
</select>
```

高级结果映射

MyBatis 创建时的一个思想是：数据库不可能永远是你所想或所需的那个样子。 我们希望每个数据库都具备良好的第三范式或 BCNF 范式，可惜它们并不都是那样。 如果能有一种数据库映射模式，完美适配所有的应用程序，那就太好了，但可惜也没有。 而 ResultMap 就是 MyBatis 对这个问题的答案。

比如，我们如何映射下面这个语句？

```xml
<!-- 非常复杂的语句 -->
<select id="selectBlogDetails" resultMap="detailedBlogResultMap">
  select
       B.id as blog_id,
       B.title as blog_title,
       B.author_id as blog_author_id,
       A.id as author_id,
       A.username as author_username,
       A.password as author_password,
       A.email as author_email,
       A.bio as author_bio,
       A.favourite_section as author_favourite_section,
       P.id as post_id,
       P.blog_id as post_blog_id,
       P.author_id as post_author_id,
       P.created_on as post_created_on,
       P.section as post_section,
       P.subject as post_subject,
       P.draft as draft,
       P.body as post_body,
       C.id as comment_id,
       C.post_id as comment_post_id,
       C.name as comment_name,
       C.comment as comment_text,
       T.id as tag_id,
       T.name as tag_name
  from Blog B
       left outer join Author A on B.author_id = A.id
       left outer join Post P on B.id = P.blog_id
       left outer join Comment C on P.id = C.post_id
       left outer join Post_Tag PT on PT.post_id = P.id
       left outer join Tag T on PT.tag_id = T.id
  where B.id ={
     id}
</select>
```

你可能想把它映射到一个智能的对象模型，这个对象表示了一篇博客，它由某位作者所写，有很多的博文，每篇博文有零或多条的评论和标签。 我们先来看看下面这个完整的例子，它是一个非常复杂的结果映射（假设作者，博客，博文，评论和标签都是类型别名）。 不用紧张，我们会一步一步地来说明。虽然它看起来令人望而生畏，但其实非常简单。

```xml
<!-- 非常复杂的结果映射 -->
<resultMap id="detailedBlogResultMap" type="Blog">
  <constructor>
    <idArg column="blog_id" javaType="int"/>
  </constructor>
  <result property="title" column="blog_title"/>
  <association property="author" javaType="Author">
    <id property="id" column="author_id"/>
    <result property="username" column="author_username"/>
    <result property="password" column="author_password"/>
    <result property="email" column="author_email"/>
    <result property="bio" column="author_bio"/>
    <result property="favouriteSection" column="author_favourite_section"/>
  </association>
  <collection property="posts" ofType="Post">
    <id property="id" column="post_id"/>
    <result property="subject" column="post_subject"/>
    <association property="author" javaType="Author"/>
    <collection property="comments" ofType="Comment">
      <id property="id" column="comment_id"/>
    </collection>
    <collection property="tags" ofType="Tag" >
      <id property="id" column="tag_id"/>
    </collection>
    <discriminator javaType="int" column="draft">
      <case value="1" resultType="DraftPost"/>
    </discriminator>
  </collection>
</resultMap>
```

resultMap 元素有很多子元素和一个值得深入探讨的结构。 下面是resultMap 元素的概念视图。

结果映射（resultMap）

constructor - 用于在实例化类时，注入结果到构造方法中

idArg - ID 参数；标记出作为 ID 的结果可以帮助提高整体性能

arg- 将被注入到构造方法的一个普通结果

id– 一个 ID 结果；标记出作为 ID 的结果可以帮助提高整体性能

result – 注入到字段或 JavaBean 属性的普通结果

association – 一个复杂类型的关联；许多结果将包装成这种类型

嵌套结果映射 – 关联可以是 resultMap 元素，或是对其它结果映射的引用

collection – 一个复杂类型的集合

嵌套结果映射 – 集合可以是 resultMap 元素，或是对其它结果映射的引用

discriminator – 使用结果值来决定使用哪个 resultMap

case – 基于某些值的结果映射

嵌套结果映射 – case 也是一个结果映射，因此具有相同的结构和元素；或者引用其它的结果映射

ResultMap 的属性列表

最好逐步建立结果映射。单元测试可以在这个过程中起到很大帮助。 如果你尝试一次性创建像上面示例那么巨大的结果映射，不仅容易出错，难度也会直线上升。 所以，从最简单的形态开始，逐步迭代。而且别忘了单元测试！ 有时候，框架的行为像是一个黑盒子（无论是否开源）。因此，为了确保实现的行为与你的期望相一致，最好编写单元测试。 并且单元测试在提交 bug 时也能起到很大的作用。

下一部分将详细说明每个元素。

id& result

这些元素是结果映射的基础。id 和 result 元素都将一个列的值映射到一个简单数据类型（String, int, double, Date 等）的属性或字段。

这两者之间的唯一不同是，id 元素对应的属性会被标记为对象的标识符，在比较对象实例时使用。 这样可以提高整体的性能，尤其是进行缓存和嵌套结果映射（也就是连接映射）的时候。

两个元素都有一些属性：

Id和 Result 的属性

支持的JDBC 类型

为了以后可能的使用场景，MyBatis 通过内置的 jdbcType 枚举类型支持下面的 JDBC 类型。

构造方法

通过修改对象属性的方式，可以满足大多数的数据传输对象（Data Transfer Object, DTO）以及绝大部分领域模型的要求。但有些情况下你想使用不可变类。 一般来说，很少改变或基本不变的包含引用或数据的表，很适合使用不可变类。 构造方法注入允许你在初始化时为类设置属性的值，而不用暴露出公有方法。MyBatis 也支持私有属性和私有 JavaBean 属性来完成注入，但有一些人更青睐于通过构造方法进行注入。 constructor 元素就是为此而生的。

看看下面这个构造方法:

```java
public class User {
   //...
   public User(Integer id, String username, int age) {
     //...
  }
//...
}
```

为了将结果注入构造方法，MyBatis 需要通过某种方式定位相应的构造方法。 在下面的例子中，MyBatis 搜索一个声明了三个形参的的构造方法，参数类型以 java.lang.Integer, java.lang.String 和 int 的顺序给出。

```xml
<constructor>
   <idArg column="id" javaType="int"/>
   <arg column="username" javaType="String"/>
   <arg column="age" javaType="_int"/>
</constructor>
```

# 07、MyBatis速成 - 配置自增主键
- 来源：https://ddkk.com/zhuanlan/orm/mybatis/9/7.html
- 分类：ORM框架
- 分组：教程目录
延续上一篇增删改查，在添加的时候使用的是数据库的自增主键，如果换成oracle这种没有自增主键的就无法实现，并且保存完成之后，在程序中是获取不到对象id的。我们打印保存后的对象如下：

## 1.未配置主键自增

```java
    @Test
    public void testMybatisAdd() {
    //测试添加
            SqlSessionFactory sqlSessionFactory = null;
            SqlSession sqlSession = null;
            try {
                sqlSessionFactory = getSqlSessionFactory();
                //openSession可以添加参数，无参数表示不会自动提交，需要手动提交
                sqlSession = sqlSessionFactory.openSession();
//              sqlSession = sqlSessionFactory.openSession(true);
                EmployeeMapper mapper = sqlSession.getMapper(EmployeeMapper.class);
                Employee employee = new Employee();
                //数据库设置id自增
                employee.setLastName("huanan");
                employee.setEmail("tang_man@sina.com");
                employee.setGender("2");
                mapper.addEmployee(employee);
                System.out.println(employee);
                sqlSession.commit();
            } catch (IOException e) {
                e.printStackTrace();
            } finally {
                sqlSession.close();
            }
    }
```

> DEBUG - ooo Using Connection [com.mysql.jdbc.JDBC4Connection@184f6be2]
>
> DEBUG - ==> Preparing: insert into mybatis_employee (last_name,email,gender) values (?,?,?);
>
> DEBUG - ==> Parameters: huanan(String), tang_man@sina.com(String), 2(String)
>
> Employee [id=null, lastName=huanan, email=tang_man@sina.com, gender=2]

这里打印的id=null，mybatis可以通过配置，自动生成主键

## 2.配置主键自增

在`insert` 标签中添加两个值

useGeneratedKeys=”true”表示使用自增主键

keyProperty=”id”表示id为自增主键

```xml
<!-- 插入方法 -->
    <insert id="addEmployee" parameterType="org.mybatis.crud.Employee" useGeneratedKeys="true" keyProperty="id">
        insert into mybatis_employee 
        (last_name,email,gender) 
        values 
        (#{lastName},#{email},#{gender});
    </insert>
```

再次测试添加方法，可以获取到主键的值id=7

> DEBUG - ooo Using Connection [com.mysql.jdbc.JDBC4Connection@1f7030a6]
>
> DEBUG - ==> Preparing: insert into mybatis_employee (last_name,email,gender) values (?,?,?);
>
> DEBUG - ==> Parameters: hussanan(String), tang_@qq.com(String), 2(String)
>
> Employee [id=7, lastName=hussanan, email=tang_@qq.com, gender=2]

## 3.不存在自增主键数据库如何配置

```xml
<!-- 插入方法oracle -->
    <insert id="addEmployeeo">
        <!-- 
        keyProperty=id需要赋值主键的属性，一般都是id 
        order=before表示在插入之前执行该查询
        resultType=Integer表示返回值为integer类型
        -->
        <selectKey keyProperty="id" order="BEFORE" resultType="Integer">
            select employees_seq.nextval from dual;
        </selectKey>
        insert into mybatis_employee 
        (id,last_name,email,gender) 
        values 
        (#{id},#{lastName},#{email},#{gender});
    </insert>
```

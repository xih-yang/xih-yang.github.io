# 12、Spring Data JPA 实战 - 投影Projections-对查询结果的扩展
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/1/12.html
- 分类：ORM框架
- 分组：教程目录
Spring-Data数据查询方法的返回通常的是Repository管理的聚合根的一个或多个实例。但是，有时候我们只需要返回某些特定的属性，不需要全部返回，或者只返回一些复合型的字段。Spring-Data允许我们对特定的返回类型建模，以便更有选择的检索托管聚合的部分视图。

### 1、基于接口的投影

查询执行引擎在运行时为返回的每个元素创建该接口的代理实例，并将调用转发到目标对象的公开方法。

1.1、闭合投影（Closed Projections）：一个投影接口，其get方法都与实体类的属性相同，被认为是一个闭合投影。如果使用闭合投影Spring-Data可以优化查询执行，因为我们知道支持投影代理所需要的所有属性。

比如说一个Admin类如下：

```java
/**
 * admin实体
 *
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@Data
@Entity
@Builder
@Table(name = "jpa_admin")
@NoArgsConstructor
@AllArgsConstructor
public class Admin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String username;
    private String password;
    private String phone;
    private LocalDate createTime;
    @Embedded
    private Address address;
    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;
}
```

Repository中的方法如下：

```java
List<Admin> findByCreateTime(LocalDate createTime);
```

测试，返回Admin打印的SQL语句：

```java
Hibernate: select admin0_.id as id1_0_, admin0_.city as city2_0_, admin0_.county as county3_0_, admin0_.detailed_address as detailed4_0_, admin0_.province as province5_0_, admin0_.zip_code as zip_code6_0_, admin0_.create_time as create_t7_0_, admin0_.password as password8_0_, admin0_.phone as phone9_0_, admin0_.role_id as role_id11_0_, admin0_.username as usernam10_0_ from cfq_jpa_admin admin0_ where admin0_.create_time=?
```

我们不想取出Admin中的全部属性值，那怎么办呢？我们可以新建一个投影接口，提供自己需要属性的get方法，如下，我们只想要username

```java
/**
 * username投影
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
public interface UsernameOnly {
    String getUsername();
}
```

修改Repository方法返回值，测试返回UsernameOnly打印的SQL语句：

```java
Hibernate: select admin0_.username as col_0_0_ from cfq_jpa_admin admin0_ where admin0_.create_time=?
```

可见对sql语句进行了优化。那么如果我们想要返回username和所在city呢？

投影可以嵌套使用。例如还希望包含一些地址信息，请为此创建一个投影接口，并从getAddress()的声明中返回该接口。投影接口如下：

```java
/**
 * 地址投影，只返回city
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
public interface AddressCity {
    String getCity();
}
/**
 * 想返回 username 和 所在城市的投影
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
public interface AdminUsernameAndCity {
    String getUsername();
    AddressCity getAddress();
}
```

修改Repository方法返回值，测试返回AdminUsernameAndCity打印的SQL语句：除了username外，select后，还有address中的属性，做了部分优化

```java
Hibernate: select admin0_.username as col_0_0_, admin0_.city as col_1_0_, admin0_.county as col_1_1_, admin0_.detailed_address as col_1_2_, admin0_.province as col_1_3_, admin0_.zip_code as col_1_4_ from cfq_jpa_admin admin0_ where admin0_.create_time=?
```

1.2、开放投影(Open Projections)：投影接口中的get方法也可以使用@Value注释计算新值。

1.2.1、比如说我们要返回username和address的属性拼好的地址投影接口如下：

```java
/**
 * username和全地址拼接投影
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
public interface AdminUsernameAndFullAddress {
    String getUsername();
    @Value("#{target.address.province + ' ' + target.address.city + ' ' + target.address.county + ' ' + target.address.detailedAddress}")
    String getFullAddress();
}
```

修改Repository方法返回值，测试，返回AdminUsernameAndFullAddress打印的SQL语句如下：

```java
Hibernate: select admin0_.id as id1_0_, admin0_.city as city2_0_, admin0_.county as county3_0_, admin0_.detailed_address as detailed4_0_, admin0_.province as province5_0_, admin0_.zip_code as zip_code6_0_, admin0_.create_time as create_t7_0_, admin0_.password as password8_0_, admin0_.phone as phone9_0_, admin0_.role_id as role_id11_0_, admin0_.username as usernam10_0_ from cfq_jpa_admin admin0_ where admin0_.create_time=?
```

我们发现SQL语句并没有优化，那是因为target变量中提供了支持投影的实体。使用@Value的投影接口是一个开放的投影。在这种情况下，Spring-Data不能进行查询优化，因为spel表达式可以使用实体的任何属性。

1.2.2、@Value中使用的表达式不要太复杂，要避免字符串变量编程。对于非常简单的表达式，可以选择使用java8中引入的接口默认方法。

```java
/**
 * 使用默认接口方法返回全地址拼接路径投影
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
public interface AdminUsernameAndFullAddressWithJava8 {
    String getUsername();
    /**
     * 要提供address的get方法供使用。
     */
    Address getAddress();
    default String getFullAddress() {
        return getAddress().getProvince().concat(" ").concat(getAddress().getCity()).concat(" ").concat(getAddress().getCounty())
                .concat(" ").concat(getAddress().getDetailedAddress());
    }
}
```

修改Repository方法返回值，测试返回AdminUsernameAndFullAddressWithJava8打印的SQL语句：进行了部分优化，没有把admin中全部的属性都查

```java
Hibernate: select admin0_.username as col_0_0_, admin0_.city as col_1_0_, admin0_.county as col_1_1_, admin0_.detailed_address as col_1_2_, admin0_.province as col_1_3_, admin0_.zip_code as col_1_4_ from cfq_jpa_admin admin0_ where admin0_.create_time=?
```

1.2.3、但是java8方式要求能够完全基于投影接口上公开的其他get方法来实现逻辑。更灵活的方法是选择在Spring Bean中实现自定义逻辑，然后从spel表达式中调用该自定义逻辑。

```java
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@Component
public class MyAdminBean {
    public String getFullAddress(Admin admin) {
        Address address = admin.getAddress();
        return address.getProvince().concat(" ").concat(address.getCity()).concat(" ").concat(address.getCounty())
                .concat(" ").concat(address.getDetailedAddress());
    }
}
/**
 * 使用spring bean的方式的投影
 */
public interface AdminUsernameAndFullAddressWithSpringBean {
    String getUsername();
    @Value("#{@myAdminBean.getFullAddress(target)}")
    String getFullAddress();
}
```

修改Repository方法返回值，测试返回AdminUsernameAndFullAddressWithSpringBean打印的SQL语句：因为使用了target，所以没有进行优化。

```java
Hibernate: select admin0_.id as id1_0_, admin0_.city as city2_0_, admin0_.county as county3_0_, admin0_.detailed_address as detailed4_0_, admin0_.province as province5_0_, admin0_.zip_code as zip_code6_0_, admin0_.create_time as create_t7_0_, admin0_.password as password8_0_, admin0_.phone as phone9_0_, admin0_.role_id as role_id11_0_, admin0_.username as usernam10_0_ from cfq_jpa_admin admin0_ where admin0_.create_time=?
```

spel也可以使用方法中的参数值。方法参数可通过名为args的Object数组中获得。

```java
/**
 * spel使用方法中的参数值投影
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
public interface PrefixUsername {
    String getUsername();
    @Value("#{args[0] + '' + target.username + '!'}")
    String getPrefixUsername(String prefix);
}
```

### 2、基于类的投影DTO

定义投影的另一种方是使用值类型DTO（数据传输对象），该DTO持有需要检索的属性。DTO投影的使用方式与接口投影完全相同，只是不会发生代理，也不能用嵌套投影。要加载的字段由公开的构造方法的参数名确定。使用lombok的@Value注解来简化DTO编写。

比如说只想返回用户名使用DTO的方式的投影，如下：

```java
import lombok.Value;
/**
 * 使用DTO的方式返回用户名，需要构造函数，我们使用lombok的@Value方法来简化代码
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@Value
public class UsernameDTO {
    private String username;
}
```

修改Repository方法返回值，测试返回UsernameDTO打印的SQL：也进行了优化

```java
Hibernate: select admin0_.username as col_0_0_ from cfq_jpa_admin admin0_ where admin0_.create_time=?
```

### 3、动态投影

到目前为止，我们使用的投影类型作为集合的返回类型或元素类型。如果我们想要在调用时才确定投影的类型呢，这也是可以的。

Repository方法改造为如下：

```java
/**
 *  动态返回投影，type可以是实体，接口投影，DTO投影
 */
<T> List<T> findByCreateTime(LocalDate createTime, Class<T> type);
```

调用时，动态确定返回投影：

```java
@Test
void findByCreateTime2(){
    //返回实体Admin
    List<Admin> list1 = adminRepository.findByCreateTime(LocalDate.of(2019, 11, 11), Admin.class);
    list1.forEach( System.out::println);
    System.out.println("===================");
    //返回接口投影
    List<UsernameOnly> list2 = adminRepository.findByCreateTime(LocalDate.of(2019, 11, 11), UsernameOnly.class);
    list2.forEach(u -> System.out.println(u.getUsername()));
    System.out.println("===================");
    //返回DTO投影
    List<UsernameDTO> list3 = adminRepository.findByCreateTime(LocalDate.of(2019, 11, 21), UsernameDTO.class);
    list3.forEach(u -> System.out.println(u.getUsername()));
}
```

### 4、投影支持分页排序，和返回Optional等。

```java
/**
 * 支持分页
 * @param createTime
 * @param type
 * @param pageable
 * @param <T>
 * @return
 */
<T> Page<T> findByCreateTime(LocalDate createTime, Class<T> type, Pageable pageable);
@Test
void findByCreateTimeWithPage(){
    Page<AdminUsernameAndAddressDTO> page = adminRepository.findByCreateTime(LocalDate.of(2019, 11, 21), AdminUsernameAndAddressDTO.class, PageRequest.of(1, 2, Sort.Direction.DESC,"username"));
    System.out.println(page.getTotalElements());
    System.out.println(page.getTotalPages());
    System.out.println(page.getNumberOfElements());
    System.out.println(page.getContent());
}
```

### 5、投影与@Query的使用

有时，我们需要多表关联，使用一些分组函数进行求职计算等，我们要使用投影来接收返回值，提高我们代码的可读性，而不是使用Objec[],Map等去接收。

5.1、举个例子，我们想知道每个角色名称对应的管理员数量和平均年龄，我们创建接口投影如下：

```java
/**
 * 角色名称，admin个数count ,admin平均年龄 投影
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
public interface RoleNameAndAdminCountAndAgeAvg {
    String getRoleName();
    Long getAdminCount();
    Double getAgeAvg();
}
```

可以使用JPQL或原生SQL进行查询：

```java
/**
 * JPQL 使用投影
 */
@Query(value = "select r.roleName as roleName,count(a) as adminCount , avg(a.age) as ageAvg from  Role r inner join Admin a on r = a.role group by r.roleName ")
List<RoleNameAndAdminCountAndAgeAvg> findRoleNameAndAdminCountAndAgeAvgWithJPQL();
/**
 * 原生SQL 使用投影
 */
@Query(value = "SELECT r.role_name AS roleName,COUNT(*) AS adminCount,AVG(a.age) AS ageAvg FROM cfq_jpa_role r INNER JOIN cfq_jpa_admin a ON r.id = a.role_id GROUP BY r.role_name ", nativeQuery = true)
List<RoleNameAndAdminCountAndAgeAvg> findRoleNameAndAdminCountAndAgeAvgWithSQL();
```

测试接口投影接收JPQL返回值：

```java
@Test
void findRoleNameAndAdminCountAndAgeAvgWithJPQL(){
    List<RoleNameAndAdminCountAndAgeAvg> roleNameAndAdminCountAndAgeAvgWithJPQL = roleRepository.findRoleNameAndAdminCountAndAgeAvgWithJPQL();
    roleNameAndAdminCountAndAgeAvgWithJPQL.forEach(r -> System.out.println(r.getRoleName() + " : " + r.getAdminCount() + " : " + r.getAgeAvg()));
}
```

JPQL控制台打印如下：

```java
Hibernate: select role0_.role_name as col_0_0_, count(admin1_.id) as col_1_0_, avg(admin1_.age) as col_2_0_ from cfq_jpa_role role0_ inner join cfq_jpa_admin admin1_ on (role0_.id=admin1_.role_id) group by role0_.role_name
普通管理员 : 3 : 26.0
超级管理员 : 2 : 23.5
```

测试接口投影接收SQL返回值：

```java
@Test
void findRoleNameAndAdminCountAndAgeAvgWithSQL(){
    List<RoleNameAndAdminCountAndAgeAvg> roleNameAndAdminCountAndAgeAvgWithSQL = roleRepository.findRoleNameAndAdminCountAndAgeAvgWithSQL();
    roleNameAndAdminCountAndAgeAvgWithSQL.forEach(r -> System.out.println(r.getRoleName() + " : " + r.getAdminCount() + " : " + r.getAgeAvg()));
}
```

SQL控制台打印如下：

```java
Hibernate: SELECT r.role_name AS roleName,COUNT(*) AS adminCount,AVG(a.age) AS ageAvg FROM cfq_jpa_role r INNER JOIN cfq_jpa_admin a ON r.id = a.role_id GROUP BY r.role_name 
普通管理员 : 3 : 26.0
超级管理员 : 2 : 23.5
```

5.2、使用DTO投影来进行接收时，要使用如下方式：

```java
import lombok.Value;
/**
 * 角色名称，对应的管理管个数，管理员平均年龄
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 */
@Value
public class RoleNameAndAdminCountAndAgeAvgDTO {
    private String roleName;
    private Long adminCount;
    private Double ageAvg;
}
```

Repository方法：

```java
/**
 * 使用DTO投影接收JPQL查询结果,如果不是实体本身的属性，要使用如下方式
 */
@Query(value = "select new cn.caofanqi.study.studyspringdatajpa.pojo.domain.projections.RoleNameAndAdminCountAndAgeAvgDTO(r.roleName ,count(a), avg(a.age)) from  Role r inner join Admin a on r = a.role group by r.roleName")
List<RoleNameAndAdminCountAndAgeAvgDTO> findRoleNameAndAdminCountAndAgeAvgWithDTO();
```

测试用例：

```java
@Test
void findRoleNameAndAdminCountAndAgeAvgWithDTO(){
    List<RoleNameAndAdminCountAndAgeAvgDTO> roleNameAndAdminCountAndAgeAvgWithDTO = roleRepository.findRoleNameAndAdminCountAndAgeAvgWithDTO();
    roleNameAndAdminCountAndAgeAvgWithDTO.forEach(r -> System.out.println(r.getRoleName() + " : " + r.getAdminCount() + " : " + r.getAgeAvg()));
}
```

控制台打印：

```java
Hibernate: select role0_.role_name as col_0_0_, count(admin1_.id) as col_1_0_, avg(admin1_.age) as col_2_0_ from cfq_jpa_role role0_ inner join cfq_jpa_admin admin1_ on (role0_.id=admin1_.role_id) group by role0_.role_name
普通管理员 : 3 : 26.0
超级管理员 : 2 : 23.5
```

DTO投影接收原生SQL返回就比较麻烦了，如下：

实体类中添加如下：

```java
@NamedNativeQueries({
@NamedNativeQuery(name = "Role.findRoleNameAndAdminCountAndAgeAvgDTOWithSQL",
        query = "SELECT r.role_name AS roleName,COUNT(*) AS adminCount,AVG(a.age) AS ageAvg FROM cfq_jpa_role r INNER JOIN cfq_jpa_admin a ON r.id = a.role_id GROUP BY r.role_name",
        resultSetMapping = "roleNameAndAdminCountAndAgeAvgDTO")})
@SqlResultSetMapping(
name = "roleNameAndAdminCountAndAgeAvgDTO",
classes = @ConstructorResult(targetClass = RoleNameAndAdminCountAndAgeAvgDTO.class,
        columns = {
                @ColumnResult(name = "roleName", type = String.class),
                @ColumnResult(name = "adminCount", type = Long.class),
                @ColumnResult(name = "ageAvg", type = Double.class)
        }))
```

Repository接口方法如下：

```java
/**
 * 原生SQL 使用DTO投影，需要@NamedNativeQuery、@SqlResultSetMapping、@Query(nativeQuery = true)注解一起使用
 */
@Query(nativeQuery = true)
List<RoleNameAndAdminCountAndAgeAvgDTO> findRoleNameAndAdminCountAndAgeAvgDTOWithSQL();
```

测试及控制台打印

```java
@Test
void findRoleNameAndAdminCountAndAgeAvgDTOWithSQL(){
    List<RoleNameAndAdminCountAndAgeAvgDTO> roleNameAndAdminCountAndAgeAvgDTOWithSQL = roleRepository.findRoleNameAndAdminCountAndAgeAvgDTOWithSQL();
    roleNameAndAdminCountAndAgeAvgDTOWithSQL.forEach(r -> System.out.println(r.getRoleName() + " : " + r.getAdminCount() + " : " + r.getAgeAvg()));
}
```

```java
Hibernate: SELECT r.role_name AS roleName,COUNT(*) AS adminCount,AVG(a.age) AS ageAvg FROM cfq_jpa_role r INNER JOIN cfq_jpa_admin a ON r.id = a.role_id GROUP BY r.role_name
普通管理员 : 3 : 26.0
超级管理员 : 2 : 23.5
```

源码地址：https://github.com/caofanqi/study-spring-data-jpa

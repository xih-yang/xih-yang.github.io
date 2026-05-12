# 08、分布式事务 实战 - TCC 事务模式（多模式混合使用）
- 来源：https://ddkk.com/zhuanlan/transaction/4/8.html
- 分类：分布式事务
- 分组：教程目录
- 在上面 LCN 事务模式代码基础上进行修改

### 1.新建项目 mongodb_insert

#### 1.1 修改 pom.xml

- 在当前项目中引入 mongodb 的依赖。如果在父项目中进行引入，则所有的子项目都需要配置 mongodb 的相关属性

```java
<dependencies> 
	<dependency> 
		<groupId>org.springframework.boot</groupId> 
		<artifactId>spring-boot-starter-data-mongodb</artifactId> 
		<version>2.2.6.RELEASE</version> 
	</dependency> 
</dependencies>
```

#### 1.2 新建配置文件

- 新建 application.yml。
- 虽然当前项目是连接 Mongodb 但是也需要配置 MySQL 数据源，因为 LCN 需要在 MySQL 中记录异常信息等
- 配置文件中比别的项目多了 MongoDB 的配置

```java
spring: 
	datasource:
		url: jdbc:mysql://localhost:3306/microservice
		driver-class-name: com.mysql.jdbc.Driver
		username: root
		password: root
	application:
		name: mongodb-insert
	data:
		mongodb:
			authentication-database: admin
			username: dqcgm
			password: dqcgmpwd
			database: lcn
			host: 192.168.8.139
			port: 27017
server:
	port: 8082
eureka: 
	client: 
		service-url: 
			defaultZone: http://localhost:8761/eureka/
tx-lcn: 
	client: 
		manager-address: 127.0.0.1:8070
```

#### 1.3 新建实体类

- 新建 com.dqcgm.pojo.People

```java
@Data 
public class People {
	private String id; 
	private String name; 
}
```

#### 1.4 新建 service 及实现类

- 新建 com.dqcgm.service.PeopleService 及实现类
- 具有@TccTransaction 注解的方法有以下特性

**1、** 可以没有@Transactional；

**2、** 如果整个分布式事务所有方法执行都没有异常，会回调名称为：confirm+方法名首字母大写的方法insert方法的回调方法叫做confirmInsert()同时方法参数也可以传递给回调方法；

**3、** 只要整个分布式事务中有一个方法出现异常，会回调cancel+方法名首字母大写的回调方法需要在这个方法中编写事务回滚的业务；
- @TccTransaction 注解属性说明：

cancelMethod：明确指定失败的回调方法名

confirmMethod：明确指定成功的回调方法名

```java
public interface PeopleService {
	int insert(People people); 
}
```

```java
@Service 
public class PeopleServiceImpl implements PeopleService {
	@Autowired 
	private MongoTemplate mongoTemplate;
	@Override 
	@TccTransaction
	public int insert(People people) {
		People result = mongoTemplate.insert(people);
		if(result!=null){
			return 1;
		}
		return 0;
	}
	public void cancelInsert(People people){
		System.out.println("执行了 cancel 方法"+people); 
		mongoTemplate.remove(people); 
		System.out.println("所谓的事务回滚就是删除新增的数据"); 
	}
	public void confirmInsert(People people){
		System.out.println("执行了 confirm 方法"+people); 
	}
}
```

#### 1.5 新建控制器

- 新建 com.dqcgm.controller.PeopleController

```java
@Controller
public class PeopleController {
	@Autowired 
	private PeopleService peopleService; 
	@RequestMapping("/insert") 
	@ResponseBody
	public int insert(People people){
		return peopleService.insert(people); 
	} 
}
```

#### 1.6 测试

- 在浏览器输入 http://localhost:8082/insert?name=dqcgm观察 mongodb 中是否出现了 lcn 的 数据库，数据库中是否出现 People 的集合，people 集合中 name 属性值为 dqcgm

### 2.修改 student_insert

#### 2.1 新建 feign 接口

- 新建 com.dqcgm.feign.MongodbInsertFeign。
- 为了传递普通表单数据，insert 方法参数由@RequestParam。mongodb_insert 控制器方法参数就可以使用 String name 或 People 进行接收

```java
@FeignClient("mongodb-insert") 
public interface MongodbInsertFeign {
	@RequestMapping("/insert") 
	int insert(@RequestParam String name); 
}
```

#### 2.2 修改 service 实现类

- 修改 com.dqcgm.service.impl.StudentServiceImpl。
- 在实现类中调用 feign 接口的方法
- 当前方法依然使用 LCN 事务模式。方法上面加什么事务模式注解只考虑当前方法本地事务，不考虑调用远程方法的事务。如果当前方法中没有本地事务，全是调用远程方法，那么当前方法使用 LCN 或 TCC 事务模式都可以，但是必须要有事务模式，因为如果没有注解就不会想 TxManager 中创建事务组。

```java
@Service 
public class StudentServiceImpl implements StudentService {
	@Autowired 
	private StudentMapper studentMapper; 
	@Autowired 
	private TeacherInsertFeign teacherInsertFeign;
	@Autowired 
	private MongodbInsertFeign mongodbInsertFeign; 
	@Override 
	@LcnTransaction 
	@Transactional 
	public int insert(Student student) {
		Teacher teacher = new Teacher();
		Random random = new Random();
		teacher.setId((long)random.nextInt(10000));
		teacher.setName("随意的名称");
		student.setTid(teacher.getId());
		student.setId((long)random.nextInt(10000));
		teacherInsertFeign.insert(teacher);
		mongodbInsertFeign.insert("随意的名称");
		return studentMapper.insert(student);
	}
}
```

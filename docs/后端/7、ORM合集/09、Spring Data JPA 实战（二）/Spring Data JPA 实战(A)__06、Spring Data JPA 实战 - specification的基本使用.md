# 06、Spring Data JPA 实战 - specification的基本使用
- 来源：https://ddkk.com/zhuanlan/orm/springdatajpa/6/6.html
- 分类：ORM框架
- 分组：Spring Data JPA 实战(A)
## specification的使用

Specification是一个函数式接口，需要实现toPredicate(Root root, CriteriaQuery query, CriteriaBuilder criteriaBuilder)方法

- root：查询的根对象（查询的任何属性都可以从根对象中获取）
- CriteriaQuery：顶层查询对象，自定义查询方式（了解：一般不用）
- CriteriaBuilder：查询的构造器，封装了很多的查询条件

## 单参数查询

```java
@Test
public void testSpecificationOneParam(){
    Specification<Customer> specification=(root,query,cb)->{
        //获取比较属性
        Path<Object> custName = root.get("custName");
        //构建查询条件
        Predicate predicate = cb.equal(custName, "飞飞飞");
        return predicate;
    };
    List<Customer> customers = this.customerRepository.findAll(specification);
    customers.forEach((customer -> System.out.println(customer)));
}
```

## 多参数查询

```java
@Test
public void testSpecificationMoreParam(){
    Specification<Customer> specification=(root, query, criteriaBuilder) -> {
        //获取比较属性
        Path<Object> custName = root.get("custName");
        Path<Object> custIndustry = root.get("custIndustry");
        //构造条件查询
        Predicate preName = criteriaBuilder.equal(custName, "飞飞飞");
        Predicate preIndy = criteriaBuilder.equal(custIndustry, "娱乐");
        //与相连
        Predicate predicate = criteriaBuilder.and(preName, preIndy);
        return predicate;
    };
    List<Customer> customers = this.customerRepository.findAll(specification);
    customers.forEach((customer)-> System.out.println(customer));
}
```

## 模糊查询

```java
@Test
public void testSpecificationLike(){
    Specification<Customer> specification=(root, query, criteriaBuilder) -> {
        //获取比较属性
        Path<Object> custName = root.get("custName");
        //构建查询条件
        Predicate predicate = criteriaBuilder.like(custName.as(String.class), "%飞__");
        return predicate;
    };
    List<Customer> customers = this.customerRepository.findAll(specification);
    customers.forEach(customer -> System.out.println(customer));
}
```

## 分页查询

```java
@Test
public void testSpecificationPage(){
    //每页数目
    int row=5;
    //当前页
    int page=0;
    //添加查询条件
    Specification<Customer> specification=(root, query, criteriaBuilder) -> {
        //获取比较属性
        Path<Object> custName = root.get("custName");
        //构建查询条件
        Predicate predicate = criteriaBuilder.like(custName.as(String.class), "%飞__");
        return predicate;
    };
    //排序
    //        Sort sort=Sort.by(Sort.Direction.ASC,"custId");
    //分页条件
    Pageable pageable=PageRequest.of(page,row,Sort.Direction.ASC,"custId");
    //分页查询
    Page<Customer> cpage = this.customerRepository.findAll(pageable);
    //获取数据集合
    List<Customer> customers = cpage.getContent();
    //获取总页数
    int totalPages = cpage.getTotalPages();
    //获取总条数
    long totalElements = cpage.getTotalElements();
    System.out.println("数据总页数:"+totalPages);
    System.out.println("数据总条数:"+totalElements);
    customers.forEach(customer -> System.out.println(customer));
}
```

**输出**

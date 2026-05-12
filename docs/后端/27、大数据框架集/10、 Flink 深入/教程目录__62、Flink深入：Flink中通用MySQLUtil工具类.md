# 62、Flink深入：Flink中通用MySQLUtil工具类
- 来源：https://ddkk.com/zhuanlan/bigdata/flink/4/62.html
- 分类：大数据框架
- 分组：教程目录
## 1. 开发目的

在使用SpringBoot后端开发中，我们如果需要对MySQL进行增删查改，可以很方便的使用Mybatis进行操作。但是在大数据中，如果想要对MySQL进行操作，就没有那么方便，特别当flink新一代流式计算框架兴起后，在老版本中没有读取和写入MySQL的连接源，虽然在后续新版本中有以及社区开发的其他补充项目中有source源和sink源了（比如flink-cdc和写入MySQL的sink方法），但当中间需要读取维度数据时，还是不方便。此时一个较为方便的工具类就能很方便的使用，能达到节省开发时间、减小开发难度等目的。

## 2. 导入依赖

以MySQL8.x版本为例

```java
        <!--MySQL驱动包 mysql8版本-->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
        </dependency>
        <!-- 日志打印的jar包 -->
        <dependency>
            <groupId>log4j</groupId>
            <artifactId>log4j</artifactId>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-log4j12</artifactId>
            <scope>provided</scope>
        </dependency>
        <!-- json解析包，fastjson包 -->
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>fastjson</artifactId>
        </dependency>
        <!--commons-beanutils 是 Apache 开源组织提供的用于操作 JAVA BEAN 的工具包。使用 commons-beanutils，我们可以很方便的对 bean 对象的属性进行操作-->
        <dependency>
            <groupId>commons-beanutils</groupId>
            <artifactId>commons-beanutils</artifactId>
            <scope>provided</scope>
        </dependency>
        <!--Guava 工程包含了若干被 Google 的 Java 项目广泛依赖的核心库,方便开发-->
        <dependency>
            <groupId>com.google.guava</groupId>
            <artifactId>guava</artifactId>
            <scope>provided</scope>
        </dependency>
        <!-- 数据库连接池和jdbc操作模板 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-jdbc</artifactId>
            <version>${springboot.version}</version>
        </dependency>
        <dependency>
            <groupId>com.zaxxer</groupId>
            <artifactId>HikariCP</artifactId>
            <version>2.6.1</version>
        </dependency>
```

对应版本号：

```java
<properties>
    <maven.compiler.source>8</maven.compiler.source>
    <maven.compiler.target>8</maven.compiler.target>
    <scala.binary.version>2.11</scala.binary.version>
    <scala.version>2.11.8</scala.version>
    <flink.binary.version>1.10</flink.binary.version>
    <flink.version>1.10.0</flink.version>
    <alink.version>1.4.0</alink.version>
    <log4j.version>1.2.17</log4j.version>
    <slf4j.version>1.7.21</slf4j.version>
    <mysql.version>8.0.21</mysql.version>
    <fastjson.version>1.2.75</fastjson.version>
    <huaweicloud.dws.jdbc.version>8.1.0</huaweicloud.dws.jdbc.version>
    <commons.beanutils.version>1.9.4</commons.beanutils.version>
    <guava.version>29.0-jre</guava.version>
    <okhttp.version>3.6.0</okhttp.version>
    <springboot.version>2.0.2.RELEASE</springboot.version>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <avro.version>1.10.0</avro.version>
</properties>
```

## 3. 代码

注意：下述代码中使用了自定义的ModelUtil工具类，该工具类的具体介绍可以参考博主的另一篇博文：[Flink（60）：Flink中通用ModelUtil工具类](/zhuanlan/bigdata/flink/4/60.html)

## 3.1. 方法说明

构造方法：

```java
MySQLUtil(String url, String username, String password, int maxConnect, int minConnect) ：根据传入的MySQL各项信息和连接池连接的数量来构建连接池
```

```java
MySQLUtil(String url, String username, String password) ：根据传入的MySQL各项信息，使用默认的连接池配置（最大连接2个，最小连接1个）
```

初始化JdbcTemplate：

```java
 initJdbcTemplate(String url, String username, String password, int maxConnect, int minConnect) ：在构造方法中调用，使用HikariPool连接池初始化JdbcTemplate，并赋值给成员变量，后续使用
```

处理特殊字符：

```java
disposeSpecialCharacter(Object object) ：对传入的数据中的特殊字符进行处理，比如当我们拼接SQL时，使用的是单引号拼接，但当数据中有单引号就会报错，可以对这些特殊字符进行处理
```

查询方法：

```java
List<T> queryList(String sql, Class<T> clz, boolean underScoreToCamel) ：通过输入的SQL语句查询MySQL表中的数据，并将数据转换成传入的clz对应的对象
```

插入方法：

```java
insert(String tableName, boolean underScoreToCamel, Object object) ： 通过输入的表名，以及是否对字段名进行下划线驼峰命名转换，将传入的数据（object对象，可以是bean对象，也可以是JSONObject对象）插入到对应的表中
```

删除方法：

```java
delete(String tableName, Map<String, Object> fieldNameAndValue) ： 通过传入的表名以及删除的条件（Map集合），删除对应表中对应的数据
```

```java
delete(String tableName, boolean underScoreToCamel, Object object, String... fields) ： 通过传入的表名，以及是否对字段名进行下划线驼峰命名转换，并使用传入对象中给定的字段进行匹配，删除匹配到的数据
```

更新方法：

```java
update(String tableName, boolean underScoreToCamel, Object object, Map<String, Object> fieldNameAndValue) ：通过传入的表名，以及是否对字段名进行下划线驼峰命名转换，将对应的object对象中的数据更新到表中，使用传入Map集合作为匹配条件
```

```java
update(String tableName, boolean underScoreToCamel, Object object, String... fields) ： 通过传入的表名，以及是否对字段名进行下划线驼峰命名转换，将对应的object对象中的数据更新到表中，使用传入的字段集合作为更新条件
```

upsert方法：

```java
upsertByPrimaryKey(String tableName, boolean underScoreToCamel, Object object, Map<String, Object> fieldNameAndValue) ： 根据主键使用ON DUPLICATE KEY UPDATE语法对对应的表中的数据进行更新，也可以对传入的数据中的字段是否下划线驼峰命名转换，并将传入的Map集合作为update条件
```

```java
upsertByPrimaryKey(String tableName, boolean underScoreToCamel, Object object, String... fields) ： 根据主键使用ON DUPLICATE KEY UPDATE语法对对应的表中的数据进行更新，也可以对传入的数据中的字段是否下划线驼峰命名转换，并将传入的字段集合作为update条件（字段集合必须在object中有数据）
```

```java
upsert(String tableName, boolean underScoreToCamel, Object object, String... fields) ：先使用上述update方法，如果返回变更的条数等于0，就执行上述的insert方法，如果大于0就不执行
```

```java
upsert(String tableName, boolean underScoreToCamel, Object object, Map<String, Object> fieldNameAndValue) ： 先使用上述update方法，如果返回变更的条数等于0，就执行上述的insert方法，如果大于0就不执行
```

## 3.2. 具体实现

```java
package com.yishou.bigdata.common.utils;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.google.common.base.CaseFormat;
import com.google.common.collect.Lists;
import com.zaxxer.hikari.HikariDataSource;
import org.apache.commons.beanutils.BeanUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.*;
/**
 * @date: 2022/5/17
 *  @Author ddkk.com  弟弟快看，程序员编程资料站
 * @desc: MySQLUtil
 */
public class MySQLUtil {
    static Logger logger = LoggerFactory.getLogger(MySQLUtil.class);
    /**
     * jdbcTemplate
     */
    private JdbcTemplate jdbcTemplate;
    /**
     * 通过传入的参数创建MySQLUtil对象
     *
     * @param url        mysql的url
     * @param username   mysql的username
     * @param password   mysql的password
     * @param maxConnect 连接池中最大连接数
     * @param minConnect 连接池中最小连接数
     */
    public MySQLUtil(String url, String username, String password, int maxConnect, int minConnect) {
        initJdbcTemplate(url, username, password, maxConnect, minConnect);
    }
    /**
     * 通过传入的参数创建MySQLUtil对象
     *
     * @param url      mysql的url
     * @param username mysql的username
     * @param password mysql的password
     */
    public MySQLUtil(String url, String username, String password) {
        initJdbcTemplate(url, username, password, 2, 1);
    }
    /**
     * 初始化MySQL的jdbcTemplate
     *
     * @param url        mysql的url
     * @param username   mysql的username
     * @param password   mysql的password
     * @param maxConnect 连接池中最大连接数
     * @param minConnect 连接池中最小连接数
     */
    public void initJdbcTemplate(String url, String username, String password, int maxConnect, int minConnect) {
        try {
            HikariDataSource ds = new HikariDataSource();
            Thread.sleep(1000);
            ds.setDriverClassName("com.mysql.cj.jdbc.Driver");
            ds.setJdbcUrl(url);
            ds.setUsername(username);
            ds.setPassword(password);
            ds.setMaximumPoolSize(maxConnect);
            ds.setMinimumIdle(minConnect);
            jdbcTemplate = new JdbcTemplate(ds);
            logger.info(
                    "使用HikariPool连接池初始化JdbcTemplate成功，使用的URL为：{} , 其中最大连接大小为：{} , 最小连接大小为：{} ;",
                    ds.getJdbcUrl(),
                    ds.getMaximumPoolSize(),
                    ds.getMinimumIdle()
            );
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("创建MySQL数据库的jdbcTemplate失败，抛出的异常信息为：" + e.getMessage());
        }
    }
    /**
     * 获取对应的 JdbcTemplate
     *
     * @return JdbcTemplate
     */
    public JdbcTemplate getJdbcTemplate() {
        return jdbcTemplate;
    }
    /**
     * 处理传入数据中的特殊字符（例如： 单引号），并将其中数据为空的过滤
     *
     * @param object 传入的数据对象
     * @return 返回的结果
     */
    public String disposeSpecialCharacter(Object object) {
        // 根据传入的情况，将数据转换成json格式（如果传入为string，那就本来是json格式，不需要转）
        String data;
        if (object instanceof String) {
            data = object.toString();
        } else {
            data = JSON.parseObject(JSON.toJSONString(object)).toString();
        }
        // 处理传入数据中的特殊字符（例如： 单引号）
        data = data.replace("'", "''");
        // 将其中为空值的去掉（注意：如果不能转换成json并从中获取数据的，就是从delete中传过来的，只有单纯的value值）
        try {
            JSONObject result = new JSONObject();
            for (Map.Entry<String, Object> entry : JSON.parseObject(data).entrySet()) {
                if (StringUtils.isNotEmpty(entry.getValue().toString())) {
                    result.put(entry.getKey(), entry.getValue());
                }
            }
            data = result.toJSONString();
        } catch (Exception exception) {
            exception.printStackTrace();
            logger.warn("传入的数据为：{}；该数据是从delete中传入的，不能转换成json值", object);
        }
        // 返回数据
        return data;
    }
    /**
     * 如果传入的clz中的属性又包含对象，会报错，此时传入JSONObject对象即可
     *
     * @param sql               执行的查询语句
     * @param clz               返回的数据类型
     * @param underScoreToCamel 是否将下划线转换为驼峰命名法
     * @param <T  样例类
     * @return 样例类集合
     */
    public <T> List<T> queryList(String sql, Class<T> clz, boolean underScoreToCamel) {
        try {
            List<Map<String, Object>> mapList = jdbcTemplate.queryForList(sql);
            List<T> resultList = new ArrayList<>();
            for (Map<String, Object> map : mapList) {
                Set<String> keys = map.keySet();
                // 当返回的结果中存在数据，通过反射将数据封装成样例类对象
                T result = clz.newInstance();
                for (String key : keys) {
                    String propertyName = underScoreToCamel ? CaseFormat.LOWER_UNDERSCORE.to(CaseFormat.LOWER_CAMEL, key) : key;
                    BeanUtils.setProperty(
                            result,
                            propertyName,
                            map.get(key)
                    );
                }
                resultList.add(result);
            }
            return resultList;
        } catch (Exception exception) {
            exception.printStackTrace();
            throw new RuntimeException(
                    "\r\n从MySQL数据库中 查询 数据失败，" +
                            "\r\n抛出的异常信息为：" + exception.getMessage() +
                            "\r\n查询的SQL为：" + sql
            );
        }
    }
    /**
     * 将传入的数据插入到对应的MySQL的表中
     *
     * @param tableName         表名
     * @param underScoreToCamel 是否将驼峰转换为下划线
     * @param object            数据对象
     *                          INSERT INTO customer_t1 (c_customer_sk, c_first_name) VALUES (3769, 'Grace');
     */
    public void insert(String tableName, boolean underScoreToCamel, Object object) {
        // 将传入的对象转换成JSONObject格式（并将其中的特殊字符进行替换）
        JSONObject data = JSON.parseObject(disposeSpecialCharacter(object));
        // 从传入的数据中获取出对应的key和value，因为要一一对应，所以使用list
        ArrayList<String> fieldList = Lists.newArrayList(data.keySet());
        ArrayList<String> valueList = new ArrayList<>();
        for (String field : fieldList) {
            valueList.add(data.getString(field));
        }
        // 拼接SQL
        StringBuilder sql = new StringBuilder();
        sql.append(" INSERT INTO ").append(tableName);
        sql.append(" ( ");
        for (String field : fieldList) {
            if (underScoreToCamel) {
                sql.append(CaseFormat.LOWER_CAMEL.to(CaseFormat.LOWER_UNDERSCORE, field)).append(",");
            } else {
                sql.append(field).append(",");
            }
        }
        sql.deleteCharAt(sql.length() - 1);
        sql.append(" ) ");
        sql.append(" values ('").append(StringUtils.join(valueList, "','")).append("')");
        // 执行插入操作
        try {
            jdbcTemplate.execute(sql.toString());
        } catch (Exception exception) {
            exception.printStackTrace();
            throw new RuntimeException(
                    "\r\n向MySQL数据库中 插入 数据失败，" +
                            "\r\n抛出的异常信息为：" + exception.getMessage() +
                            "\r\n执行的SQL为：" + sql
            );
        }
    }
    /**
     * 根据主键删除对应数据
     * 注意：传入的字段名要和数据库中一一匹配，即数据库中有下划线，那传入的字段名也要有下划线
     *
     * @param tableName         表名
     * @param fieldNameAndValue 更新时匹配的字段（key）和值（value）（注意：传入的字段名要和数据库中一一匹配，即数据库中有下划线，那传入的字段名也要有下划线）
     * @return 删除时影响的条数
     */
    public int delete(String tableName, Map<String, Object> fieldNameAndValue) {
        // 拼接SQL
        StringBuilder sql = new StringBuilder();
        sql.append(" delete from ").append(tableName);
        if (fieldNameAndValue.size() > 0) {
            sql.append(" WHERE ");
            for (Map.Entry<String, Object> fieldNameAndValueEntry : fieldNameAndValue.entrySet()) {
                sql
                        .append(fieldNameAndValueEntry.getKey())
                        .append(" = ")
                        .append("'")
                        .append(disposeSpecialCharacter(fieldNameAndValueEntry.getValue()))
                        .append("'")
                        .append(" AND ");
            }
            sql.delete(sql.length() - 4, sql.length() - 1);
        } else {
            throw new RuntimeException("从MySQL中删除数据异常，输入的删除条件没有指定字段名和对应的值，会进行全表删除， 拼接的SQL为：" + sql);
        }
        // 执行删除操作
        try {
            return jdbcTemplate.update(sql.toString());
        } catch (Exception exception) {
            exception.printStackTrace();
            throw new RuntimeException(
                    "\r\n向MySQL数据库中 删除 数据失败，" +
                            "\r\n抛出的异常信息为：" + exception.getMessage() +
                            "\r\n执行的SQL为：" + sql
            );
        }
    }
    /**
     * 根据传入的表名、数据、字段名，删除表中对应的数据
     *
     * @param tableName         表名
     * @param underScoreToCamel 是否将驼峰转换为下划线
     * @param object            数据对象
     * @param fields            更新时匹配的字段名
     */
    public int delete(String tableName, boolean underScoreToCamel, Object object, String... fields) {
        // 将传入的对象转换成JSONObject格式
        JSONObject data = JSON.parseObject(disposeSpecialCharacter(object));
        // 根据传入的字段，获取要更新的主键值
        HashMap<String, Object> fieldNameAndValue = new HashMap<>();
        for (String field : fields) {
            if (underScoreToCamel) {
                // data中的均为驼峰，获取数据时需要使用驼峰；但是将数据写入到fieldNameAndValue中时，需要全部转换成下划线
                fieldNameAndValue.put(
                        field.contains("_") ? field : CaseFormat.LOWER_CAMEL.to(CaseFormat.LOWER_UNDERSCORE, field),
                        data.getString(field.contains("_") ? CaseFormat.LOWER_UNDERSCORE.to(CaseFormat.LOWER_CAMEL, field) : field)
                );
            } else {
                // data中均为下划线，field中也是下划线
                fieldNameAndValue.put(field, data.getString(field));
            }
        }
        // 调用重载函数，删除数据
        return delete(tableName, fieldNameAndValue);
    }
    /**
     * 将传入的数据 更新 到对应的MySQL的表中
     *
     * @param tableName         表名
     * @param underScoreToCamel 是否将驼峰转换为下划线
     * @param object            数据对象（既可以包含更新的主键，也可以不包含）
     * @param fieldNameAndValue 更新时匹配的字段和对应的值
     * @return 返回更新的条数
     */
    public int update(String tableName, boolean underScoreToCamel, Object object, Map<String, Object> fieldNameAndValue) {
        // 将传入的对象转换成JSONObject格式，并判断输入的数据是否符合更新条件
        JSONObject data = JSON.parseObject(disposeSpecialCharacter(object));
        if (fieldNameAndValue == null || fieldNameAndValue.size() == 0) {
            throw new RuntimeException("向MySQL中更新数据异常，输入的更新条件没有指定数据，不能更新（这样更新会全表更新），传入的数据为：" + data);
        }
        // 拼接SQL
        StringBuilder sql = new StringBuilder();
        sql.append(" UPDATE ").append(tableName);
        sql.append(" SET ");
        if (underScoreToCamel) {
            // 删除传入对象中要更新的数据
            for (String key : fieldNameAndValue.keySet()) {
                data.remove(key.contains("_") ? CaseFormat.LOWER_UNDERSCORE.to(CaseFormat.LOWER_CAMEL, key) : key);
            }
            // 拼接要更新的结果值
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                sql
                        .append(CaseFormat.LOWER_CAMEL.to(CaseFormat.LOWER_UNDERSCORE, entry.getKey()))
                        .append(" = ")
                        .append("'")
                        .append(entry.getValue())
                        .append("'")
                        .append(",");
            }
            sql.deleteCharAt(sql.length() - 1);
            // 拼接判断条件
            sql.append(" WHERE ");
            for (Map.Entry<String, Object> fieldNameAndValueEntry : fieldNameAndValue.entrySet()) {
                String key = fieldNameAndValueEntry.getKey();
                Object value = fieldNameAndValueEntry.getValue();
                sql
                        .append(key.contains("_") ? key : CaseFormat.LOWER_CAMEL.to(CaseFormat.LOWER_UNDERSCORE, key))
                        .append(" = ")
                        .append("'")
                        .append(value)
                        .append("'")
                        .append(" AND ");
            }
        } else {
            // 删除传入对象中要更新的数据
            for (String key : fieldNameAndValue.keySet()) {
                data.remove(key);
            }
            // 拼接要更新的结果值
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                sql
                        .append(entry.getKey())
                        .append(" = ")
                        .append("'")
                        .append(entry.getValue())
                        .append("'")
                        .append(",");
            }
            sql.deleteCharAt(sql.length() - 1);
            // 拼接判断条件
            sql.append(" WHERE ");
            for (Map.Entry<String, Object> fieldNameAndValueEntry : fieldNameAndValue.entrySet()) {
                String key = fieldNameAndValueEntry.getKey();
                Object value = fieldNameAndValueEntry.getValue();
                sql
                        .append(key)
                        .append(" = ")
                        .append("'")
                        .append(value)
                        .append("'")
                        .append(" AND ");
            }
        }
        sql.delete(sql.length() - 4, sql.length() - 1);
        // 执行更新操作
        try {
            return jdbcTemplate.update(sql.toString());
        } catch (Exception exception) {
            exception.printStackTrace();
            throw new RuntimeException(
                    "\r\n向MySQL数据库中 更新 数据失败，" +
                            "\r\n抛出的异常信息为：" + exception.getMessage() +
                            "\r\n执行的SQL为：" + sql
            );
        }
    }
    /**
     * 将传入的数据 更新 到对应的MySQL的表中
     *
     * @param tableName         表名
     * @param underScoreToCamel 是否将驼峰转换为下划线
     * @param object            数据对象
     * @param fields            更新时匹配的字段名（如果underScoreToCamel为true，传入的字段为驼峰，如果underScoreToCamel为false，传入的字段为下划线）
     * @return 返回更新的条数
     */
    public int update(String tableName, boolean underScoreToCamel, Object object, String... fields) {
        // 将传入的对象转换成JSONObject格式
        JSONObject data = JSON.parseObject(disposeSpecialCharacter(object));
        // 根据传入的字段，获取要更新的主键值
        HashMap<String, Object> fieldNameAndValue = new HashMap<>();
        for (String field : fields) {
            if (underScoreToCamel) {
                field = field.contains("_") ? CaseFormat.LOWER_UNDERSCORE.to(CaseFormat.LOWER_CAMEL, field) : field;
            }
            fieldNameAndValue.put(field, data.getString(field));
        }
        // 调用重载函数，更新数据
        return update(tableName, underScoreToCamel, object, fieldNameAndValue);
    }
    /**
     * 将传入的数据 upsert 到对应的MySQL的表中
     * 会根据MySQL表中的主键进行更新，如果该主键在表中有对应数据，就更新，没有就插入
     * 传入的数据中必须有主键
     * <p>
     * mysql中的upsert语法：
     * INSERT INTO Student(Stud_ID, Name, Email, City) VALUES (4, 'John', 'john@lidihuo.com', 'New York') ON DUPLICATE KEY UPDATE City = 'California';
     *
     * @param tableName         表名
     * @param underScoreToCamel 是否将驼峰转换为下划线
     * @param object            数据对象
     * @param fieldNameAndValue 更新时匹配的字段名（如果underScoreToCamel为true，传入的字段为驼峰，如果underScoreToCamel为false，传入的字段为下划线）
     * @return 返回更改的条数
     */
    public int upsertByPrimaryKey(String tableName, boolean underScoreToCamel, Object object, Map<String, Object> fieldNameAndValue) {
        // 判断输入的数据是否符合更新条件
        if (fieldNameAndValue == null || fieldNameAndValue.size() == 0) {
            throw new RuntimeException("向MySQL中更新数据异常，输入的更新条件没有指定数据，不能更新（这样更新会全表更新），传入的数据为：" + object);
        }
        // 将传入的object转换成json类型，并将传入的更新匹配字段和值（即fieldNameAndValue），添加到数据对象中（即data）
        JSONObject data = JSON.parseObject(JSON.toJSONString(object));
        for (Map.Entry<String, Object> entry : fieldNameAndValue.entrySet()) {
            data.put(entry.getKey(), entry.getValue());
        }
        data = JSON.parseObject(disposeSpecialCharacter(data));
        // 拼接SQL
        StringBuilder sql = new StringBuilder();
        sql.append(" INSERT INTO ").append(tableName);
        if (underScoreToCamel) {
            sql.append(" ( ");
            for (String key : data.keySet()) {
                sql.append(CaseFormat.LOWER_CAMEL.to(CaseFormat.LOWER_UNDERSCORE, key)).append(",");
            }
            sql.deleteCharAt(sql.length() - 1);
            sql.append(" ) ");
            sql.append(" values ");
            sql.append(" ( ");
            for (Object value : data.values()) {
                sql
                        .append("'")
                        .append(CaseFormat.LOWER_CAMEL.to(CaseFormat.LOWER_UNDERSCORE, value.toString()))
                        .append("'")
                        .append(",");
            }
            sql.deleteCharAt(sql.length() - 1);
            sql.append(" ) ");
            sql.append(" ON DUPLICATE KEY UPDATE ");
            for (Map.Entry<String, Object> entry : fieldNameAndValue.entrySet()) {
                sql
                        .append(CaseFormat.LOWER_CAMEL.to(CaseFormat.LOWER_UNDERSCORE, entry.getKey()))
                        .append(" = ")
                        .append("'")
                        .append(entry.getValue())
                        .append("'")
                        .append(",");
            }
            sql.deleteCharAt(sql.length() - 1);
        } else {
            sql.append(" ( ");
            for (String key : data.keySet()) {
                sql.append(key).append(",");
            }
            sql.deleteCharAt(sql.length() - 1);
            sql.append(" ) ");
            sql.append(" values ");
            sql.append(" ( ");
            for (Object value : data.values()) {
                sql
                        .append("'")
                        .append(value.toString())
                        .append("'")
                        .append(",");
            }
            sql.deleteCharAt(sql.length() - 1);
            sql.append(" ) ");
            sql.append(" ON DUPLICATE KEY UPDATE ");
            for (Map.Entry<String, Object> entry : fieldNameAndValue.entrySet()) {
                sql
                        .append(entry.getKey())
                        .append(" = ")
                        .append("'")
                        .append(entry.getValue())
                        .append("'")
                        .append(",");
            }
            sql.deleteCharAt(sql.length() - 1);
        }
        // 执行upsert操作
        try {
            return jdbcTemplate.update(sql.toString());
        } catch (Exception exception) {
            exception.printStackTrace();
            throw new RuntimeException(
                    "\r\n向MySQL数据库中 upsert 数据失败，" +
                            "\r\n抛出的异常信息为：" + exception.getMessage() +
                            "\r\n执行的SQL为：" + sql
            );
        }
    }
    /**
     * 将传入的数据 upsert 到对应的MySQL的表中
     * 会根据MySQL表中的主键进行更新，如果该主键在表中有对应数据，就更新，没有就插入
     * 传入的数据中必须有主键
     *
     * @param tableName         表名
     * @param underScoreToCamel 是否将驼峰转换为下划线
     * @param object            数据对象
     * @param fields            更新时匹配的字段名（如果underScoreToCamel为true，传入的字段为驼峰，如果underScoreToCamel为false，传入的字段为下划线）
     * @return 返回更改的条数
     */
    public int upsertByPrimaryKey(String tableName, boolean underScoreToCamel, Object object, String... fields) {
        // 将传入的对象转换成JSONObject格式
        JSONObject data = JSON.parseObject(disposeSpecialCharacter(object));
        // 根据传入的字段，获取要更新的主键值
        HashMap<String, Object> fieldNameAndValue = new HashMap<>();
        for (String field : fields) {
            if (underScoreToCamel) {
                field = field.contains("_") ? CaseFormat.LOWER_UNDERSCORE.to(CaseFormat.LOWER_CAMEL, field) : field;
            }
            fieldNameAndValue.put(field, data.getString(field));
        }
        // 调用重载函数，更新数据
        return upsertByPrimaryKey(tableName, underScoreToCamel, object, fieldNameAndValue);
    }
    /**
     * 将传入的数据 upsert 到对应的MySQL数据库的表中
     * 使用的是先用update进行数据更新，如果更新的条数为0，就进行插入
     * 如果表中包含主键，那在传入的数据中也必须要有主键
     *
     * @param tableName         表名
     * @param underScoreToCamel 是否将驼峰转换为下划线
     * @param object            数据对象
     * @param fields            更新时匹配的字段名（如果underScoreToCamel为true，传入的字段为驼峰，如果underScoreToCamel为false，传入的字段为下划线）
     * @return 返回更改的条数
     */
    public int upsert(String tableName, boolean underScoreToCamel, Object object, String... fields) {
        int updateNum = update(tableName, underScoreToCamel, object, fields);
        if (updateNum == 0) {
            insert(tableName, underScoreToCamel, object);
            updateNum = 1;
        }
        return updateNum;
    }
    /**
     * 将传入的数据 upsert 到对应的MySQL数据库的表中
     * 使用的是先用update进行数据更新，如果更新的条数为0，就进行插入
     * 如果表中包含主键，那在传入的数据中也必须要有主键
     *
     * @param tableName         表名
     * @param underScoreToCamel 是否将驼峰转换为下划线
     * @param object            数据对象
     * @param fieldNameAndValue 更新时匹配的字段名（如果underScoreToCamel为true，传入的字段为驼峰，如果underScoreToCamel为false，传入的字段为下划线）
     * @return 返回更改的条数
     */
    public int upsert(String tableName, boolean underScoreToCamel, Object object, Map<String, Object> fieldNameAndValue) {
        int updateNum = update(tableName, underScoreToCamel, object, fieldNameAndValue);
        if (updateNum == 0) {
            insert(tableName, underScoreToCamel, object);
            updateNum = 1;
        }
        return updateNum;
    }
}
```

## 4. 如何使用

以在sink中使用该MySQL进行举例。

该代码实现的需求是：前序使用cdc功能从MySQL中采集到了binlog数据，现在将数据写入到另一个MySQL数据库中（该数据库中需要有对应的表，并且表结构和原数据库的表一模一样）

```java
dwsStream
        .keyBy(new KeySelector<JSONObject, String>() {
            @Override
            public String getKey(JSONObject element) throws Exception {
                // 根据传入的表名和主键进行分组
                StringBuilder result = new StringBuilder();
                result.append(element.getString("table")).append(" : ");
                for (Map.Entry<String, Object> entry : element.getJSONObject("primary_key").getInnerMap().entrySet()) {
                    result.append("key=>").append(entry.getKey()).append(" ; value=>").append(entry.getValue());
                }
                return result.toString();
            }
        })
        .addSink(new RichSinkFunction<JSONObject>() {
            // 声明MySQLUtil变量
            MySQLUtil mySQLUtil;
            @Override
            public void open(Configuration parameters) throws Exception {
                // 在open方法中创建MySQLUtil工具类的对象
                mySQLUtil = new MySQLUtil(
                        ModelUtil.getConfigValue("mysql.yishou.data.url"),
                        ModelUtil.getConfigValue("mysql.yishou.data.username"),
                        ModelUtil.getConfigValue("mysql.yishou.data.password"),
                        2,
                        1
                );
            }
            @Override
            public void invoke(JSONObject element, Context context) throws Exception {
                long start = 0L;
                long end = 0L;
                try {
                    switch (element.getString("type")) {
                        // 对传入数据进行判断，如果是insert或者update就使用upsert系列方法更新数据
                        case "insert":
                        case "update":
                            start = System.currentTimeMillis();
                            mySQLUtil.upsertByPrimaryKey(
                                    element.getString("data_output_topic"),
                                    false,
                                    element.getJSONObject("data"),
                                    element.getJSONObject("primary_key").getInnerMap()
                            );
                            end = System.currentTimeMillis();
                            logger.info("向MySQL中upsert数据，耗时：{}, 操作的表名为：{}, 数据中的时间戳为：{}", (end - start), element.getString("data_output_topic"), element.getString("ts"));
                            break;
                        // 如果是delete类型数据，就使用delete方法删除数据
                        case "delete":
                            start = System.currentTimeMillis();
                            mySQLUtil.delete(element.getString("data_output_topic"), element.getJSONObject("primary_key").getInnerMap());
                            end = System.currentTimeMillis();
                            logger.info("向MySQL中delete数据，耗时：{}, 操作的表名为：{}, 数据中的时间戳为：{}", (end - start), element.getString("data_output_topic"), element.getString("ts"));
                            break;
                        // 当是其他类型的数据，不进行操作
                        default:
                            logger.error("无匹配，跳过，传入的数据为：{}", element.toJSONString());
                            break;
                    }
                } catch (Exception e) {
                    throw new RuntimeException(" ==> " + element);
                }
            }
        })
```

## 5. Hikari连接池各配置说明

```java
 
# Hikari will use the above plus the following to setup connection pooling
spring.datasource.type=com.zaxxer.hikari.HikariDataSource
#最小空闲连接，默认值10，小于0或大于maximum-pool-size，都会重置为maximum-pool-size
spring.datasource.hikari.minimum-idle=5
#最大连接数，小于等于0会被重置为默认值10；大于零小于1会被重置为minimum-idle的值
spring.datasource.hikari.maximum-pool-size=15
#自动提交从池中返回的连接，默认值为true
spring.datasource.hikari.auto-commit=true
#空闲连接超时时间，默认值600000（10分钟），大于等于max-lifetime且max-lifetime>0，会被重置为0；不等于0且小于10秒，会被重置为10秒。
#只有空闲连接数大于最大连接数且空闲时间超过该值，才会被释放
spring.datasource.hikari.idle-timeout=30000
#连接池名称，默认HikariPool-1
spring.datasource.hikari.pool-name=Hikari
#连接最大存活时间.不等于0且小于30秒，会被重置为默认值30分钟.设置应该比mysql设置的超时时间短；单位ms
spring.datasource.hikari.max-lifetime=55000
#连接超时时间:毫秒，小于250毫秒，会被重置为默认值30秒
spring.datasource.hikari.connection-timeout=30000
#连接测试查询
spring.datasource.hikari.connection-test-query=SELECT 1
```

## 6. 注意点

在使用上述方法时，因为是手动拼接SQL，并且会过滤值为空的字段，这样的话，需要在创建MySQL表时，不能设置该字段not null，或者设置该字段为not null但给该字段默认值。

但是在MySQL8.x版本中，对一下类型，比如json类型等不能设置默认值，此时可以在建表的时候先设置 sql_mode 为 空，然后在建表，就可以给这些字段设置默认值了。

默认的sql_mode 的值：

设置sql_mode 为 空（注意：不修改配置文件的话，只在此会话中生效）：

## 7. 静态MySQLUtil工具类

在上述的工具类中，每次创建都需要进行new MySQLUtil()操作，来设置需要操作的MySQL的具体属性以及连接属性，这在将数据写入到MySQL库中是比较方便的；但当我们需要进行维度匹配时，一个作业中可能很多算子都是用的一个库，这样我们每个算子中都创建一个MySQL连接客户端就比较麻烦了，而且可能也会浪费资源。

这时我们就可以将这个库的MySQL创建成一个静态的工具类，这样在所有作业中就不需要创建了，可以直接使用；而且因为静态的特性，在每台机器上只会创建一个连接池，这样也比较能节省资源（当然，连接池的大小不能跟上述设置成最小为1，最大为2一样，博主在生产环境中一般设置为最小为5，最大为50，这样在一台机器上设置4个并发，经过博主的压测，最高查询次数为1500次/秒）。

具体代码如下所示（因为主要是维度匹配，所以全部都是查询方法）：

```java
package com.yishou.bigdata.common.utils;
import com.google.common.base.CaseFormat;
import com.zaxxer.hikari.HikariDataSource;
import org.apache.commons.beanutils.BeanUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.*;
import java.util.stream.Collectors;
/**
 * @date: 2021/7/5
 *  @Author ddkk.com  弟弟快看，程序员编程资料站
 * @desc: 对数据库R7（MySQL）的工具类
 */
public class MySQLR7Util {
    static Logger logger = LoggerFactory.getLogger(MySQLR7Util.class);
    /**
     * jdbcTemplate
     */
    private static JdbcTemplate jdbcTemplate;
    /**
     * 使用单例模式获取MySQL数据库R7的连接
     *
     * @return jdbc连接
     */
    public static JdbcTemplate getJdbcTemplate() {
        if (jdbcTemplate == null) {
            synchronized (MySQLR7Util.class) {
                if (jdbcTemplate == null) {
                    try {
                        HikariDataSource ds = new HikariDataSource();
                        ds.setDriverClassName("com.mysql.cj.jdbc.Driver");
                        ds.setJdbcUrl(ModelUtil.getConfigValue("mysql.r7.yishou.url"));
                        ds.setUsername(ModelUtil.getConfigValue("mysql.r7.username"));
                        ds.setPassword(ModelUtil.getConfigValue("mysql.r7.password"));
                        ds.setMaximumPoolSize(50);
                        ds.setMinimumIdle(5);
                        jdbcTemplate = new JdbcTemplate(ds);
                        logger.info(
                                "##### 使用HikariPool连接池初始化JdbcTemplate成功，使用的URL为：{} , 其中最大连接大小为：{} , 最小连接大小为：{} ;",
                                ds.getJdbcUrl(),
                                ds.getMaximumPoolSize(),
                                ds.getMinimumIdle()
                        );
                    } catch (Exception e) {
                        e.printStackTrace();
                        throw new RuntimeException("创建 MySQL R7 数据库连接失败");
                    }
                }
            }
        }
        return jdbcTemplate;
    }
    /**
     * 处理传入数据中的特殊字符（例如： 单引号）
     *
     * @param data 传入的数据
     * @return 返回的结果
     */
    public static String disposeSpecialCharacter(String data) {
        // 处理其中的单引号
        data = data.replace("'", "''");
        // 返回结果
        return data;
    }
    /**
     * 通过传入的表名，主键key，主键value，样例类 和 需要的值，获取对应的数据
     *
     * @param tableName    表名
     * @param primaryKey   主键字段
     * @param primaryValue 主键值
     * @param clz          返回的数据类型
     * @param fields       需要的字段名
     * @param <T>          样例类
     * @return 样例类集合
     */
    public static <T> List<T> queryListByKey(String tableName, String primaryKey, String primaryValue, Class<T> clz, String... fields) {
        // 拼接SQL
        String sql = " select " +
                Arrays.stream(fields).map(String::valueOf).collect(Collectors.joining(",")) +
                " from " + tableName +
                " where " + primaryKey + " = '" + disposeSpecialCharacter(primaryValue) + "'";
        // 执行SQL并返回结果
        return queryList(sql, clz);
    }
    /**
     * 如果传入的clz中的属性又包含对象，会报错，此时传入JSONObject对象即可
     *
     * @param sql 执行的查询语句
     * @param clz 返回的数据类型
     * @param <T> 样例类
     * @return 样例类集合
     */
    public static <T> List<T> queryList(String sql, Class<T> clz) {
        try {
            List<Map<String, Object>> mapList = MySQLR7Util.getJdbcTemplate().queryForList(sql);
            List<T> resultList = new ArrayList<>();
            for (Map<String, Object> map : mapList) {
                Set<String> keys = map.keySet();
                // 当返回的结果中存在数据，通过反射将数据封装成样例类对象
                T result = clz.newInstance();
                for (String key : keys) {
                    BeanUtils.setProperty(
                            result,
                            key,
                            map.get(key)
                    );
                }
                resultList.add(result);
            }
            return resultList;
        } catch (Exception exception) {
            exception.printStackTrace();
            throw new RuntimeException(
                    "\r\n从 MySQL R7 数据库中 查询 数据失败，" +
                            "\r\n抛出的异常信息为：" + exception.getMessage() +
                            "\r\n查询的SQL为：" + sql
            );
        }
    }
    /**
     * 如果传入的clz中的属性又包含对象，会报错，此时传入JSONObject对象即可
     *
     * @param sql               执行的查询语句
     * @param underScoreToCamel 是否将下划线转换为驼峰命名法
     * @param clz               返回的数据类型
     * @param <T  样例类
     * @return 样例类集合
     */
    public static <T> List<T> queryList(String sql, boolean underScoreToCamel, Class<T> clz) {
        try {
            List<Map<String, Object>> mapList = MySQLR7Util.getJdbcTemplate().queryForList(sql);
            List<T> resultList = new ArrayList<>();
            for (Map<String, Object> map : mapList) {
                Set<String> keys = map.keySet();
                // 当返回的结果中存在数据，通过反射将数据封装成样例类对象
                T result = clz.newInstance();
                for (String key : keys) {
                    String propertyName = underScoreToCamel ? CaseFormat.LOWER_UNDERSCORE.to(CaseFormat.LOWER_CAMEL, key) : key;
                    BeanUtils.setProperty(
                            result,
                            propertyName,
                            map.get(key)
                    );
                }
                resultList.add(result);
            }
            return resultList;
        } catch (Exception exception) {
            exception.printStackTrace();
            throw new RuntimeException(
                    "\r\n从 MySQL R7 数据库中 查询 数据失败，" +
                            "\r\n抛出的异常信息为：" + exception.getMessage() +
                            "\r\n查询的SQL为：" + sql
            );
        }
    }
}
```

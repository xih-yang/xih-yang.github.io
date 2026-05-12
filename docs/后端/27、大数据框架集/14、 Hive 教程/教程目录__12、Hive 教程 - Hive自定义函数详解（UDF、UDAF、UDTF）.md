# 12、Hive 教程 - Hive自定义函数详解（UDF、UDAF、UDTF）
- 来源：https://ddkk.com/zhuanlan/bigdata/hive/2/12.html
- 分类：大数据框架
- 分组：教程目录
## 前言

在前面，我详细的整理了[【Hive】（十一）Hive 内置函数集合](/zhuanlan/bigdata/hive/2/11.html)，但有的时候面对复杂的业务场景，系统的内置函数难免力有不逮，这时候就是我们自定义函数派上用场的时候了！✌

## 一、自定义函数

1）Hive 自带了一些函数，比如：max/min等，但是数量有限，自己可以通过自定义UDF来方便的扩展。

2）当Hive提供的内置函数无法满足你的业务处理需要时，此时就可以考虑使用**用户自定义函数**（UDF：user-defined function）。

3）根据用户自定义函数类别分为以下三种：

- UDF（User-Defined-Function） 用户定义函数

一进一出
- UDAF（User-Defined Aggregation Function） 用户定义聚集函数

聚集函数，多进一出

类似于：count/max/min
- UDTF（User-Defined Table-Generating Functions）用户定义表生成函数

一进多出

如lateral view explore()

**UDF** 操作作用于单个数据行，并且产生一个数据行作为输出。大多数函数都属于这一类（比如数学函数和字符串函数）。

**UDAF** 接受多个输入数据行，并产生一个输出数据行。像COUNT和MAX这样的函数就是聚集函数。

**UDTF** 操作作用于单个数据行，并且产生多个数据行-------一个表作为输出。

**简单来说：

UDF:返回对应值，一对一 | UDAF：返回聚类值，多对一 | UDTF：返回拆分值，一对多**

## 二、UDF：用户定义（普通）函数，只对单行数值产生作用

### 1．创建一个Maven工程Hive

### 2．导入依赖

```java
    <!-- https://mvnrepository.com/artifact/org.apache.hive/hive-exec -->
    <dependency>
      <groupId>org.apache.hive</groupId>
      <artifactId>hive-exec</artifactId>
      <version>1.1.0</version>
    </dependency>
```

### 3．创建一个类

（1）继承org.apache.hadoop.hive.ql.UDF

（2）需要实现evaluate函数；evaluate函数支持重载

（3）在hive的命令行窗口创建函数

（4）在hive的命令行窗口删除函数

`Drop [temporary] function [if exists] [dbname.]function_name`

```java
hive> drop temporary function iu;
```

**示例如下：**

```java
package com.kgc.services.udf;
import org.apache.hadoop.hive.ql.exec.UDF;
/**
 * @author：Tokgo J
 * @date：2019/12/16
 * @aim：
 */
public class InitialUpper extends UDF {
    public String evaluate(final String txt){
        return txt.substring(0,1).toUpperCase()+txt.substring(1);
    }
}
```

### 4．打成jar包上传到服务器/opt/soft/data/udf.jar

### 5．将jar包添加到hive的classpath

- **添加jar**

`add jar linux_jar_path`

```java
hive> add jar /opt/soft/data/fun.jar;
Added [/opt/soft/data/fun.jar] to class path
Added resources: [/opt/soft/data/fun.jar]
```

### 6．创建临时函数与开发好的java class关联

- **创建function**

`create [temporary] function [dbname.]function_name AS class_name`

```java
hive> create temporary function iu as 'com.kgc.services.udf.InitialUpper';
```

### 7．即可在hql中使用自定义的函数

```java
hive> select iu(name) from mtest;
```

## 三、UDAF：User- Defined Aggregation Funcation 用户定义聚合函数，可对多行数据产生作用；等同与SQL中常用的SUM()，AVG()，也是聚合函数

UDAF实现有简单与通用两种方式：

a.简单UDAF因为使用Java反射导致性能损失，而且有些特性不能使用，已经被弃用了；

View Code

b.另一种涉及两个类：`AbstractGenericUDAFResolver`、`GenericUDAFEvaluator`；

继承UDAFResolver类，重写 getEvaluator() 方法；

继承GenericUDAFEvaluator类，生成实例给getEvaluator()；

在GenericUDAFEvaluator类中，重写init()、iterate()、terminatePartial()、merge()、terminate()方法

```java
package com.kgc.services.udaf;
import org.apache.hadoop.hive.ql.exec.UDAF;
import org.apache.hadoop.hive.ql.exec.UDAFEvaluator;
/**
 * @author：Tokgo J
 * @date：2019/12/17
 * @aim：将用户名连成一行 多进一出 依靠内部类进行加工
 *
 */
public class LinkStr extends UDAF {
    private static String result = "";
    public static class  MyLinkimplements UDAFEvaluator{
        @Override
        public void init() {
        }
        // 聚合工作，写业务逻辑  一部分map的功能 
        public boolean iterate(String name){
            result = result.concat(name);
            return true;
        }
        // 一部分mapper作用，大部分是combiner作用 分组 分割
        public String terminatePartial(){
            return result;
        }
        // partition
        public boolean merge(String name){
            return iterate(name);
        }
		// reduce 的一部分功能
        public String terminate(){
            return result;
        }
    }
}
```

## 四、UDTF：User-Defined Table-Generating Functions，用户定义表生成函数，用来解决输入一行输出多行

继承GenericUDTF类，重写initialize（返回输出行信息：列个数，类型）, process, close三方法

```java
package com.kgc.services.udtf;
import org.apache.hadoop.hive.ql.exec.UDFArgumentException;
import org.apache.hadoop.hive.ql.metadata.HiveException;
import org.apache.hadoop.hive.ql.udf.generic.GenericUDTF;
import org.apache.hadoop.hive.serde2.objectinspector.ObjectInspector;
import org.apache.hadoop.hive.serde2.objectinspector.ObjectInspectorFactory;
import org.apache.hadoop.hive.serde2.objectinspector.StructObjectInspector;
import org.apache.hadoop.hive.serde2.objectinspector.primitive.PrimitiveObjectInspectorFactory;
import java.util.ArrayList;
/**
 * @author：Tokgo J
 * @date：2019/12/17
 * @aim：一对多
 */
public class SplitMap extends GenericUDTF {
    // 产生语句翻译后的表结构
    @Override
    public StructObjectInspector initialize(ObjectInspector[] argOIs) throws UDFArgumentException {
        ArrayList<String> columns = new ArrayList<String>();
        ArrayList<ObjectInspector> colTypes = new ArrayList<ObjectInspector>();
        // 第一列字段名
        columns.add("col1");
        // 第一列结构类型
        colTypes.add(PrimitiveObjectInspectorFactory.javaStringObjectInspector);
        columns.add("col2");
        colTypes.add(PrimitiveObjectInspectorFactory.javaStringObjectInspector);
        return ObjectInspectorFactory.getStandardStructObjectInspector(columns,colTypes);
    }
    @Override
    public void process(Object[] objects) throws HiveException {
        String[] datas = objects[0].toString().split(";");  // [“name:zs”,"age:40"]
        String[] res = new String[2];
        res[0] = datas[0].split(":")[1];
        res[1] = datas[1].split(":")[1];
        // 一行一个forward()
        forward(res);  //把写好的数据上传到上一个表结构
    }
    @Override
    public void close() throws HiveException {
    }
}
```

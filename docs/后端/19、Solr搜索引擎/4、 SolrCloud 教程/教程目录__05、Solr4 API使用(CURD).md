# 05、Solr4 API使用(CURD)
- 来源：https://ddkk.com/zhuanlan/search/solrcloud/5.html
- 分类：搜索引擎
- 分组：教程目录
**1.在工程中引入solr-solrj-4.10.3.jar**

```xml
<dependency>
    <groupId>org.apache.solr</groupId>
    <artifactId>solr-solrj</artifactId>
    <version>4.10.3</version>
</dependency>
```

**2.Solr的增删改查**

**(1)schema.xml配置修改**

```xml
<field name="stu_name" type="text_ik" indexed="true" stored="true" multiValued="false" /> 
<field name="stu_sex" type="int" indexed="true" stored="true" multiValued="false" /> 
<field name="stu_address" type="text_ik" indexed="true" stored="true" multiValued="false" />
```

**(2)Student.java**

```java
package cn.ljh.ssm.test;
import org.apache.solr.client.solrj.beans.Field;
public class Student{
    @Field("id")
    private String id;
    @Field("stu_name")
    private String name;
    @Field("stu_sex")
    private int sex;
    @Field("stu_address")
    private String address;
    public String getId() {
        return id;
    }
    public void setId(String id) {
        this.id = id;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public int getSex() {
        return sex;
    }
    public void setSex(int sex) {
        this.sex = sex;
    }
    public String getAddress() {
        return address;
    }
    public void setAddress(String address) {
        this.address = address;
    }
    @Override
    public String toString() {
        return "Student [id=" + id + ", name=" + name + ", sex=" + sex
                + ", address=" + address + "]";
    }
}
```

**(3)HttpSolrServerSingleton.java**

```java
package cn.ljh.ssm.test;
import org.apache.solr.client.solrj.impl.HttpSolrServer;
public class HttpSolrServerSingleton {
     //solr server URL指的时solr发布到web工程后的访问路径
     private final static String SolrURL = "http://192.168.137.168:8080/solr";
     //使用懒汉式单例中的静态内部类方式
     private static class HttpSolrServerSingletonContainer{
         private static HttpSolrServer instance = new HttpSolrServer(
                 HttpSolrServerSingleton.SolrURL);
     }
     //solrServer是线程安全的，所以在使用时需要使用单例的模式，减少资源的消耗
     public static HttpSolrServer getInstance(){
            return HttpSolrServerSingletonContainer.instance;
     }
}
```

**(4)SolrHelloWorldTest.java**

```java
package cn.ljh.ssm.test;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.HttpSolrServer;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.apache.solr.common.SolrDocument;
import org.apache.solr.common.SolrDocumentList;
import org.apache.solr.common.SolrInputDocument;
import org.junit.Test;
public class SolrHelloWorldTest {
    @Test
    public void testAdd(){
        try {
            HttpSolrServer server = HttpSolrServerSingleton.getInstance();
            //先删除所有数据
            server.deleteByQuery("*:*");
            SolrInputDocument doc = new SolrInputDocument();
            doc.addField("id",String.valueOf(1));
            doc.addField("name","apple phone");
            doc.addField("price","6000");
            server.add(doc);
            SolrInputDocument doc2 = new SolrInputDocument();
            doc2.addField("id",String.valueOf(2));
            doc2.addField("name","huawei phone");
            doc2.addField("price","1000");
            server.add(doc2);
            SolrInputDocument doc3 = new SolrInputDocument();
            doc3.addField("id",String.valueOf(3));
            doc3.addField("name","mi phone");
            doc3.addField("price","2000");
            server.add(doc3);
            SolrInputDocument doc5 = new SolrInputDocument();
            doc5.addField("id",String.valueOf(15));
            doc5.addField("name","mi phone02");
            doc5.addField("price","2000");
            server.add(doc5);
            Random random = new Random();
            for (int i = 0; i < 10; i++) {
                SolrInputDocument doc4 = new SolrInputDocument();
                doc4.addField("id",i+4);
                doc4.addField("name","phone"+i);
                doc4.addField("price",random.nextInt(2000));
                server.add(doc4);
            }
            server.commit();//提交，将所有更新提交到索引中
        } catch (SolrServerException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    /**
     * 使用POJO添加document
     */
    @Test
    public void testAddStudent(){
        try {
            HttpSolrServer server = HttpSolrServerSingleton.getInstance();
            List<Student> studentList = new ArrayList<Student>();
            Student stu1 = new Student();
            stu1.setId("103");
            stu1.setName("张小强");
            stu1.setSex(1);
            stu1.setAddress("北京市海淀区知春路");
            studentList.add(stu1);
            stu1 = new Student();
            stu1.setId("104");
            stu1.setName("刘小米");
            stu1.setSex(0);
            stu1.setAddress("北京市海淀区北苑路");
            studentList.add(stu1);
            server.addBeans(studentList);
            server.commit();
        } catch (SolrServerException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    @Test
    public void testQueryStudent(){
        try {
            HttpSolrServer server = HttpSolrServerSingleton.getInstance();
            String strQuery = "stu_name:小米";//q表示查询的内容
            SolrQuery query = new SolrQuery(strQuery);
            QueryResponse resp = server.query(query);
            SolrDocumentList sdList = resp.getResults();
            long totalResults = sdList.getNumFound();//命中的总记录数
            System.out.println("totalResults-->"+totalResults);
            for(SolrDocument sd:sdList){
                Student student = server.getBinder().getBean(Student.class, sd);
                System.out.println(student);
            }
        } catch (SolrServerException e) {
            e.printStackTrace();
        }
    }
    @Test
    public void testQuery(){
        try {
            HttpSolrServer server = HttpSolrServerSingleton.getInstance();
            String strQuery = "name:apple";//q表示查询的内容
            SolrQuery query = new SolrQuery();
            query.set("q",strQuery);
            QueryResponse resp = server.query(query);
            SolrDocumentList sdList = resp.getResults();
            long totalResults = sdList.getNumFound();//命中的总记录数
            System.out.println("totalResults-->"+totalResults);
            for(SolrDocument sd:sdList){
                System.out.print("id:" + sd.getFieldValue("id") +
                        " " + "name:" + sd.getFieldValue("name") +
                        " " + "price:" + sd.getFieldValue("price"));
            }
        } catch (SolrServerException e) {
            e.printStackTrace();
        }
    }
    @Test
    public void testDelete(){
         try {
             HttpSolrServer server = HttpSolrServerSingleton.getInstance();
             server.deleteById("1");
             server.deleteByQuery("id:2 id:3");
             server.commit();
         } catch (Exception e) {
             e.printStackTrace();
         }
    }
}
```
